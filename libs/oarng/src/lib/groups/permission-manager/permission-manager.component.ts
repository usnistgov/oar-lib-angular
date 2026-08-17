import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, inject, signal, computed } from '@angular/core'
import { Subject, Subscription, Observable, of, forkJoin } from 'rxjs'
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { GroupsService } from '../groups.service'
import { PermissionsService } from '../permissions.service'
import { NsdService } from '../nsd.service'
import { Group, RecordRef, Acls, AclPerm } from '../group.types'
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog.component'

interface PersonSuggestion {
  id: string
  label: string
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

  @Output() permissionsChanged = new EventEmitter<void>()

  private groupsSvc = inject(GroupsService)
  private permsSvc = inject(PermissionsService)
  private nsd = inject(NsdService)
  private dialog = inject(MatDialog)

  // ── Graduated permission model ────────────────────────────────────────────

  readonly LEVEL_PERMS: Record<'view' | 'update' | 'admin', AclPerm[]> = {
    view:   ['read'],
    update: ['read', 'write'],
    admin:  ['read', 'write', 'admin', 'delete'],
  }

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
  peopleSuggestions = signal<string[]>([])
  staged = signal<PersonSuggestion[]>([])
  peopleSearchLoading = signal(false)
  subjectLabels = signal<{ [subject: string]: string }>({})

  // ── Bulk grant state (multiple records) ──────────────────────────────────
  bulkLevel: 'view' | 'update' | 'admin' = 'update'
  bulkGranting = signal(false)
  bulkGrantError = signal<string | null>(null)

  // ── Group search state ────────────────────────────────────────────────────
  groupQuery = ''
  groupSuggestions = signal<{ id: string; name: string; code: string; type: 'midas' | 'nistou' | 'nistdiv' | 'nistgrp' }[]>([])

  // ── Group member search state ─────────────────────────────────────────────
  memberQuery = ''
  memberSuggestions = signal<string[]>([])
  memberSearchLoading = signal(false)

