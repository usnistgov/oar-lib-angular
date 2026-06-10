export interface Group {
  id: string
  name: string
  owner: string
  members: string[]
}

export interface RecordRef {
  id: string
  apiBase: string
}

export type AclPerm = 'read' | 'write' | 'admin' | 'delete'

export interface Acls {
  read: string[]
  write: string[]
  admin: string[]
  delete: string[]
}
