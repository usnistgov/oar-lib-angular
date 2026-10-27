import { of, throwError } from 'rxjs'
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
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
  let permsSvc: { grantPerm: jest.Mock; revokePerm: jest.Mock; getAcls: jest.Mock; setAcls: jest.Mock }
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
      setAcls: jest.fn().mockReturnValue(of(EMPTY_ACLS)),
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

    it('returns admin when the subject holds admin, whatever else is set', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], []))
      expect(component.subjectLevel('alice')).toBe('admin')
    })

    it('returns view when subject has only read', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      expect(component.subjectLevel('alice')).toBe('view')
    })

    // write is granted on its own; calling that unplaced hid the subject from
    // everything listing the record's permissions
    it('returns update for write without read', () => {
      component.acls.set(makeAcls([], ['alice'], [], []))
      expect(component.subjectLevel('alice')).toBe('update')
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

  // One request expresses one intent.  These assert the body that reaches the
  // server, not which service methods were reached for.
  describe('setSubjectLevel()', () => {
    beforeEach(() => component.singleRecord.set(RECORD))

    const bodyOf = () => permsSvc.setAcls.mock.calls[0][1]

    it('writes the subject into exactly the permissions admin requires', () => {
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.setSubjectLevel('alice', 'admin')

      expect(permsSvc.setAcls).toHaveBeenCalledTimes(1)
      expect(permsSvc.setAcls.mock.calls[0][0]).toBe(RECORD)
      expect(bodyOf()).toEqual({
        read: ['alice'], write: ['alice'], admin: ['alice'], delete: ['alice']
      })
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    it('drops the permissions a downgrade no longer includes', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      component.setSubjectLevel('alice', 'view')

      expect(permsSvc.setAcls).toHaveBeenCalledTimes(1)
      expect(bodyOf()).toEqual({ read: ['alice'], write: [], admin: [], delete: [] })
    })

    it('leaves everyone else untouched', () => {
      component.acls.set(makeAcls(['bob', 'alice'], ['bob'], ['bob'], ['bob']))
      component.setSubjectLevel('alice', 'update')

      const body = bodyOf()
      expect(body.read).toEqual(expect.arrayContaining(['bob', 'alice']))
      expect(body.write).toEqual(expect.arrayContaining(['bob', 'alice']))
      expect(body.admin).toEqual(['bob'])
      expect(body.delete).toEqual(['bob'])
    })

    it('emits permissionsChanged and refreshes once the write lands', () => {
      const emitted = jest.fn()
      component.permissionsChanged.subscribe(emitted)
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.setSubjectLevel('alice', 'admin')

      expect(emitted).toHaveBeenCalledTimes(1)
      expect(permsSvc.getAcls).toHaveBeenCalled()
    })

    it('does not emit when emitChange is false', () => {
      const emitted = jest.fn()
      component.permissionsChanged.subscribe(emitted)
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.setSubjectLevel('alice', 'admin', false)

      expect(emitted).not.toHaveBeenCalled()
    })

    it('writes nothing when the subject already holds that level', () => {
      component.acls.set(makeAcls(['alice'], ['alice'], ['alice'], ['alice']))
      component.setSubjectLevel('alice', 'admin')

      expect(permsSvc.setAcls).not.toHaveBeenCalled()
    })

    // a failure used to reach the console only, so the panel just snapped back
    it('surfaces a failed write and clears the busy flag', () => {
      permsSvc.setAcls.mockReturnValueOnce(throwError(() => new Error('nope')))
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.setSubjectLevel('alice', 'admin')

      expect(component.aclsWriteError()).toBeTruthy()
      expect(component.aclsBusy()).toBe(false)
    })
  })

  describe('removeSubject()', () => {
    beforeEach(() => component.singleRecord.set(RECORD))

    // one write, so the subject cannot survive in a list and need removing twice
    it('clears the subject from every permission in one write', () => {
      component.acls.set(makeAcls(['alice', 'bob'], ['alice'], ['alice'], ['alice']))
      component.removeSubject('alice')

      expect(permsSvc.setAcls).toHaveBeenCalledTimes(1)
      expect(permsSvc.setAcls.mock.calls[0][1]).toEqual({
        read: ['bob'], write: [], admin: [], delete: []
      })
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    it('emits permissionsChanged once the write lands', () => {
      const emitted = jest.fn()
      component.permissionsChanged.subscribe(emitted)
      component.acls.set(makeAcls(['alice'], [], [], []))
      component.removeSubject('alice')

      expect(emitted).toHaveBeenCalledTimes(1)
    })
  })

  describe('grantStagedLevel()', () => {
    beforeEach(() => component.singleRecord.set(RECORD))

    // staged people folded into one body: a write each, all built from the same
    // snapshot, would have the last person undo the ones before
    it('adds every staged person in a single write', () => {
      component.acls.set(makeAcls(['owner'], [], ['owner'], []))
      component.staged.set([
        { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }
      ] as any)
      component.grantStagedLevel('admin')

      expect(permsSvc.setAcls).toHaveBeenCalledTimes(1)
      const body = permsSvc.setAcls.mock.calls[0][1]
      for (const s of ['a', 'b', 'c']) {
        expect(body.read).toContain(s)
        expect(body.write).toContain(s)
        expect(body.admin).toContain(s)
        expect(body.delete).toContain(s)
      }
      expect(body.read).toContain('owner')
      expect(body.admin).toContain('owner')
    })

    it('grants view to several people without giving them write', () => {
      component.acls.set(makeAcls([], [], [], []))
      component.staged.set([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] as any)
      component.grantStagedLevel('view')

      expect(permsSvc.setAcls.mock.calls[0][1]).toEqual({
        read: ['a', 'b'], write: [], admin: [], delete: []
      })
    })

    it('emits permissionsChanged once, not once per person', () => {
      const emitted = jest.fn()
      component.permissionsChanged.subscribe(emitted)
      component.acls.set(makeAcls([], [], [], []))
      component.staged.set([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] as any)
      component.grantStagedLevel('update')

      expect(emitted).toHaveBeenCalledTimes(1)
    })

    it('reports a failure instead of silently reverting', () => {
      permsSvc.setAcls.mockReturnValueOnce(throwError(() => new Error('nope')))
      component.acls.set(makeAcls([], [], [], []))
      component.staged.set([{ id: 'a', label: 'A' }] as any)
      component.grantStagedLevel('view')

      expect(component.aclsWriteError()).toBeTruthy()
    })
  })

  // ── grantBulk() ────────────────────────────────────────────────────────────

  describe('grantBulk()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('records', [RECORD])
      component.staged.set([{ id: 'alice', label: 'Alice' }])
      component.bulkLevel = 'update'
    })

    it('writes each record once instead of one request per permission', () => {
      component.grantBulk()

      expect(permsSvc.setAcls).toHaveBeenCalledTimes(1)
      expect(permsSvc.setAcls).toHaveBeenCalledWith(RECORD, makeAcls(['alice'], ['alice'], [], []))
      expect(permsSvc.grantPerm).not.toHaveBeenCalled()
      expect(permsSvc.revokePerm).not.toHaveBeenCalled()
    })

    // Chuan granted admin on two records and one of them came back update.
    it('places the subject at the level asked for, on every record', () => {
      const second: RecordRef = { id: 'mdm1:0002', apiBase: 'https://api.example.com' }
      fixture.componentRef.setInput('records', [RECORD, second])
      component.bulkLevel = 'admin'

      component.grantBulk()

      expect(permsSvc.setAcls).toHaveBeenCalledTimes(2)
      for (const record of [RECORD, second]) {
        expect(permsSvc.setAcls).toHaveBeenCalledWith(
          record, makeAcls(['alice'], ['alice'], ['alice'], ['alice'])
        )
      }
    })

    it('reads each record so the write keeps what that record already held', () => {
      const second: RecordRef = { id: 'mdm1:0002', apiBase: 'https://api.example.com' }
      fixture.componentRef.setInput('records', [RECORD, second])
      permsSvc.getAcls.mockImplementation((r: RecordRef) =>
        of(r.id === RECORD.id ? makeAcls(['bob'], [], [], []) : makeAcls([], [], ['carol'], []))
      )

      component.grantBulk()

      expect(permsSvc.setAcls).toHaveBeenCalledWith(
        RECORD, makeAcls(['bob', 'alice'], ['alice'], [], [])
      )
      expect(permsSvc.setAcls).toHaveBeenCalledWith(
        second, makeAcls(['alice'], ['alice'], ['carol'], [])
      )
    })

    it('places every staged subject in the one write', () => {
      component.staged.set([{ id: 'alice', label: 'Alice' }, { id: 'bob', label: 'Bob' }])

      component.grantBulk()

      expect(permsSvc.setAcls).toHaveBeenCalledTimes(1)
      expect(permsSvc.setAcls).toHaveBeenCalledWith(
        RECORD, makeAcls(['alice', 'bob'], ['alice', 'bob'], [], [])
      )
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
      permsSvc.setAcls.mockReturnValueOnce(throwError(() => new Error('network error')))
      component.grantBulk()
      expect(component.bulkGrantError()).toMatch(/operation/)
    })

    it('does not emit permissionsChanged on partial failure', () => {
      permsSvc.setAcls.mockReturnValueOnce(throwError(() => new Error('network error')))
      jest.spyOn(component.permissionsChanged, 'emit')
      component.grantBulk()
      expect(component.permissionsChanged.emit).not.toHaveBeenCalled()
    })

    it('is a no-op when staged is empty', () => {
      component.staged.set([])
      component.grantBulk()
      expect(permsSvc.setAcls).not.toHaveBeenCalled()
    })

    it('is a no-op when records is empty', () => {
      fixture.componentRef.setInput('records', [])
      component.grantBulk()
      expect(permsSvc.setAcls).not.toHaveBeenCalled()
    })

    it('drops the permissions above the requested level (downgrade support)', () => {
      permsSvc.getAcls.mockReturnValue(of(makeAcls(['alice'], ['alice'], ['alice'], ['alice'])))
      component.bulkLevel = 'view'

      component.grantBulk()

      expect(permsSvc.setAcls).toHaveBeenCalledWith(RECORD, makeAcls(['alice'], [], [], []))
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

  // ── createGroup() ─────────────────────────────────────────────────────────

  describe('createGroup()', () => {
    it('calls groupsSvc.createGroup with trimmed name', () => {
      component.newGroupName = '  My Team  '
      component.createGroup()
      expect(groupsSvc.createGroup).toHaveBeenCalledWith('My Team')
    })

    it('does nothing when name is blank', () => {
      component.newGroupName = '   '
      component.createGroup()
      expect(groupsSvc.createGroup).not.toHaveBeenCalled()
    })

    it('appends the new group to the groups signal', () => {
      groupsSvc.createGroup.mockReturnValue(
        of({ id: 'grp0:alice:newteam', name: 'New Team', owner: 'alice', members: [] })
      )
      component.newGroupName = 'New Team'
      component.groups.set([])
      component.createGroup()
      expect(component.groups()).toHaveLength(1)
      expect(component.groups()[0].id).toBe('grp0:alice:newteam')
    })

    it('resets newGroupName and hides the form on success', () => {
      groupsSvc.createGroup.mockReturnValue(
        of({ id: 'grp0:alice:newteam', name: 'New Team', owner: 'alice', members: [] })
      )
      component.newGroupName = 'New Team'
      component.showNewGroupForm.set(true)
      component.createGroup()
      expect(component.newGroupName).toBe('')
      expect(component.showNewGroupForm()).toBe(false)
    })

    it('logs error on failure', () => {
      groupsSvc.createGroup.mockReturnValue(throwError(() => new Error('500')))
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      component.newGroupName = 'Bad Team'
      component.createGroup()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  // ── deleteGroup() ─────────────────────────────────────────────────────────

  describe('deleteGroup()', () => {
    it('removes the group from the groups signal', () => {
      groupsSvc.deleteGroup.mockReturnValue(of('deleted'))
      component.groups.set([
        { id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: [] },
        { id: 'grp0:alice:other', name: 'Other', owner: 'alice', members: [] },
      ])
      component.deleteGroup('grp0:alice:team')
      expect(component.groups()).toHaveLength(1)
      expect(component.groups()[0].id).toBe('grp0:alice:other')
    })

    it('resets expandedGroupId when the deleted group was expanded', () => {
      groupsSvc.deleteGroup.mockReturnValue(of('deleted'))
      component.groups.set([{ id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: [] }])
      component.expandedGroupId.set('grp0:alice:team')
      component.deleteGroup('grp0:alice:team')
      expect(component.expandedGroupId()).toBeNull()
    })

    it('does not reset expandedGroupId when a different group is deleted', () => {
      groupsSvc.deleteGroup.mockReturnValue(of('deleted'))
      component.groups.set([
        { id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: [] },
        { id: 'grp0:alice:other', name: 'Other', owner: 'alice', members: [] },
      ])
      component.expandedGroupId.set('grp0:alice:team')
      component.deleteGroup('grp0:alice:other')
      expect(component.expandedGroupId()).toBe('grp0:alice:team')
    })
  })

  // ── removeGroupMember() ────────────────────────────────────────────────────

  describe('removeGroupMember()', () => {
    it('removes the member from the group in the groups signal', () => {
      groupsSvc.removeMember.mockReturnValue(of('removed'))
      component.groups.set([{
        id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: ['alice', 'bob']
      }])
      component.removeGroupMember('grp0:alice:team', 'bob')
      expect(component.groups()[0].members).toEqual(['alice'])
      expect(component.groups()[0].members).not.toContain('bob')
    })

    it('does not modify other groups', () => {
      groupsSvc.removeMember.mockReturnValue(of('removed'))
      component.groups.set([
        { id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: ['bob'] },
        { id: 'grp0:alice:other', name: 'Other', owner: 'alice', members: ['bob'] },
      ])
      component.removeGroupMember('grp0:alice:team', 'bob')
      expect(component.groups()[1].members).toContain('bob')
    })
  })

  // ── addGroupMember() ───────────────────────────────────────────────────────

  describe('addGroupMember()', () => {
    beforeEach(() => {
      component.groups.set([{
        id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: []
      }])
      // memberPeopleIndex is a private field; set it via the member search response path
      ;(component as any).memberPeopleIndex = { 'Bob Smith': 'bob' }
    })

    it('calls groupsSvc.addMember with the resolved EID', () => {
      groupsSvc.addMember.mockReturnValue(of(['bob']))
      component.addGroupMember('grp0:alice:team', 'Bob Smith')
      expect(groupsSvc.addMember).toHaveBeenCalledWith('grp0:alice:team', 'bob')
    })

    it('updates the group members signal on success', () => {
      groupsSvc.addMember.mockReturnValue(of(['bob', 'carol']))
      component.addGroupMember('grp0:alice:team', 'Bob Smith')
      expect(component.groups()[0].members).toEqual(['bob', 'carol'])
    })

    it('does nothing when the label has no matching EID in memberPeopleIndex', () => {
      component.addGroupMember('grp0:alice:team', 'Unknown Person')
      expect(groupsSvc.addMember).not.toHaveBeenCalled()
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

  // ── loadNistOrgs — subject prefix ─────────────────────────────────────────

  describe('loadNistOrgs — subject prefix', () => {
    beforeEach(() => {
      // Provide an orgURL so loadNistOrgs doesn't bail out early
      jest.spyOn((component as any).configSvc, 'getConfig').mockReturnValue({ orgURL: 'https://orgs.example.com/api' })
    })

    it('stages a NIST ou org with nistou: prefix', () => {
      // org name contains 'mml' so the name-based filter passes
      const orgApiResponse = { ou: { '728': 'MML Materials Division' } }
      jest.spyOn((component as any).http, 'get').mockReturnValue(of(orgApiResponse))

      component.loadNistOrgs('MML')

      expect(component.nistOrgs()).toContainEqual({ id: 'nistou:728', name: 'MML Materials Division' })
    })

    it('stages a NIST div org with nistdiv: prefix', () => {
      // org name contains 'itl' so the name-based filter passes
      const orgApiResponse = { div: { '456': 'ITL Applied Cybersecurity Division' } }
      jest.spyOn((component as any).http, 'get').mockReturnValue(of(orgApiResponse))

      component.loadNistOrgs('ITL')

      expect(component.nistOrgs()).toContainEqual({ id: 'nistdiv:456', name: 'ITL Applied Cybersecurity Division' })
    })

    it('falls back to the raw key as prefix for unknown org types', () => {
      // org name contains 'x' so the name-based filter passes
      const orgApiResponse = { custom: { '999': 'X Unknown Org' } }
      jest.spyOn((component as any).http, 'get').mockReturnValue(of(orgApiResponse))

      component.loadNistOrgs('X')

      expect(component.nistOrgs()).toContainEqual({ id: 'custom:999', name: 'X Unknown Org' })
    })
  })

  // ── resolveUnknownLabels — EID resolution ─────────────────────────────────

  describe('resolveUnknownLabels — EID resolution', () => {
    // The with_nistUsername query is a substring match on the backend, so the
    // component must keep only the record whose nistUsername equals the EID.
    it('resolves an EID to "First Last" from the exact nistUsername match', () => {
      jest.spyOn((component as any).nsd, 'getPeopleByUsername').mockReturnValue(of([
        { nistUsername: 'mchiang', lastName: 'Chiang', firstName: 'Martin' },
        { nistUsername: 'mch', lastName: 'Hawes', firstName: 'Melvin' },
        { nistUsername: 'pmchu', lastName: 'Chu', firstName: 'Pamela' },
      ]))

      ;(component as any).resolveUnknownLabels(makeAcls(['mch'], [], [], []))

      expect(component.subjectLabels()['mch']).toBe('Melvin Hawes')
    })

    it('leaves the label unset when no record matches the EID exactly', () => {
      jest.spyOn((component as any).nsd, 'getPeopleByUsername').mockReturnValue(of([
        { nistUsername: 'mchiang', lastName: 'Chiang', firstName: 'Martin' },
      ]))

      ;(component as any).resolveUnknownLabels(makeAcls(['mch'], [], [], []))

      expect(component.subjectLabels()['mch']).toBeUndefined()
    })

    it('matches the EID case-insensitively and tolerates a missing firstName', () => {
      jest.spyOn((component as any).nsd, 'getPeopleByUsername').mockReturnValue(of([
        { nistUsername: 'CND7', lastName: 'Davis' },
      ]))

      ;(component as any).resolveUnknownLabels(makeAcls([], ['cnd7'], [], []))

      expect(component.subjectLabels()['cnd7']).toBe('Davis')
    })

    it('does not query the people API for numeric org subjects', () => {
      const spy = jest.spyOn((component as any).nsd, 'getPeopleByUsername')

      ;(component as any).resolveUnknownLabels(makeAcls(['13252'], [], [], []))

      expect(spy).not.toHaveBeenCalled()
      expect(component.subjectLabels()['13252']).toBe('Org group (13252)')
    })
  })

  // ── ngOnChanges dedup ──────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('calls loadGroups() once when records and section=groups both change simultaneously', () => {
      const loadGroupsSpy = jest.spyOn(component, 'loadGroups')
      component.section = 'groups'

      component.ngOnChanges({
        records: { currentValue: [{ id: 'r1', apiBase: 'https://api/' }], previousValue: [], firstChange: false, isFirstChange: () => false },
        section: { currentValue: 'groups', previousValue: 'permissions', firstChange: false, isFirstChange: () => false },
      })

      expect(loadGroupsSpy).toHaveBeenCalledTimes(1)
    })
  })

  // ── org index deduplication ────────────────────────────────────────────────

  describe('org index deduplication', () => {
    // The directory index lists one organization under several search keys — its full
    // name, its abbreviation and its numeric code — all pointing at the same id.
    const mmlIndex = {
      'material measurement laboratory': { '13213': 'Material Measurement Laboratory (63)' },
      'mml': { '13213': 'Material Measurement Laboratory (63)' },
      '63': { '13213': 'Material Measurement Laboratory (63)' },
    }

    it('suggests an org once when the index repeats it under several keys', fakeAsync(() => {
      jest.spyOn((component as any).nsd, 'searchOrgIndex')
        .mockImplementation((endpoint: any) => of(endpoint === 'OU' ? mmlIndex : {}))

      component.onGroupQueryChange('material')
      tick(250)

      expect(component.groupSuggestions()).toHaveLength(1)
      expect(component.groupSuggestions()[0].id).toBe('nistou:13213')
    }))

    it('labels a staged org with the name the directory returned', () => {
      component.stageNistOrg({
        id: 'nistou:13213',
        name: 'Material Measurement Laboratory (63)',
        code: '63',
        type: 'nistou'
      })

      expect(component.subjectLabels()['nistou:13213']).toBe('Material Measurement Laboratory (63)')
    })

    it('resolves an assigned org subject to the directory name, not the index key', () => {
      jest.spyOn((component as any).nsd, 'searchOrgIndex').mockReturnValue(of(mmlIndex))

      ;(component as any).resolveUnknownLabels(makeAcls(['nistou:13213'], [], [], []))

      expect(component.subjectLabels()['nistou:13213']).toBe('Material Measurement Laboratory (63)')
    })
  })
})
