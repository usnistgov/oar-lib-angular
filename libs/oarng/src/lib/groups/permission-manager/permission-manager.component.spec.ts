import { of, throwError } from 'rxjs'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PermissionManagerComponent } from './permission-manager.component'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatDialogModule } from '@angular/material/dialog'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ConfigurationService } from '../../config/config.service'
import { PermissionsService } from '../permissions.service'
import { GroupsService } from '../groups.service'
import { Acls, Group, RecordRef } from '../group.types'

const RECORD: RecordRef = { id: 'mdm1:0001', apiBase: 'https://api.example.com' }
const EMPTY_ACLS: Acls = { read: [], write: [], admin: [], delete: [] }

const makeAcls = (r: string[], w: string[], a: string[], d: string[]): Acls =>
  ({ read: r, write: w, admin: a, delete: d })

describe('PermissionManagerComponent', () => {
  let component: PermissionManagerComponent
  let fixture: ComponentFixture<PermissionManagerComponent>
  let permsSvc: { grantPerm: jest.Mock; revokePerm: jest.Mock; getAcls: jest.Mock }
  let groupsSvc: {
    getGroups: jest.Mock
    createGroup: jest.Mock
    deleteGroup: jest.Mock
    addMember: jest.Mock
    removeMember: jest.Mock
  }

  beforeEach(async () => {
    permsSvc = {
      grantPerm: jest.fn().mockReturnValue(of(['alice'])),
      revokePerm: jest.fn().mockReturnValue(of(EMPTY_ACLS)),
      getAcls: jest.fn().mockReturnValue(of(EMPTY_ACLS)),
    }
    groupsSvc = {
      getGroups: jest.fn().mockReturnValue(of([])),
      createGroup: jest.fn().mockReturnValue(of({ id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: [] })),
      deleteGroup: jest.fn().mockReturnValue(of('deleted')),
      addMember: jest.fn().mockReturnValue(of(['alice'])),
      removeMember: jest.fn().mockReturnValue(of('removed')),
    }

    await TestBed.configureTestingModule({
      declarations: [PermissionManagerComponent],
      imports: [HttpClientTestingModule, MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: ConfigurationService, useValue: { getConfig: () => ({}) } },
        { provide: PermissionsService, useValue: permsSvc },
        { provide: GroupsService, useValue: groupsSvc },
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(PermissionManagerComponent)
    component = fixture.componentInstance
  })

  // ── subjectLevel() ─────────────────────────────────────────────────────────

  describe('subjectLevel()', () => {
    it('returns admin when subject has all four permissions', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      expect(component.subjectLevel('alice')).toBe('admin')
    })

    it('returns update when subject has read and write but not admin/delete', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], [], []))
      expect(component.subjectLevel('alice')).toBe('update')
    })

    it('returns update even when subject has read+write+admin but not delete', () => {
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

    it('returns null when subject is not present in any list', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      expect(component.subjectLevel('bob')).toBeNull()
    })

    it('returns null when acls is null', () => {
      component.acls.set(null)
      expect(component.subjectLevel('alice')).toBeNull()
    })
  })

  // ── uniqueSubjects computed ────────────────────────────────────────────────

  describe('uniqueSubjects', () => {
    it('returns empty array when acls is null', () => {
      component.acls.set(null)
      expect(component.uniqueSubjects()).toEqual([])
    })

    it('returns all unique subjects across all perm arrays', () => {
      component.acls.set(makeAcls(['alice', 'bob'], ['alice'], ['alice'], ['alice']))
      const subjects = component.uniqueSubjects()
      expect(subjects).toContain('alice')
      expect(subjects).toContain('bob')
      expect(subjects).toHaveLength(2)
    })

    it('deduplicates subjects appearing in multiple perm arrays', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      expect(component.uniqueSubjects()).toEqual(['alice'])
    })

    it('includes subjects from all four perm arrays', () => {
      component.acls.set(makeAcls(['r-only'], ['w-only'], ['a-only'], ['d-only']))
      const subjects = component.uniqueSubjects()
      expect(subjects).toHaveLength(4)
      expect(subjects).toContain('r-only')
      expect(subjects).toContain('w-only')
      expect(subjects).toContain('a-only')
      expect(subjects).toContain('d-only')
    })
  })

  // ── subjectsFor() ──────────────────────────────────────────────────────────

  describe('subjectsFor()', () => {
    it('returns the read array from acls', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      expect(component.subjectsFor('read')).toEqual(['alice'])
    })

    it('returns the correct array for each perm type', () => {
      component.acls.set(makeAcls(['r'], ['w'], ['a'], ['d']))
      expect(component.subjectsFor('read')).toEqual(['r'])
      expect(component.subjectsFor('write')).toEqual(['w'])
      expect(component.subjectsFor('admin')).toEqual(['a'])
      expect(component.subjectsFor('delete')).toEqual(['d'])
    })

    it('returns empty array when acls is null', () => {
      component.acls.set(null)
      expect(component.subjectsFor('read')).toEqual([])
    })
  })

  // ── setSubjectLevel() ──────────────────────────────────────────────────────

  describe('setSubjectLevel()', () => {
    beforeEach(() => {
      component.singleRecord.set(RECORD)
    })

    it('grants missing perms when upgrading to admin', () => {
      // alice has view; upgrading to admin requires granting write, admin, delete
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.setSubjectLevel('alice', 'admin')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'write', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'admin', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'delete', 'alice')
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    it('revokes excess perms when downgrading to view', () => {
      // alice has admin (all four); downgrading to view requires revoking write, admin, delete
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      component.setSubjectLevel('alice', 'view')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'write', 'alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'admin', 'alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'delete', 'alice')
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
    })

    it('both grants and revokes when switching from view to update', () => {
      // alice has only read; upgrade to update requires granting write
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.setSubjectLevel('alice', 'update')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'write', 'alice')
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    it('is a no-op when the subject is already at the target level', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      component.setSubjectLevel('alice', 'admin')
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    it('emits permissionsChanged after all ops complete', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      jest.spyOn(component.permissionsChanged, 'emit')
      component.setSubjectLevel('alice', 'admin')
      expect(component.permissionsChanged.emit).toHaveBeenCalledTimes(1)
    })

    it('does not emit permissionsChanged when emitChange is false', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      jest.spyOn(component.permissionsChanged, 'emit')
      component.setSubjectLevel('alice', 'admin', false)
      expect(component.permissionsChanged.emit).not.toHaveBeenCalled()
    })

    it('does nothing when singleRecord is null', () => {
      component.singleRecord.set(null)
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.setSubjectLevel('alice', 'admin')
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
    })

    it('does nothing when acls is null', () => {
      component.acls.set(null)
      component.setSubjectLevel('alice', 'admin')
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
    })

    it('calls loadAcls() even when an operation errors', () => {
      permsSvc.revokePerm.mockReturnValue(throwError(() => new Error('403')))
      permsSvc.grantPerm.mockReturnValue(of(['alice']))

      // alice at full admin — downgrading to view produces toRevoke=[write,admin,delete]
      // which calls revokePerm 3 times; revokePerm throws, hitting the error path
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      permsSvc.getAcls.mockReturnValue(of(makeAcls(['alice'], [], [], [])))

      component.setSubjectLevel('alice', 'view')

      expect(permsSvc.getAcls).toHaveBeenCalled()
    })
  })

  // ── removeSubject() ────────────────────────────────────────────────────────

  describe('removeSubject()', () => {
    beforeEach(() => {
      component.singleRecord.set(RECORD)
    })

    it('revokes all perms the subject holds', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], [], []))
      component.removeSubject('alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'read', 'alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'write', 'alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledTimes(2)
    })

    it('revokes all four perms for an admin subject', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      component.removeSubject('alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledTimes(4)
    })

    it('emits permissionsChanged when all revokes complete', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], [], []))
      jest.spyOn(component.permissionsChanged, 'emit')
      component.removeSubject('alice')
      expect(component.permissionsChanged.emit).toHaveBeenCalledTimes(1)
    })

    it('is a no-op when subject is not in any ACL list', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.removeSubject('bob')
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    it('does nothing when singleRecord is null', () => {
      component.singleRecord.set(null)
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.removeSubject('alice')
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    it('calls loadAcls() and emits even when one revoke errors', () => {
      permsSvc.revokePerm
        .mockReturnValueOnce(throwError(() => new Error('500')))
        .mockReturnValue(of({ read: [], write: [], admin: [], delete: [] }))

      component.acls.set({ read: ['alice'], write: ['alice'], admin: [], delete: [] })
      permsSvc.getAcls.mockReturnValue(of({ read: [], write: [], admin: [], delete: [] }))
      const spy = jest.spyOn(component.permissionsChanged, 'emit')

      component.removeSubject('alice')

      // forkJoin fails fast; error path must call loadAcls
      expect(permsSvc.getAcls).toHaveBeenCalled()
      // permissionsChanged does NOT emit on error (partial failure = unknown state)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  // ── grantStagedLevel() ─────────────────────────────────────────────────────

  describe('grantStagedLevel()', () => {
    beforeEach(() => {
      component.singleRecord.set(RECORD)
      component.acls.set(EMPTY_ACLS)
    })

    it('grants the required perms for each staged person', () => {
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.grantStagedLevel('view')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'read', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledTimes(1)
    })

    it('grants all four perms when level is admin', () => {
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.grantStagedLevel('admin')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'read', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'write', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'admin', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'delete', 'alice')
    })

    it('emits permissionsChanged once when all staged people are processed', () => {
      component.staged.set([
        { id: 'alice', label: 'Alice' },
        { id: 'bob', label: 'Bob' },
      ])
      jest.spyOn(component.permissionsChanged, 'emit')
      component.grantStagedLevel('view')
      expect(component.permissionsChanged.emit).toHaveBeenCalledTimes(1)
    })

    it('revokes excess perms when downgrading an existing subject', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.grantStagedLevel('view')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'write', 'alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'admin', 'alice')
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(RECORD, 'delete', 'alice')
    })

    it('is a no-op when staged is empty', () => {
      component.staged.set([])
      component.grantStagedLevel('admin')
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
    })

    it('is a no-op when singleRecord is null', () => {
      component.singleRecord.set(null)
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.grantStagedLevel('admin')
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
    })

    it('calls loadAcls() exactly once even when 3 people are staged', () => {
      const record: RecordRef = { id: 'mdm:001', apiBase: 'https://api/' }
      fixture.componentRef.setInput('records', [record])
      component.acls.set({ read: [], write: [], admin: [], delete: [] })
      component.staged.set([
        { id: 'alice', label: 'Alice' },
        { id: 'bob', label: 'Bob' },
        { id: 'carol', label: 'Carol' },
      ])
      permsSvc.grantPerm.mockReturnValue(of(['alice']))
      permsSvc.getAcls.mockReturnValue(of({ read: ['alice', 'bob', 'carol'], write: [], admin: [], delete: [] }))

      component.grantStagedLevel('view')

      expect(permsSvc.getAcls).toHaveBeenCalledTimes(1)
    })

    it('calls loadAcls() and does NOT emit when any op errors', () => {
      const record: RecordRef = { id: 'mdm:001', apiBase: 'https://api/' }
      fixture.componentRef.setInput('records', [record])
      component.acls.set({ read: [], write: [], admin: [], delete: [] })
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      permsSvc.grantPerm.mockReturnValue(throwError(() => new Error('403')))
      permsSvc.getAcls.mockReturnValue(of({ read: [], write: [], admin: [], delete: [] }))
      const spy = jest.spyOn(component.permissionsChanged, 'emit')

      component.grantStagedLevel('view')

      expect(permsSvc.getAcls).toHaveBeenCalled()
      expect(spy).not.toHaveBeenCalled()
    })
  })

  // ── grantBulk() ────────────────────────────────────────────────────────────

  describe('grantBulk()', () => {
    beforeEach(() => {
      component.records = [RECORD]
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.bulkLevel = 'update'
    })

    it('calls grantPerm for each person × record × required perm', () => {
      component.grantBulk()
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'read', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(RECORD, 'write', 'alice')
      expect(permsSvc.grantPerm).toHaveBeenCalledTimes(2)
    })

    it('emits permissionsChanged when all operations succeed', () => {
      jest.spyOn(component.permissionsChanged, 'emit')
      component.grantBulk()
      expect(component.permissionsChanged.emit).toHaveBeenCalledTimes(1)
    })

    it('clears staged list on success', () => {
      component.grantBulk()
      expect(component.staged()).toEqual([])
    })

    it('sets bulkGrantError when any operation fails', () => {
      permsSvc.grantPerm
        .mockReturnValueOnce(of(['alice']))
        .mockReturnValueOnce(throwError(() => new Error('network error')))
      component.grantBulk()
      expect(component.bulkGrantError()).toMatch(/operation/)
    })

    it('does not emit permissionsChanged on partial failure', () => {
      permsSvc.grantPerm
        .mockReturnValueOnce(of(['alice']))
        .mockReturnValueOnce(throwError(() => new Error('network error')))
      jest.spyOn(component.permissionsChanged, 'emit')
      component.grantBulk()
      expect(component.permissionsChanged.emit).not.toHaveBeenCalled()
    })

    it('is a no-op when staged is empty', () => {
      component.staged.set([])
      component.grantBulk()
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
    })

    it('is a no-op when records is empty', () => {
      component.records = []
      component.grantBulk()
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
    })

    it('revokes permissions above the requested level (downgrade support)', () => {
      component.records = [{ id: 'mdm:001', apiBase: 'https://api/' }]
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.bulkLevel = 'view'  // grant view: only read should remain

      component.grantBulk()

      // must grant read
      expect(permsSvc.grantPerm).toHaveBeenCalledWith(
        expect.any(Object), 'read', 'alice'
      )
      // must revoke write, admin, delete
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(
        expect.any(Object), 'write', 'alice'
      )
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(
        expect.any(Object), 'admin', 'alice'
      )
      expect(permsSvc.revokePerm).toHaveBeenCalledWith(
        expect.any(Object), 'delete', 'alice'
      )
    })

    it('does NOT revoke permissions that are part of the requested level', () => {
      component.records = [{ id: 'mdm:001', apiBase: 'https://api/' }]
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.bulkLevel = 'update'  // read + write — must not revoke read or write

      component.grantBulk()

      const revokeCalls = (permsSvc.revokePerm as jest.Mock).mock.calls
      const revokedPerms = revokeCalls.map((c: any[]) => c[1])
      expect(revokedPerms).not.toContain('read')
      expect(revokedPerms).not.toContain('write')
    })
  })

  // ── loadAcls() ─────────────────────────────────────────────────────────────

  describe('loadAcls()', () => {
    it('calls getAcls with singleRecord and sets acls on success', () => {
      const acls = makeAcls(['alice'], [], [], [])
      permsSvc.getAcls.mockReturnValueOnce(of(acls))
      component.singleRecord.set(RECORD)
      component.loadAcls()
      expect(permsSvc.getAcls).toHaveBeenCalledWith(RECORD)
      expect(component.acls()).toEqual(acls)
    })

    it('clears aclsLoading after success', () => {
      component.singleRecord.set(RECORD)
      component.loadAcls()
      expect(component.aclsLoading()).toBe(false)
    })

    it('sets aclsError and clears loading on error', () => {
      permsSvc.getAcls.mockReturnValueOnce(throwError(() => new Error('server error')))
      component.singleRecord.set(RECORD)
      component.loadAcls()
      expect(component.aclsError()).toBe('Could not load permissions.')
      expect(component.aclsLoading()).toBe(false)
    })

    it('sets acls to null and skips the request when singleRecord is null', () => {
      component.singleRecord.set(null)
      component.loadAcls()
      expect(permsSvc.getAcls).not.toHaveBeenCalled()
      expect(component.acls()).toBeNull()
    })
  })

  // ── loadGroups() ───────────────────────────────────────────────────────────

  describe('loadGroups()', () => {
    it('calls getGroups and sets groups signal on success', () => {
      const groups: Group[] = [{ id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: [] }]
      groupsSvc.getGroups.mockReturnValueOnce(of(groups))
      component.loadGroups()
      expect(component.groups()).toEqual(groups)
    })

    it('clears groupsLoading after success', () => {
      component.loadGroups()
      expect(component.groupsLoading()).toBe(false)
    })

    it('sets groupsError and clears loading on error', () => {
      groupsSvc.getGroups.mockReturnValueOnce(throwError(() => new Error('network error')))
      component.loadGroups()
      expect(component.groupsError()).toBe('Could not load groups.')
      expect(component.groupsLoading()).toBe(false)
    })
  })

  // ── staging ────────────────────────────────────────────────────────────────

  describe('staging helpers', () => {
    describe('unstage()', () => {
      it('removes the subject from staged', () => {
        component.staged.set([
          { id: 'alice', label: 'Alice' },
          { id: 'bob', label: 'Bob' },
        ])
        component.unstage('alice')
        expect(component.staged()).toEqual([{ id: 'bob', label: 'Bob' }])
      })

      it('is a no-op when subject is not staged', () => {
        component.staged.set([{ id: 'alice', label: 'Alice' }])
        component.unstage('carol')
        expect(component.staged()).toHaveLength(1)
      })
    })

    describe('stageGroup() / isGroupStaged()', () => {
      it('stageGroup adds the group to staged', () => {
        const group: Group = { id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: [] }
        component.stageGroup(group)
        expect(component.isGroupStaged('grp0:alice:team')).toBe(true)
      })

      it('isGroupStaged returns false when group is not staged', () => {
        expect(component.isGroupStaged('grp0:alice:team')).toBe(false)
      })

      it('stageGroup does not add the same group twice', () => {
        const group: Group = { id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: [] }
        component.stageGroup(group)
        component.stageGroup(group)
        expect(component.staged()).toHaveLength(1)
      })
    })

    describe('stageGroup updates subjectLabels', () => {
      it('stores the group name in subjectLabels keyed by group id', () => {
        const group: Group = { id: 'grp0:alice:team', name: 'My Team', owner: 'alice', members: [] }
        component.stageGroup(group)
        expect(component.subjectLabels()['grp0:alice:team']).toBe('My Team')
      })
    })
  })

  // ── toggleGroup() ──────────────────────────────────────────────────────────

  describe('toggleGroup()', () => {
    it('sets expandedGroupId to the given id', () => {
      component.toggleGroup('grp0:alice:team')
      expect(component.expandedGroupId()).toBe('grp0:alice:team')
    })

    it('collapses when the same id is toggled again', () => {
      component.toggleGroup('grp0:alice:team')
      component.toggleGroup('grp0:alice:team')
      expect(component.expandedGroupId()).toBeNull()
    })

    it('switches to a different group when a new id is toggled', () => {
      component.toggleGroup('grp0:alice:team')
      component.toggleGroup('grp0:alice:other')
      expect(component.expandedGroupId()).toBe('grp0:alice:other')
    })
  })

  // ── cancelCreate() ─────────────────────────────────────────────────────────

  describe('cancelCreate()', () => {
    it('clears newGroupName', () => {
      component.newGroupName = 'Draft'
      component.cancelCreate()
      expect(component.newGroupName).toBe('')
    })

    it('hides the new group form', () => {
      component.showNewGroupForm.set(true)
      component.cancelCreate()
      expect(component.showNewGroupForm()).toBe(false)
    })
  })

  // ── LEVEL_PERMS constant ───────────────────────────────────────────────────

  describe('LEVEL_PERMS', () => {
    it('view maps to [read]', () => {
      expect(component.LEVEL_PERMS['view']).toEqual(['read'])
    })

    it('update maps to [read, write]', () => {
      expect(component.LEVEL_PERMS['update']).toEqual(['read', 'write'])
    })

    it('admin maps to all four perms', () => {
      expect(component.LEVEL_PERMS['admin']).toEqual(['read', 'write', 'admin', 'delete'])
    })
  })
})
