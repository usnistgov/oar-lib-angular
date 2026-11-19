import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, inject, signal, computed } from '@angular/core'
import {
  LEVEL_PERMS, PermissionLevel,
  subjectPermissionLevel, withSubjectAtLevel, withSubjectsAtLevel, withoutSubject
} from '../permission-level'
import { Subject, Subscription, Observable, of, forkJoin } from 'rxjs'
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { GroupsService } from '../groups.service'
import { PermissionsService } from '../permissions.service'
import { NsdService } from '../nsd.service'
import { SubjectLabelService, PersonEntry, isGroupSubject } from '../subject-label.service'
import { Group, RecordRef, Acls, AclPerm } from '../group.types'
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog.component'

function searchStatus(n: number): string {
  if (n === 0) return 'No matches'
  return n === 1 ? '1 suggestion' : `${n} suggestions`
}

@Component({
  selector: 'oarng-permission-manager',
  templateUrl: './permission-manager.component.html',
  styleUrl: './permission-manager.component.scss'
})
export class PermissionManagerComponent implements OnChanges, OnDestroy {
  @Input() records: RecordRef[] = []
  @Input() layout: 'compact' | 'panel' = 'compact'
  @Input() userOu: string = ''
  @Input() section: 'permissions' | 'groups' = 'permissions'
  // When set, a hint linking to the MIDAS portal is shown under the group search
  @Input() groupsPortalUrl: string = ''

  @Output() permissionsChanged = new EventEmitter<void>()

  private groupsSvc = inject(GroupsService)
  private permsSvc = inject(PermissionsService)
  private nsd = inject(NsdService)
  private labelSvc = inject(SubjectLabelService)
  private dialog = inject(MatDialog)

  // ── Graduated permission model ────────────────────────────────────────────

  // kept on the class because it is part of the published API
  readonly LEVEL_PERMS = LEVEL_PERMS

  private readonly NIST_ORG_TYPES = [
    { endpoint: 'OU',    prefix: 'nistou'  as const },
    { endpoint: 'Div',   prefix: 'nistdiv' as const },
    { endpoint: 'Group', prefix: 'nistgrp' as const },
  ]

  // ── Groups state ──────────────────────────────────────────────────────────
  groups = signal<Group[]>([])
  groupsLoading = signal(false)
  groupsError = signal<string | null>(null)

  expandedGroupId = signal<string | null>(null)
  showNewGroupForm = signal(false)
  newGroupName = ''

  // ── ACL state ─────────────────────────────────────────────────────────────
  acls = signal<Acls | null>(null)
  aclsLoading = signal(false)
  aclsError = signal<string | null>(null)

  readonly singleRecord = signal<RecordRef | null>(null)

  /** a write is in flight; the chips must not accept another until it lands */
  readonly aclsBusy = signal(false)
  /** a failed write used to reach the console only, so it looked like nothing happened */
  readonly aclsWriteError = signal<string | null>(null)

  readonly uniqueSubjects = computed(() => {
    const acls = this.acls()
    if (!acls) return []
    return Array.from(new Set([
      ...(acls.read ?? []),
      ...(acls.write ?? []),
      ...(acls.admin ?? []),
      ...(acls.delete ?? []),
    ]))
  })

  readonly subjectsByLevel = computed(() => {
    const subjects = this.uniqueSubjects()
    const admin: string[] = []
    const update: string[] = []
    const view: string[] = []
    for (const s of subjects) {
      const level = this.subjectLevel(s)
      if (level === 'admin') admin.push(s)
      else if (level === 'update') update.push(s)
      else if (level === 'view') view.push(s)
    }
    return { admin, update, view }
  })

  // ── User's NIST org units ─────────────────────────────────────────────────
  nistOrgs = signal<{ id: string; name: string; code: string; type: 'nistou' | 'nistdiv' | 'nistgrp' }[]>([])
  nistOrgsLoading = signal(false)

