import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { CommonModule } from '@angular/common'

export interface ConfirmDialogData {
  title: string
  body: string
  items?: string[]
  section?: string
  sectionItems?: string[]
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
}

@Component({
  selector: 'oarng-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="cd-content">
      <p class="cd-body">{{ data.body }}</p>
      @if (data.items?.length) {
        <ul class="cd-list">
          @for (item of data.items; track item) {
            <li>{{ item }}</li>
          }
        </ul>
      }
      @if (data.section && data.sectionItems?.length) {
        <p class="cd-section-label">{{ data.section }}</p>
        <ul class="cd-list cd-list--secondary">
          @for (item of (data.sectionItems ?? []); track item) {
            <li>{{ item }}</li>
          }
        </ul>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ data.cancelLabel || 'Cancel' }}
      </button>
      <button mat-flat-button
              [color]="data.isDestructive ? 'warn' : 'primary'"
              [mat-dialog-close]="true">
        {{ data.confirmLabel || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cd-content { min-width: 320px; max-width: 480px; }
    .cd-body { margin: 0 0 0.5rem; }
    .cd-list { margin: 0.25rem 0 0.75rem 1.25rem; padding: 0; font-size: 0.9rem; }
    .cd-list--secondary { opacity: 0.75; font-size: 0.85rem; }
    .cd-section-label { margin: 0.25rem 0 0.1rem; font-size: 0.8rem; font-weight: 500;
                        text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.55; }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA)
  ref = inject(MatDialogRef<ConfirmDialogComponent>)
}
