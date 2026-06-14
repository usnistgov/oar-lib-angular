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
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` })
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.base, { headers: this.headers })
  }

  // POST body: { name } — backend extracts owner from JWT
  createGroup(name: string): Observable<Group> {
    return this.http.post<Group>(this.base, { name }, { headers: this.headers })
  }

  deleteGroup(groupId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${groupId}`, { headers: this.headers })
  }

  // Backend: POST /{groupId} with body as the member ID string directly
  addMember(groupId: string, memberId: string): Observable<Group> {
    return this.http.post<Group>(
      `${this.base}/${groupId}`,
      memberId,
      { headers: this.headers.set('Content-Type', 'application/json') }
    )
  }

  // Backend: DELETE /{groupId}/{memberId}
  removeMember(groupId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${groupId}/${encodeURIComponent(memberId)}`,
      { headers: this.headers }
    )
  }
}