  // ── People picker state ────────────────────────────────────────────────────
  showAddPanel = signal(false)
  grantLevelValue: 'view' | 'update' | 'admin' = 'update'
  peopleQuery = ''
  peopleSuggestions = signal<PersonEntry[]>([])
  staged = signal<PersonEntry[]>([])
  peopleSearchLoading = signal(false)
  /**
   * Spoken by the live region beside the field. Choosing a suggestion used to
   * leave the name in the input, which is what a screen reader read back; the
   * input is cleared on selection, so how many matches there are and who was
   * added have to be said instead.
   */
  peopleStatus = signal('')
  // labels live in the service so a host app's own views resolve each subject once
  readonly subjectLabels = this.labelSvc.labels

  // ── Bulk grant state (multiple records) ──────────────────────────────────
  bulkLevel: 'view' | 'update' | 'admin' = 'update'
  bulkGranting = signal(false)
  bulkGrantError = signal<string | null>(null)

  // ── Group search state ────────────────────────────────────────────────────
  groupQuery = ''
  groupSuggestions = signal<{ id: string; name: string; code: string; type: 'midas' | 'nistou' | 'nistdiv' | 'nistgrp' }[]>([])

  // ── Group member search state ─────────────────────────────────────────────
  memberQuery = ''
  memberSuggestions = signal<PersonEntry[]>([])
  memberSearchLoading = signal(false)
  memberStatus = signal('')

  private searchInput$ = new Subject<string>()
  private searchSub!: Subscription
  private groupSearchInput$ = new Subject<string>()
  private groupSearchSub!: Subscription
  private memberSearchInput$ = new Subject<string>()
  private memberSearchSub!: Subscription

