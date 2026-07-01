import { of } from 'rxjs'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PermissionManagerComponent } from './permission-manager.component'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatDialogModule } from '@angular/material/dialog'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ConfigurationService } from '../../config/config.service'
import { PermissionsService } from '../permissions.service'
import { GroupsService } from '../groups.service'
import { Acls } from '../group.types'

describe('PermissionManagerComponent', () => {
  let component: PermissionManagerComponent
  let fixture: ComponentFixture<PermissionManagerComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PermissionManagerComponent],
      imports: [HttpClientTestingModule, MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: ConfigurationService, useValue: { getConfig: () => ({}) } },
        { provide: PermissionsService, useValue: { grantPerm: jest.fn(), revokePerm: jest.fn(), getAcls: jest.fn() } },
        { provide: GroupsService, useValue: { getGroups: jest.fn(() => of([])) } },
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(PermissionManagerComponent)
    component = fixture.componentInstance
  })

  describe('subjectLevel()', () => {
    const makeAcls = (r: string[], w: string[], a: string[], d: string[]): Acls =>
      ({ read: r, write: w, admin: a, delete: d })

    it('returns admin when subject has all four permissions', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      expect(component.subjectLevel('alice')).toBe('admin')
    })

    it('returns update when subject has read and write but not admin/delete', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], [], []))
      expect(component.subjectLevel('alice')).toBe('update')
    })

    it('returns update even when subject has extra permissions above read+write', () => {
      // has read+write+admin but not delete: highest FULLY compatible level is update
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], []))
      expect(component.subjectLevel('alice')).toBe('update')
    })

    it('returns view when subject has only read', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      expect(component.subjectLevel('alice')).toBe('view')
    })

    it('returns null when subject has no read permission', () => {
      component.acls.set(makeAcls([], ['alice'], [], []))
      expect(component.subjectLevel('alice')).toBeNull()
    })

    it('returns null when subject is not present', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      expect(component.subjectLevel('bob')).toBeNull()
    })
  })
})
