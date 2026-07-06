import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'
import { GROUPS_AUTH_TOKEN } from './groups-auth.token'
import { Acls, RecordRef } from './group.types'

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private http = inject(HttpClient)
  private getToken = inject(GROUPS_AUTH_TOKEN, { optional: true }) ?? (() => '')

  private get headers(): HttpHeaders {
    const token = this.getToken()
    const h = new HttpHeaders()
    return token ? h.set('Authorization', `Bearer ${token}`) : h
  }

  // Backend: /{record.apiBase}/{record.id}/acls  (plural)
  private aclsUrl(record: RecordRef): string {
    return `${record.apiBase.replace(/\/$/, '')}/${record.id}/acls`
  }

  getAcls(record: RecordRef): Observable<Acls> {
    return this.http.get<Acls>(this.aclsUrl(record), { headers: this.headers })
  }

  // PUT /acls — bulk replace all permission lists at once
  setAcls(record: RecordRef, acls: Acls): Observable<Acls> {
    return this.http.put<Acls>(this.aclsUrl(record), acls, { headers: this.headers })
  }

  // POST /acls/{perm} — backend expects a JSON-encoded string body
  grantPerm(record: RecordRef, perm: keyof Acls, subject: string): Observable<string[]> {
    return this.http.post<string[]>(
      `${this.aclsUrl(record)}/${perm}`,
      JSON.stringify(subject),
      { headers: this.headers.set('Content-Type', 'application/json') }
    )
  }

  // DELETE /acls/{perm}/{subject}
  revokePerm(record: RecordRef, perm: keyof Acls, subject: string): Observable<Acls> {
    return this.http.delete<Acls>(
      `${this.aclsUrl(record)}/${perm}/${encodeURIComponent(subject)}`,
      { headers: this.headers }
    )
  }
}