  constructor() {
    this.searchSub = this.searchInput$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) return of(null)
        this.peopleSearchLoading.set(true)
        return this.nsd.searchPeople(query).pipe(
          map(raw => ({ raw, query })),
          catchError(() => of(null))
        )
      })
    ).subscribe(result => {
      this.peopleSearchLoading.set(false)
      if (!result) { this.peopleSuggestions.set([]); this.peopleStatus.set(''); return }
      const { raw, query } = result
      const matches = this.labelSvc.personMatcher(query)
      const found = this.labelSvc.parsePeopleIndex(raw).filter(p => matches(p.label)).slice(0, 10)
      this.peopleSuggestions.set(found)
      this.peopleStatus.set(searchStatus(found.length))
    })

    this.groupSearchSub = this.groupSearchInput$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 3) return of([])
        const q = query.toLowerCase()
        const wordPrefixMatch = this.labelSvc.wordPrefixMatcher(query)
        const midas = this.groups()
          .filter(g => wordPrefixMatch(g.name) || g.id.toLowerCase().startsWith(q))
          .slice(0, 5)
          .map(g => ({ id: g.id, name: g.name, code: '', type: 'midas' as const }))
        return this.labelSvc.searchOrgs(query).pipe(
          map(orgs => [...midas, ...orgs].slice(0, 10))
        )
      })
    ).subscribe(suggestions => this.groupSuggestions.set(suggestions))

    this.memberSearchSub = this.memberSearchInput$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) return of(null)
        this.memberSearchLoading.set(true)
        return this.nsd.searchPeople(query).pipe(
          map(raw => ({ raw, query })),
          catchError(() => of(null))
        )
      })
    ).subscribe(result => {
      this.memberSearchLoading.set(false)
      if (!result) { this.memberSuggestions.set([]); this.memberStatus.set(''); return }
      const { raw, query } = result
      const matches = this.labelSvc.personMatcher(query)
      const found = this.labelSvc.parsePeopleIndex(raw).filter(p => matches(p.label)).slice(0, 10)
      this.memberSuggestions.set(found)
      this.memberStatus.set(searchStatus(found.length))
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['records']) {
      this.singleRecord.set(this.records.length === 1 ? this.records[0] : null)
      this.loadGroups()
      this.loadAcls()
    } else if (changes['section'] && this.section === 'groups') {
      // Only load groups when section changes to 'groups' and records didn't also change —
      // if records changed, loadGroups was already called above.
      this.loadGroups()
    }
    if (changes['userOu'] && this.userOu) {
      this.loadNistOrgs(this.userOu)
    }
  }

  grantBulk(): void {
    const people = this.staged()
    const level = this.bulkLevel
    if (!people.length || !this.records.length) return

    this.bulkGranting.set(true)
    this.bulkGrantError.set(null)

    const subjects = people.map(person => person.id)
    // `acls` only ever holds the single selected record, so each record is read
    // here: a write built without its snapshot would drop what it already had.
    const ops: Observable<unknown>[] = this.records.map(record =>
      this.permsSvc.getAcls(record).pipe(
        switchMap(current =>
          this.permsSvc.setAcls(record, withSubjectsAtLevel(current, subjects, level)))
      )
    )

    forkJoin(ops).subscribe({
      next: () => {
        this.bulkGranting.set(false)
        this.staged.set([])
        this.peopleQuery = ''
        this.groupQuery = ''
        this.peopleSuggestions.set([])
        this.groupSuggestions.set([])
        this.permissionsChanged.emit()
      },
      error: (err) => {
        this.bulkGranting.set(false)
        // forkJoin gives up on the first failure, so the records before it are
        // written, the rest may never have been tried, and we cannot say which
        // is which. Staged is left alone so the whole grant can simply be redone.
        this.bulkGrantError.set(
          'Some of the selected records may not have been updated. Check them and try again.'
        )
        // whatever did land is already live; consumers must not keep showing the old state
        this.permissionsChanged.emit()
        console.error('[PermissionManager] bulk grant error:', err)
      }
    })
  }

  ngOnDestroy(): void {
    this.searchSub.unsubscribe()
    this.groupSearchSub.unsubscribe()
    this.memberSearchSub.unsubscribe()
  }

  // ── Groups CRUD ───────────────────────────────────────────────────────────

  loadGroups(): void {
    this.groupsLoading.set(true)
    this.groupsError.set(null)
    this.groupsSvc.getGroups().subscribe({
      next: groups => {
        this.groups.set(groups)
        this.groupsLoading.set(false)
        // Resolve any ACL subjects that are MIDAS group IDs
        const acls = this.acls()
        if (acls) this.resolveUnknownLabels(acls)
      },
      error: err => {
        this.groupsError.set('Could not load groups.')
        this.groupsLoading.set(false)
        console.error('[PermissionManager] loadGroups error:', err)
      }
    })
  }

  private resolveUnknownLabels(acls: Acls): void {
    this.labelSvc.resolve([
      ...(acls.read ?? []),
      ...(acls.write ?? []),
      ...(acls.admin ?? []),
      ...(acls.delete ?? []),
    ], this.groups())
  }

  createGroup(): void {
    const name = this.newGroupName.trim()
    if (!name) return
    this.groupsSvc.createGroup(name).subscribe({
      next: group => {
        this.groups.update(gs => [...gs, group])
        this.newGroupName = ''
        this.showNewGroupForm.set(false)
      },
      error: err => console.error('[PermissionManager] createGroup error:', err)
    })
  }

  cancelCreate(): void {
    this.newGroupName = ''
    this.showNewGroupForm.set(false)
  }

  deleteGroup(groupId: string): void {
    this.groupsSvc.deleteGroup(groupId).subscribe({
      next: () => {
        this.groups.update(gs => gs.filter(g => g.id !== groupId))
        if (this.expandedGroupId() === groupId) this.expandedGroupId.set(null)
      },
      error: err => console.error('[PermissionManager] deleteGroup error:', err)
    })
  }

  removeGroupMember(groupId: string, memberId: string): void {
    this.groupsSvc.removeMember(groupId, memberId).subscribe({
      next: () => {
        this.groups.update(gs => gs.map(g =>
          g.id === groupId ? { ...g, members: g.members.filter(m => m !== memberId) } : g
        ))
      },
      error: err => console.error('[PermissionManager] removeMember error:', err)
    })
  }

  onMemberQueryChange(query: string): void {
    if (query.length < 2) this.memberSuggestions.set([])
    this.memberSearchInput$.next(query)
  }

  addGroupMember(groupId: string, person: PersonEntry): void {
    setTimeout(() => { this.memberQuery = ''; this.memberSuggestions.set([]) })

    const doAdd = (memberId: string) => {
      this.groupsSvc.addMember(groupId, memberId).subscribe({
        next: updatedMembers => {
          this.groups.update(gs => gs.map(g =>
            g.id === groupId ? { ...g, members: updatedMembers } : g
          ))
          // the row renders the resolved label, so say the same thing it shows
          this.labelSvc.set(memberId, person.label)
          this.memberStatus.set(`${person.label} added`)
        },
        error: err => {
          console.error('[PermissionManager] addMember error:', err)
          this.memberStatus.set(`${person.label} could not be added`)
        }
      })
    }

    this.nsd.getPerson(person.id).subscribe({
      next: found => doAdd(found?.nistUsername || person.id),
      error: () => doAdd(person.id)
    })
  }

  toggleGroup(id: string): void {
    this.expandedGroupId.update(cur => cur === id ? null : id)
    // the next group opens its own live region; it must not inherit this one's
    this.memberQuery = ''
    this.memberSuggestions.set([])
    this.memberStatus.set('')
  }

  // ── ACL ───────────────────────────────────────────────────────────────────

  loadAcls(): void {
    const record = this.singleRecord()
    if (!record) { this.acls.set(null); return }

    this.aclsLoading.set(true)
    this.aclsError.set(null)
    this.permsSvc.getAcls(record).subscribe({
      next: acls => {
        this.acls.set(acls)
        this.aclsLoading.set(false)
        this.resolveUnknownLabels(acls)
      },
      error: err => {
        this.aclsError.set('Could not load permissions.')
        this.aclsLoading.set(false)
        console.error('[PermissionManager] loadAcls error:', err)
      }
    })
  }

  subjectsFor(perm: AclPerm): string[] {
    return this.acls()?.[perm] ?? []
  }

  subjectLevel(subject: string): PermissionLevel | null {
    return subjectPermissionLevel(this.acls(), subject)
  }

  isGroup(subject: string): boolean {
    return isGroupSubject(subject, this.groups())
  }


  /**
   * One request expresses one intent.  Granting admin used to mean four separate
   * writes, each a read-modify-write of the whole record server-side, so the
   * record's final state depended on which of them the server handled last.
   */
  private writeAcls(record: RecordRef, acls: Acls, emitChange = true): void {
    this.aclsBusy.set(true)
    this.aclsWriteError.set(null)
    this.permsSvc.setAcls(record, acls).subscribe({
      next: () => {
        this.aclsBusy.set(false)
        this.loadAcls()
        if (emitChange) this.permissionsChanged.emit()
      },
      error: (err: unknown) => {
        this.aclsBusy.set(false)
        this.aclsWriteError.set('That permission change could not be saved. Please try again.')
        this.loadAcls()
        console.error('[PermissionManager] setAcls failed:', err)
      }
    })
  }

  setSubjectLevel(subject: string, newLevel: PermissionLevel, emitChange = true): void {
    const record = this.singleRecord()
    const current = this.acls()
    if (!record || !current) return
    if (subjectPermissionLevel(current, subject) === newLevel) return

    this.writeAcls(record, withSubjectAtLevel(current, subject, newLevel), emitChange)
  }

  removeSubject(subject: string): void {
    const record = this.singleRecord()
    const current = this.acls()
    if (!record || !current) return

    this.writeAcls(record, withoutSubject(current, subject))
  }

  grantStagedLevel(level: PermissionLevel): void {
    const record = this.singleRecord()
    const current = this.acls()
    const people = this.staged()
    if (!record || !current || !people.length) return

    this.closeAddPerson()
    this.writeAcls(record, withSubjectsAtLevel(current, people.map(p => p.id), level))
  }

  // ── Confirmation wrappers ─────────────────────────────────────────────────

  private confirm(data: ConfirmDialogData, onConfirm: () => void): void {
    this.dialog.open(ConfirmDialogComponent, { data, width: '420px' })
      .afterClosed()
      .subscribe(confirmed => { if (confirmed) onConfirm() })
  }

  confirmRemoveSubject(subject: string): void {
    const label = this.subjectLabels()[subject] || subject
    const record = this.singleRecord()
    this.confirm({
      title: 'Remove access',
      body: `Remove all access for "${label}" on ${record?.id}?`,
      confirmLabel: 'Remove',
      isDestructive: true,
    }, () => this.removeSubject(subject))
  }

  confirmSetLevel(subject: string, newLevel: 'view' | 'update' | 'admin'): void {
    const label = this.subjectLabels()[subject] || subject
    const record = this.singleRecord()
    const current = this.subjectLevel(subject)
    this.confirm({
      title: 'Change access level',
      body: `Change access for "${label}" on ${record?.id} from ${current ?? 'none'} to ${newLevel}?`,
      confirmLabel: 'Change',
    }, () => this.setSubjectLevel(subject, newLevel))
  }

  changeLevel(subject: string, fromLevel: string, toLevel: 'view' | 'update' | 'admin'): void {
    this.setSubjectLevel(subject, toLevel)
  }

  confirmChangeLevel(subject: string, fromLevel: string, toLevel: 'view' | 'update' | 'admin'): void {
    const label = this.subjectLabels()[subject] || subject
    const record = this.singleRecord()
    this.confirm({
      title: 'Change access level',
      body: `Change access for "${label}" on ${record?.id} from ${fromLevel} to ${toLevel}?`,
      confirmLabel: 'Change',
    }, () => this.changeLevel(subject, fromLevel, toLevel))
  }

  confirmGrantLevel(level: 'view' | 'update' | 'admin'): void {
    const record = this.singleRecord()
    this.confirm({
      title: `Grant ${level} access`,
      body: `Grant ${level.toUpperCase()} access on ${record?.id} to:`,
      items: this.staged().map(p => p.label),
      confirmLabel: 'Grant',
    }, () => this.grantStagedLevel(level))
  }

  confirmBulkGrant(): void {
    const level = this.bulkLevel
    this.confirm({
      title: `Bulk grant ${level} access`,
      body: `Grant ${level.toUpperCase()} access to:`,
      items: this.staged().map(p => p.label),
      section: `On ${this.records.length} record${this.records.length > 1 ? 's' : ''}:`,
      sectionItems: this.records.map(r => r.id),
      confirmLabel: `Grant to all ${this.records.length} records`,
    }, () => this.grantBulk())
  }

  confirmDeleteGroup(groupId: string): void {
    const group = this.groups().find(g => g.id === groupId)
    const members = group?.members ?? []
    const labels = this.subjectLabels()
    this.confirm({
      title: 'Delete group',
      body: `Permanently delete group "${group?.name}"?`,
      items: members.length > 0
        ? [`${members.length} member${members.length !== 1 ? 's' : ''} will lose access granted through this group`]
        : ['This group has no members'],
      section: members.length > 0 ? 'Members' : undefined,
      sectionItems: members.length > 0 ? members.map(m => labels[m] ?? m) : undefined,
      confirmLabel: 'Delete',
      isDestructive: true,
    }, () => this.deleteGroup(groupId))
  }

  // ── User's NIST org units ─────────────────────────────────────────────────

  loadNistOrgs(ou: string): void {
    if (!ou) return
    this.nistOrgsLoading.set(true)
    forkJoin(
      this.NIST_ORG_TYPES.map(({ endpoint, prefix }) =>
        this.nsd.searchOrgIndex(endpoint, ou).pipe(
          map(raw => this.labelSvc.parseOrgIndex(raw, prefix)),
          catchError(() => of([]))
        )
      )
    ).subscribe({
      next: results => {
        const q = ou.toLowerCase()
        const seen = new Set<string>()
        const orgs = results.flat()
          .filter(o => o.name.toLowerCase().includes(q))
          .filter(o => !seen.has(o.id) && seen.add(o.id))
        this.nistOrgs.set(orgs)
        this.nistOrgsLoading.set(false)
      },
      error: () => { this.nistOrgs.set([]); this.nistOrgsLoading.set(false) }
    })
  }

  stageNistOrg(org: { id: string; name: string; code: string; type: 'nistou' | 'nistdiv' | 'nistgrp' }): void {
    this._addStaged(org.id, org.name)
  }

  isNistOrgStaged(orgId: string): boolean {
    return this.staged().some(s => s.id === orgId)
  }

  orgTypeLabel(type: string): string {
    if (type === 'nistou')  return 'OU'
    if (type === 'nistdiv') return 'Div'
    if (type === 'nistgrp') return 'Grp'
    return ''
  }

  // ── People picker ─────────────────────────────────────────────────────────

  openAddPerson(): void {
    this.showAddPanel.set(true)
    this.staged.set([])
    this.grantLevelValue = 'update'
    this.peopleQuery = ''
    this.peopleSuggestions.set([])
    this.peopleStatus.set('')
    this.groupQuery = ''
    this.groupSuggestions.set([])
  }

  closeAddPerson(): void {
    this.showAddPanel.set(false)
    this.staged.set([])
    this.peopleQuery = ''
    this.peopleSuggestions.set([])
    this.peopleStatus.set('')
    this.groupQuery = ''
    this.groupSuggestions.set([])
  }

  onPeopleQueryChange(query: string): void {
    if (query.length < 2) this.peopleSuggestions.set([])
    this.searchInput$.next(query)
  }

  stagePerson(person: PersonEntry): void {
    // clear input immediately
    setTimeout(() => {
      this.peopleQuery = ''
      this.peopleSuggestions.set([])
    })

    // the fallback stages a bare NSD peopleID, which isGroupSubject() reads as an
    // org group — the name shows until the drawer is reloaded, then it reads
    // "Org group (13913)". Rare, and better than dropping the choice silently.
    this.nsd.getPerson(person.id).subscribe({
      next: found => this._addStaged(found?.nistUsername || person.id, person.label),
      error: () => this._addStaged(person.id, person.label)
    })
  }

  onGroupQueryChange(query: string): void {
    if (query.length < 3) this.groupSuggestions.set([])
    this.groupSearchInput$.next(query)
  }

  /** every picker here clears its input on selection; the chip or row is the record of it */
  clearOnSelect = (_: any): string => ''

  stageGroupSuggestion(s: { id: string; name: string; type: string }): void {
    this._addStaged(s.id, s.name)
    setTimeout(() => {
      this.groupQuery = ''
      this.groupSuggestions.set([])
    })
  }

  stageGroup(group: Group): void {
    this._addStaged(group.id, group.name)
  }

  isGroupStaged(groupId: string): boolean {
    return this.staged().some(s => s.id === groupId)
  }

  private _addStaged(subject: string, label: string): void {
    if (!this.staged().find(p => p.id === subject)) {
      this.staged.update(s => [...s, { id: subject, label }])
      this.labelSvc.set(subject, label)
      this.peopleStatus.set(`${label} added`)
    } else {
      this.peopleStatus.set(`${label} is already on the list`)
    }
  }

  unstage(id: string): void {
    this.staged.update(s => s.filter(p => p.id !== id))
  }

}

