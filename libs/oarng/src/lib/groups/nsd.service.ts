import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { ConfigurationService } from '../config/config.service'
import { GROUPS_AUTH_TOKEN } from './groups-auth.token'

@Injectable({ providedIn: 'root' })
export class NsdService {
  private http = inject(HttpClient)
  private configSvc = inject(ConfigurationService)
  private getToken = inject(GROUPS_AUTH_TOKEN, { optional: true }) ?? (() => '')

  private get base(): string {
    const endpoint = (this.configSvc.getConfig<any>().staffdir?.serviceEndpoint ?? '') as string
    return endpoint.replace(/\/?$/, '/')
  }

  private headers(): { [key: string]: string } {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  searchPeople(query: string): Observable<any> {
    return this.http.get<any>(
      `${this.base}people/index?${encodeURIComponent(query.toUpperCase())}`,
      { headers: this.headers() }
    )
  }

  searchOrgIndex(endpoint: string, query?: string): Observable<any> {
    const url = query
      ? `${this.base}orgs/${endpoint}/index?${encodeURIComponent(query.toUpperCase())}`
      : `${this.base}orgs/${endpoint}/index`
    return this.http.get<any>(url, { headers: this.headers() })
  }

  getPerson(peopleId: string): Observable<any> {
    return this.http.get<any>(
      `${this.base}people/${peopleId}`,
      { headers: this.headers() }
    )
  }
}
