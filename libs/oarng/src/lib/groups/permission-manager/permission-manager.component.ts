import { Component, Input, signal } from '@angular/core'
import { AclPerm, RecordRef } from '../group.types'

interface MockGroup {
  id: string
  name: string
  members: string[]
}

@Component({
  selector: 'oarng-permission-manager',
  templateUrl: './permission-manager.component.html',
  styleUrl: './permission-manager.component.scss'
})
export class PermissionManagerComponent {
  @Input() records: RecordRef[] = []
  @Input() layout: 'compact' | 'panel' = 'compact'

  readonly perms: AclPerm[] = ['read', 'write', 'admin', 'delete']

  // --- My Groups state (stub — no HTTP) ---

  readonly groups = signal<MockGroup[]>([
    { id: 'grp0:me:lab-team', name: 'lab-team', members: ['alice', 'bob', 'carol'] },
    { id: 'grp0:me:collaborators', name: 'collaborators', members: ['dave', 'eve'] },
  ])

  readonly expandedGroupId = signal<string | null>(null)
  readonly showNewGroupForm = signal(false)
  newGroupName = ''

  toggleGroup(id: string): void {
    this.expandedGroupId.update(current => current === id ? null : id)
  }

  createGroup(): void {
    const name = this.newGroupName.trim()
    if (!name) return
    const id = `grp0:me:${name}`
    this.groups.update(gs => [...gs, { id, name, members: [] }])
    this.newGroupName = ''
    this.showNewGroupForm.set(false)
  }

  cancelCreate(): void {
    this.newGroupName = ''
    this.showNewGroupForm.set(false)
  }

  removeGroupMember(groupId: string, member: string): void {
    this.groups.update(gs =>
      gs.map(g => g.id === groupId
        ? { ...g, members: g.members.filter(m => m !== member) }
        : g
      )
    )
  }

  deleteGroup(groupId: string): void {
    this.groups.update(gs => gs.filter(g => g.id !== groupId))
    if (this.expandedGroupId() === groupId) {
      this.expandedGroupId.set(null)
    }
  }
}
