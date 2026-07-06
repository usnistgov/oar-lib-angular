import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'
import { ConfigurationService } from '../config/config.service'
import { GROUPS_AUTH_TOKEN } from './groups-auth.token'
import { Group } from './group.types'

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private http = inject(HttpClient)
  private configService = inject(ConfigurationService)
  private getToken = inject(GROUPS_AUTH_TOKEN, { optional: true }) ?? (() => '')

  private get base(): string {
    return (this.configService.getConfig()['groupAPI'] as string ?? '').replace(/\/$/, '')
  }

  private get headers(): HttpHeaders {
    const token = this.getToken()
    const h = new HttpHeaders()
    return token ? h.set('Authorization', `Bearer ${token}`) : h
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.base, { headers: this.headers })
  }

  // POST body: { name } — backend extracts owner from JWT
  createGroup(name: string): Observable<Group> {
    return this.http.post<Group>(this.base, { name }, { headers: this.headers })
  }

  // Backend returns text/plain ("Group deleted"), not JSON
  deleteGroup(groupId: string): Observable<string> {
    return this.http.delete(
      this.groupUrl(groupId),
      { headers: this.headers, responseType: 'text' }
    )
  }

  // Backend: POST /{shoulder}/{groupId} — returns the updated members array, not the full group
  addMember(groupId: string, memberId: string): Observable<string[]> {
    return this.http.post<string[]>(
      this.groupUrl(groupId),
      JSON.stringify(memberId),
      { headers: this.headers.set('Content-Type', 'application/json') }
    )
  }

  // Backend returns text/plain ("Removed … from group …"), not JSON
  removeMember(groupId: string, memberId: string): Observable<string> {
    return this.http.delete(
      `${this.groupUrl(groupId)}/${encodeURIComponent(memberId)}`,
      { headers: this.headers, responseType: 'text' }
    )
  }

  // Group IDs are "{shoulder}:{owner}:{name}" — backend requires /{shoulder}/{groupId} routing.
  // colonIdx > 0 guards against IDs with no prefix (fall back to grp0).
  private groupUrl(groupId: string): string {
    const colonIdx = groupId.indexOf(':')
    const shoulder = colonIdx > 0 ? groupId.substring(0, colonIdx) : 'grp0'
    return `${this.base}/${shoulder}/${groupId}`
  }
}
