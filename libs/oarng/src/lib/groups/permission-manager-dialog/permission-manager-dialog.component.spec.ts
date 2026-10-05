import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { PermissionManagerDialogComponent, PermissionManagerDialogData } from './permission-manager-dialog.component'
import { RecordRef } from '../group.types'
import { GROUPS_AUTH_TOKEN } from '../groups-auth.token'

const RECORD: RecordRef = { id: 'mdm1:0001', apiBase: 'https://api.example.com/midas/dmp/mdm1' }
const DATA: PermissionManagerDialogData = { record: RECORD, title: 'Share my record' }

describe('PermissionManagerDialogComponent', () => {
  let fixture: ComponentFixture<PermissionManagerDialogComponent>
  let component: PermissionManagerDialogComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionManagerDialogComponent, HttpClientTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: DATA },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: GROUPS_AUTH_TOKEN, useValue: () => 'test-token' }
      ]
    }).compileComponents()
    fixture = TestBed.createComponent(PermissionManagerDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('exposes the record as a single-element records array', () => {
    expect(component.records).toEqual([RECORD])
  })

  it('renders the permission manager', () => {
    const el = fixture.nativeElement.querySelector('oarng-permission-manager')
    expect(el).toBeTruthy()
  })
})
