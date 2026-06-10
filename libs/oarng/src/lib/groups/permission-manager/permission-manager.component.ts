import { Component, Input } from '@angular/core'
import { AclPerm, RecordRef } from '../group.types'

@Component({
  selector: 'oarng-permission-manager',
  templateUrl: './permission-manager.component.html',
  styleUrl: './permission-manager.component.scss'
})
export class PermissionManagerComponent {
  @Input() records: RecordRef[] = []
  @Input() layout: 'compact' | 'panel' = 'compact'

  readonly perms: AclPerm[] = ['read', 'write', 'admin', 'delete']
}
