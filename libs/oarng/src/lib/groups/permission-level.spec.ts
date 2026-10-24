import { aclSubjects, subjectPermissionLevel, withSubjectAtLevel, withoutSubject } from './permission-level'

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

describe('withSubjectAtLevel / withoutSubject', () => {
  const BASE = {
    read: ['owner', 'viewer'],
    write: ['editor'],
    admin: ['owner'],
    delete: ['owner']
  }

  it('puts the subject in exactly the permissions the level requires', () => {
    expect(withSubjectAtLevel(BASE, 'x', 'view')).toEqual(
      { read: ['owner', 'viewer', 'x'], write: ['editor'], admin: ['owner'], delete: ['owner'] })

    expect(withSubjectAtLevel(BASE, 'x', 'update')).toEqual(
      { read: ['owner', 'viewer', 'x'], write: ['editor', 'x'], admin: ['owner'], delete: ['owner'] })

    expect(withSubjectAtLevel(BASE, 'x', 'admin')).toEqual(
      { read: ['owner', 'viewer', 'x'], write: ['editor', 'x'], admin: ['owner', 'x'], delete: ['owner', 'x'] })
  })

  it('demotes by removing the permissions the new level does not include', () => {
    const asAdmin = withSubjectAtLevel(BASE, 'x', 'admin')
    expect(withSubjectAtLevel(asAdmin, 'x', 'view')).toEqual(
      { read: ['owner', 'viewer', 'x'], write: ['editor'], admin: ['owner'], delete: ['owner'] })
  })

  it('leaves every other subject exactly where it was', () => {
    const next = withSubjectAtLevel(BASE, 'x', 'admin')
    expect(next.read).toEqual(expect.arrayContaining(['owner', 'viewer']))
    expect(next.write).toContain('editor')
    expect(withoutSubject(next, 'x')).toEqual(BASE)
  })

  it('is idempotent', () => {
    const once = withSubjectAtLevel(BASE, 'x', 'update')
    expect(withSubjectAtLevel(once, 'x', 'update')).toEqual(once)
  })

  // the endpoint rejects a body holding any non-standard permission, for the
  // whole request, before it writes — a record that has been through review
  // carries publish and _read-style keys, so they must never be echoed back
  it('never carries a non-standard permission into the result', () => {
    const reviewed = {
      ...BASE,
      publish: ['curator'],
      _read: ['old'],
      _write: ['old']
    } as any

    for (const result of [withSubjectAtLevel(reviewed, 'x', 'admin'), withoutSubject(reviewed, 'owner')]) {
      expect(Object.keys(result).sort()).toEqual(['admin', 'delete', 'read', 'write'])
    }
  })

  it('always emits all four permissions, so an omitted one cannot keep the subject', () => {
    expect(Object.keys(withoutSubject({ read: ['x'] }, 'x')).sort())
      .toEqual(['admin', 'delete', 'read', 'write'])
  })

  it('folds several subjects into one object', () => {
    const next = ['a', 'b', 'c'].reduce((acls, s) => withSubjectAtLevel(acls, s, 'admin'), BASE as any)
    for (const s of ['a', 'b', 'c']) expect(next.admin).toContain(s)
  })

  it('copes with no acls at all', () => {
    expect(withSubjectAtLevel(null, 'x', 'view')).toEqual(
      { read: ['x'], write: [], admin: [], delete: [] })
    expect(withoutSubject(undefined, 'x')).toEqual(
      { read: [], write: [], admin: [], delete: [] })
  })
})

