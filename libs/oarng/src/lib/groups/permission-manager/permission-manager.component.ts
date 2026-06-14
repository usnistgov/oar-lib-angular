import { Component, Input, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core'
import { GroupsService } from '../groups.service'
import { PermissionsService } from '../permissions.service'
import { Group, RecordRef, Acls, AclPerm } from '../group.types'

@Component({
  selector: 'oarng-permission-manager',
  templateUrl: './permission-manager.component.html',
  styleUrl: './permission-manager.component.scss'
})
export class PermissionManagerComponent implements OnChanges {
  @Input() records: RecordRef[] = []
  @Input() layout: 'compact' | 'panel' = 'compact'

  private groupsSvc = inject(GroupsService)
  private permsSvc = inject(PermissionsService)

  readonly perms: AclPerm[] = ['read', 'write', 'admin', 'delete']

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

  readonly singleRecord = computed(() => this.records.length === 1 ? this.records[0] : null)

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['records']) {
      this.loadGroups()
      this.loadAcls()
    }
  }

  // ── Groups CRUD ───────────────────────────────────────────────────────────

  loadGroups(): void {
    this.groupsLoading.set(true)
    this.groupsError.set(null)
    this.groupsSvc.getGroups().subscribe({
      next: groups => {
        this.groups.set(groups)
        this.groupsLoading.set(false)
      },
      error: err => {
        this.groupsError.set('Could not load groups.')
        this.groupsLoading.set(false)
        console.error('[PermissionManager] loadGroups error:', err)
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

  revokePermission(perm: AclPerm, subject: string): void {
    const record = this.singleRecord()
    if (!record) return
    this.permsSvc.revokePerm(record, perm, subject).subscribe({
      next: updated => this.acls.set(updated),
      error: err => console.error('[PermissionManager] revokePerm error:', err)
    })
  }
}
