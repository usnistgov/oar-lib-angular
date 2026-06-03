import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatCardModule } from '@angular/material/card'
import { PermissionManagerComponent } from './permission-manager/permission-manager.component'

@NgModule({
  declarations: [PermissionManagerComponent],
  imports: [CommonModule, MatCardModule],
  exports: [PermissionManagerComponent]
})
export class GroupsModule {}
