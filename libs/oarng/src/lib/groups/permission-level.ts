import { Acls, AclPerm } from './group.types'

export type PermissionLevel = 'view' | 'update' | 'admin'

/** The only permissions the ACL endpoint accepts; anything else it rejects outright. */
const ACL_PERMS: readonly AclPerm[] = ['read', 'write', 'admin', 'delete']

export const LEVEL_PERMS: Record<PermissionLevel, AclPerm[]> = {
  view: ['read'],
  update: ['read', 'write'],
  admin: ['read', 'write', 'admin', 'delete'],
}

/**
 * The level a subject holds on a record, as the permission manager presents it.
 *
 * Write is not required to come with read: the manager grants write on its own,
 * and such a subject is an updater. Treating them as unplaced hides them from
 * whatever is listing the record's permissions.
 */
export function subjectPermissionLevel(
  acls: Acls | null | undefined,
  subject: string
): PermissionLevel | null {
  if (!acls) return null
  if (acls.admin?.includes(subject)) return 'admin'
  if (acls.write?.includes(subject)) return 'update'
  if (acls.read?.includes(subject)) return 'view'
  return null
}

/** Every subject named anywhere in a record's acls, each once. */
export function aclSubjects(acls: Acls | null | undefined): string[] {
  if (!acls) return []
  return [...new Set(ACL_PERMS.flatMap(p => acls[p] ?? []))]
}

/**
 * A copy of `acls` carrying only the four standard permissions.
 *
 * A record that has been through review also holds `publish` and `_read`-style
 * keys, and the endpoint rejects a body containing any of them — for the whole
 * request, before it writes anything. So a payload is built from this, never
 * from the record as it was read.
 */
function standardPerms(acls: Acls | null | undefined): Record<AclPerm, string[]> {
  return {
    read: [...(acls?.read ?? [])],
    write: [...(acls?.write ?? [])],
    admin: [...(acls?.admin ?? [])],
    delete: [...(acls?.delete ?? [])],
  }
}

/** `acls` with `subject` absent from all four permissions. */
export function withoutSubject(acls: Acls | null | undefined, subject: string): Acls {
  const next = standardPerms(acls)
  for (const perm of ACL_PERMS) next[perm] = next[perm].filter(s => s !== subject)
  return next
}

/** `acls` with `subject` holding exactly `level` and nothing above it. */
export function withSubjectAtLevel(
  acls: Acls | null | undefined,
  subject: string,
  level: PermissionLevel
): Acls {
  const next = withoutSubject(acls, subject) as Record<AclPerm, string[]>
  for (const perm of LEVEL_PERMS[level]) next[perm] = [...next[perm], subject]
  return next
}
