import { Acls } from './group.types'

export type PermissionLevel = 'view' | 'update' | 'admin'

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
  return [...new Set([
    ...(acls.read ?? []),
    ...(acls.write ?? []),
    ...(acls.admin ?? []),
    ...(acls.delete ?? [])
  ])]
}