  private peopleIndex: { [label: string]: string } = {}
  private memberPeopleIndex: { [label: string]: string } = {}
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
      if (!result) { this.peopleSuggestions.set([]); return }
      const { raw, query } = result
      const all: string[] = []
      this.peopleIndex = {}
      Object.keys(raw).forEach(lastName => {
        const group = raw[lastName]
        if (group && typeof group === 'object') {
          Object.keys(group).forEach(id => {
            const label: string = group[id]
            all.push(label)
            this.peopleIndex[label] = id
          })
        }
      })
      const q = query.toLowerCase()
      this.peopleSuggestions.set(
        all.filter(label => label.toLowerCase().includes(q)).slice(0, 10)
      )
    })

    this.groupSearchSub = this.groupSearchInput$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 3) return of([])
        const q = query.toLowerCase()
        const wordPrefixMatch = (text: string) =>
          text.toLowerCase().split(/[\s()]+/).some(word => word.startsWith(q))
        const midas = this.groups()
          .filter(g => wordPrefixMatch(g.name) || g.id.toLowerCase().startsWith(q))
          .slice(0, 5)
          .map(g => ({ id: g.id, name: g.name, code: '', type: 'midas' as const }))
        return forkJoin(
          this.NIST_ORG_TYPES.map(({ endpoint, prefix }) =>
            this.nsd.searchOrgIndex(endpoint, query).pipe(
              map(raw => this.parseOrgIndex(raw, prefix).filter(o => wordPrefixMatch(o.name))),
              catchError(() => of([]))
            )
          )
        ).pipe(
          map(results => [...midas, ...results.flat()].slice(0, 10))
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
      if (!result) { this.memberSuggestions.set([]); return }
      const { raw, query } = result
      const all: string[] = []
      this.memberPeopleIndex = {}
      Object.keys(raw).forEach(lastName => {
        const group = raw[lastName]
        if (group && typeof group === 'object') {
          Object.keys(group).forEach(id => {
            const label: string = group[id]
            all.push(label)
            this.memberPeopleIndex[label] = id
          })
        }
      })
      const q = query.toLowerCase()
      this.memberSuggestions.set(
        all.filter(label => label.toLowerCase().includes(q)).slice(0, 10)
      )
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

    const required = this.LEVEL_PERMS[level]
    const all: AclPerm[] = ['read', 'write', 'admin', 'delete']
    const toRevoke = all.filter(p => !required.includes(p))
    this.bulkGranting.set(true)
    this.bulkGrantError.set(null)

    const ops: Observable<unknown>[] = people.flatMap(person =>
      this.records.flatMap(record => [
        ...required.map(perm => this.permsSvc.grantPerm(record, perm, person.id)),
        // Revoke perms above the target level; 404s are safe (subject didn't hold that perm).
        ...toRevoke.map(p =>
          this.permsSvc.revokePerm(record, p, person.id).pipe(catchError(() => of(null)))
        ),
      ])
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
        this.bulkGrantError.set('One or more operations failed.')
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

  private readonly ORG_TYPE_MAP: Record<string, { endpoint: string; label: string; prefix: 'nistou' | 'nistdiv' | 'nistgrp' }> = {
    nistou:  { endpoint: 'OU',    label: 'OU',  prefix: 'nistou'  },
    nistdiv: { endpoint: 'Div',   label: 'Div', prefix: 'nistdiv' },
    nistgrp: { endpoint: 'Group', label: 'Grp', prefix: 'nistgrp' },
  }

  private resolveUnknownLabels(acls: Acls): void {
    const known = this.subjectLabels()
    const allSubjects = new Set([
      ...(acls.read ?? []),
      ...(acls.write ?? []),
      ...(acls.admin ?? []),
      ...(acls.delete ?? []),
    ])
    const syncUpdates: { [subject: string]: string } = {}
    const toResolveViaSearch: string[] = []
    const toResolveViaOrg: string[] = []

    for (const subject of allSubjects) {
      if (known[subject]) continue
      const group = this.groups().find(g => g.id === subject)
      if (group) {
        syncUpdates[subject] = group.name
      } else if (/^nist(ou|div|grp):/.test(subject) || /^\d+:\d+$/.test(subject) || /^[a-z]+:\d+$/.test(subject)) {
        toResolveViaOrg.push(subject)
      } else if (/^\d+$/.test(subject)) {
        syncUpdates[subject] = `Org group (${subject})`
      } else {
        toResolveViaSearch.push(subject)
      }
    }

    if (Object.keys(syncUpdates).length > 0) {
      this.subjectLabels.update(m => ({ ...m, ...syncUpdates }))
    }

    // EIDs: query by nistUsername and keep only the exact match
    toResolveViaSearch.forEach(eid => {
      this.nsd.getPeopleByUsername(eid).pipe(
        catchError(() => of([]))
      ).subscribe((people: any[]) => {
          if (!Array.isArray(people)) return
          const person = people.find(p => p?.nistUsername?.toLowerCase() === eid.toLowerCase())
          if (!person?.lastName) return
          const name = person.firstName ? `${person.lastName}, ${person.firstName}` : person.lastName
          this.subjectLabels.update(m => ({ ...m, [eid]: name }))
        })
      })

    // NIST org subjects — two formats:
    //   new: "nistou:13289" / "nistdiv:13289" / "nistgrp:13289"
    //   legacy: "775:13289" (orgCode:orgId, stored by older versions of this UI)
    // In both cases, display as "{orgName} ({orgCode})".
    toResolveViaOrg.forEach(subject => {
      const colonIdx = subject.indexOf(':')
      const prefix = subject.substring(0, colonIdx)
      const afterColon = subject.substring(colonIdx + 1)

      if (/^nist(ou|div|grp)$/.test(prefix)) {
        // New format: query the typed endpoint, look up numericId directly
        const mapping = this.ORG_TYPE_MAP[prefix]
        this.nsd.searchOrgIndex(mapping.endpoint).pipe(
          catchError(() => of({}))
          ).subscribe((raw: any) => {
            const numericId = afterColon
            for (const code of Object.keys(raw ?? {})) {
              const group = raw[code]
              if (group && typeof group === 'object' && group[numericId]) {
                const name = (group[numericId] as string).replace(/\s*\(\d+\)\s*$/, '')
                this.subjectLabels.update(m => ({ ...m, [subject]: `${name} (${code})` }))
                return
              }
            }
          })
        } else if (/^\d+$/.test(prefix)) {
          // Legacy format "775:13289" (orgCode:orgId) — direct lookup by both keys
          const orgCode = prefix
          const orgId = afterColon
          forkJoin(
            this.NIST_ORG_TYPES.map(({ endpoint }) =>
              this.nsd.searchOrgIndex(endpoint).pipe(catchError(() => of({})))
            )
          ).subscribe(responses => {
            for (const raw of responses) {
              const group = raw?.[orgCode]
              if (group && typeof group === 'object' && group[orgId]) {
                const name = (group[orgId] as string).replace(/\s*\(\d+\)\s*$/, '')
                this.subjectLabels.update(m => ({ ...m, [subject]: `${name} (${orgCode})` }))
                return
              }
            }
          })
        } else {
          // Org abbreviation format "mml:13213" — scan all endpoints by orgId, get code from outer key
          const orgId = afterColon
          forkJoin(
            this.NIST_ORG_TYPES.map(({ endpoint }) =>
              this.nsd.searchOrgIndex(endpoint).pipe(catchError(() => of({})))
            )
          ).subscribe(responses => {
            for (const raw of responses) {
              for (const code of Object.keys(raw ?? {})) {
                const group = raw[code]
                if (group && typeof group === 'object' && group[orgId]) {
                  const name = (group[orgId] as string).replace(/\s*\(\d+\)\s*$/, '')
                  this.subjectLabels.update(m => ({ ...m, [subject]: `${name} (${code})` }))
                  return
                }
              }
            }
          })
        }
      })
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

  addGroupMember(groupId: string, label: string): void {
    const peopleId = this.memberPeopleIndex[label]
    if (!peopleId) return
    setTimeout(() => { this.memberQuery = ''; this.memberSuggestions.set([]) })

    const doAdd = (memberId: string) => {
      this.groupsSvc.addMember(groupId, memberId).subscribe({
        next: updatedMembers => {
          this.groups.update(gs => gs.map(g =>
            g.id === groupId ? { ...g, members: updatedMembers } : g
          ))
        },
        error: err => console.error('[PermissionManager] addMember error:', err)
      })
    }

    this.nsd.getPerson(peopleId).subscribe({
      next: person => doAdd(person?.nistUsername || peopleId),
      error: () => doAdd(peopleId)
    })
  }

  toggleGroup(id: string): void {
    this.expandedGroupId.update(cur => cur === id ? null : id)
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

  subjectLevel(subject: string): 'view' | 'update' | 'admin' | null {
    const acls = this.acls()
    if (!acls) return null
    const r = acls.read?.includes(subject) ?? false
    const w = acls.write?.includes(subject) ?? false
    const a = acls.admin?.includes(subject) ?? false
    const d = acls.delete?.includes(subject) ?? false
    if (a) return 'admin'
    if (w) return 'update'
    if (r) return 'view'
    return null
  }

  isGroup(subject: string): boolean {
    // Numeric IDs are NIST org groups; prefixed IDs (e.g. nistou:123) are NIST org units;
    // MIDAS group IDs match an entry in the loaded groups list.
    if (/^\d+$/.test(subject) || /^nist(ou|div|grp):/.test(subject)) return true
    if (this.groups().some(g => g.id === subject)) return true
    return false
  }

  setSubjectLevel(subject: string, newLevel: 'view' | 'update' | 'admin', emitChange = true): void {
    const record = this.singleRecord()
    if (!record) return
    const current = this.acls()
    if (!current) return

    const required = this.LEVEL_PERMS[newLevel]
    const all: AclPerm[] = ['read', 'write', 'admin', 'delete']
    const toGrant = required.filter(p => !(current[p] ?? []).includes(subject))
    const toRevoke = all.filter(p => !required.includes(p) && (current[p] ?? []).includes(subject))
    const ops: Observable<unknown>[] = [
      ...toGrant.map(p => this.permsSvc.grantPerm(record, p, subject)),
      ...toRevoke.map(p => this.permsSvc.revokePerm(record, p, subject)),
    ]
    if (!ops.length) return

    forkJoin(ops).subscribe({
      next: () => {
        this.loadAcls()
        if (emitChange) this.permissionsChanged.emit()
      },
      error: (err: unknown) => {
        this.loadAcls()
        console.error('[PermissionManager] setSubjectLevel error:', err)
      }
    })
  }

  removeSubject(subject: string): void {
    const record = this.singleRecord()
    if (!record) return
    const current = this.acls()
    if (!current) return

    const toRevoke: AclPerm[] = (['read', 'write', 'admin', 'delete'] as AclPerm[])
      .filter(p => (current[p] ?? []).includes(subject))
    if (!toRevoke.length) return

    forkJoin(toRevoke.map(p => this.permsSvc.revokePerm(record, p, subject))).subscribe({
      next: () => { this.loadAcls(); this.permissionsChanged.emit() },
      error: (err: unknown) => {
        this.loadAcls()
        console.error('[PermissionManager] removeSubject error:', err)
      }
    })
  }

  grantStagedLevel(level: 'view' | 'update' | 'admin'): void {
    const record = this.singleRecord()
    if (!record) return
    const people = this.staged()
    if (!people.length) return

    const currentAcls = this.acls()
    const allOps: Observable<unknown>[] = people.flatMap(person => {
      if (!currentAcls) return []
      const required = this.LEVEL_PERMS[level]
      const all: AclPerm[] = ['read', 'write', 'admin', 'delete']
      const toGrant = required.filter(p => !(currentAcls[p] ?? []).includes(person.id))
      const toRevoke = all.filter(p => !required.includes(p) && (currentAcls[p] ?? []).includes(person.id))
      return [
        ...toGrant.map(p => this.permsSvc.grantPerm(record, p, person.id)),
        ...toRevoke.map(p => this.permsSvc.revokePerm(record, p, person.id)),
      ]
    })

    this.closeAddPerson()

    if (!allOps.length) {
      this.permissionsChanged.emit()
      return
    }

    forkJoin(allOps).subscribe({
      next: () => {
        this.loadAcls()
        this.permissionsChanged.emit()
      },
      error: (err: unknown) => {
        this.loadAcls()
        console.error('[PermissionManager] grantStagedLevel error:', err)
      }
    })
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
          map(raw => this.parseOrgIndex(raw, prefix)),
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

  private parseOrgIndex(
    raw: any,
    prefix: 'nistou' | 'nistdiv' | 'nistgrp'
  ): { id: string; name: string; code: string; type: 'nistou' | 'nistdiv' | 'nistgrp' }[] {
    const out: { id: string; name: string; code: string; type: 'nistou' | 'nistdiv' | 'nistgrp' }[] = []
    if (!raw || typeof raw !== 'object') return out
    Object.keys(raw).forEach(code => {
      const group = raw[code]
      if (group && typeof group === 'object') {
        Object.keys(group).forEach(numericId => {
          out.push({ id: `${prefix}:${numericId}`, name: group[numericId], code, type: prefix })
        })
      }
    })
    return out
  }

  stageNistOrg(org: { id: string; name: string; code: string; type: 'nistou' | 'nistdiv' | 'nistgrp' }): void {
    this._addStaged(org.id, org.name)
    this.subjectLabels.update(m => ({
      ...m,
      [org.id]: `${org.name} (${org.code})`
    }))
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
    this.groupQuery = ''
    this.groupSuggestions.set([])
  }

  closeAddPerson(): void {
    this.showAddPanel.set(false)
    this.staged.set([])
    this.peopleQuery = ''
    this.peopleSuggestions.set([])
    this.groupQuery = ''
    this.groupSuggestions.set([])
  }

  onPeopleQueryChange(query: string): void {
    if (query.length < 2) this.peopleSuggestions.set([])
    this.searchInput$.next(query)
  }

  stagePerson(label: string): void {
    const peopleId = this.peopleIndex[label]
    if (!peopleId) return

    // clear input immediately
    setTimeout(() => {
      this.peopleQuery = ''
      this.peopleSuggestions.set([])
    })

    this.nsd.getPerson(peopleId).subscribe({
      next: person => this._addStaged(person?.nistUsername || peopleId, label),
      error: () => this._addStaged(peopleId, label)
    })
  }

  onGroupQueryChange(query: string): void {
    if (query.length < 3) this.groupSuggestions.set([])
    this.groupSearchInput$.next(query)
  }

  displayGroupLabel = (_: any): string => ''

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
      this.subjectLabels.update(m => ({ ...m, [subject]: label }))
    }
  }

  unstage(id: string): void {
    this.staged.update(s => s.filter(p => p.id !== id))
  }

}

