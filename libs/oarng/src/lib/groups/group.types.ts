export interface Group {
  id: string
  name: string
  owner: string
  members: string[]
}

export type AclPerm = 'read' | 'write' | 'admin' | 'delete'

export interface Acls {
  read: string[]
  write: string[]
  admin: string[]
  delete: string[]
}
