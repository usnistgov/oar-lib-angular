import { aclSubjects, subjectPermissionLevel } from './permission-level'

describe('subjectPermissionLevel', () => {
  // mdm1:0004, the record that exposed the portal's divergent copy of this rule
  const ACLS = {
    read: ['TestId', 'grp0:public', 'cnd7', 'grg2'],
    write: ['rperlner', 'cnd7', 'grg2'],
    admin: ['TestId', 'mnm16', 'cnd7'],
    delete: ['cnd7']
  }

  it('reads admin first, however the other lists are set', () => {
    expect(subjectPermissionLevel(ACLS, 'cnd7')).toBe('admin')
    expect(subjectPermissionLevel(ACLS, 'mnm16')).toBe('admin')
  })

  // the manager grants write on its own; requiring read as well dropped such a
  // subject from every level instead of listing it as an updater
  it('treats write as update without requiring read', () => {
    expect(subjectPermissionLevel(ACLS, 'rperlner')).toBe('update')
    expect(subjectPermissionLevel({ write: ['solo'] }, 'solo')).toBe('update')
  })

  it('treats read alone as view', () => {
    expect(subjectPermissionLevel(ACLS, 'grp0:public')).toBe('view')
  })

  it('places every subject the record names', () => {
    const placed = aclSubjects(ACLS).filter(s => subjectPermissionLevel(ACLS, s) !== null)
    expect(placed.sort()).toEqual(aclSubjects(ACLS).sort())
  })

  it('returns null for a subject the record does not name, or no acls at all', () => {
    expect(subjectPermissionLevel(ACLS, 'nobody')).toBeNull()
    expect(subjectPermissionLevel(null, 'cnd7')).toBeNull()
    expect(subjectPermissionLevel(undefined, 'cnd7')).toBeNull()
  })
})

describe('aclSubjects', () => {
  it('lists each subject once across all four lists', () => {
    expect(aclSubjects({ read: ['a', 'b'], write: ['b'], admin: ['c'], delete: ['a'] }).sort())
      .toEqual(['a', 'b', 'c'])
  })

  it('is empty when there are no acls', () => {
    expect(aclSubjects(null)).toEqual([])
    expect(aclSubjects({})).toEqual([])
  })
})
