import { Component, Input } from '@angular/core'
import { AclPerm } from '../group.types'

@Component({
  selector: 'oarng-permission-manager',
  templateUrl: './permission-manager.component.html',
  styleUrl: './permission-manager.component.scss'
})
export class PermissionManagerComponent {
  @Input() recordId: string = ''
  @Input() apiBase: string = ''

  readonly perms: AclPerm[] = ['read', 'write', 'admin', 'delete']
}
