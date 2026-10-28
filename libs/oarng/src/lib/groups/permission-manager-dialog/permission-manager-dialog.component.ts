import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { GroupsModule } from '../groups.module'
import { RecordRef } from '../group.types'

export interface PermissionManagerDialogData {
  record: RecordRef
  title: string
}

@Component({
  selector: 'oarng-permission-manager-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, GroupsModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <oarng-permission-manager [records]="records" />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null" aria-label="Close share dialog">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: min(680px, 90vw); padding-top: 8px; }
  `]
})
export class PermissionManagerDialogComponent {
  readonly data = inject<PermissionManagerDialogData>(MAT_DIALOG_DATA)
  readonly records: RecordRef[] = [this.data.record]
}
