import { Injectable, Signal, inject, signal } from '@angular/core'
import { Observable, forkJoin, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { NsdService } from './nsd.service'

export type OrgType = 'nistou' | 'nistdiv' | 'nistgrp'

export interface OrgEntry {
  id: string
  name: string
  code: string
  type: OrgType
}

const ORG_TYPES: { endpoint: string; prefix: OrgType }[] = [
  { endpoint: 'OU',    prefix: 'nistou'  },
  { endpoint: 'Div',   prefix: 'nistdiv' },
  { endpoint: 'Group', prefix: 'nistgrp' },
]

const ORG_ENDPOINT: Record<OrgType, string> = {
  nistou:  'OU',
  nistdiv: 'Div',
  nistgrp: 'Group',
}

/**
 * Turns the identities held in a record's ACLs — user EIDs, MIDAS group ids and NIST
 * organization ids — into names fit for display, and remembers what it has resolved so
 * an identity shown in several places is looked up once.
 */
@Injectable({ providedIn: 'root' })
export class SubjectLabelService {
  private nsd = inject(NsdService)

  private _labels = signal<Record<string, string>>({})
  readonly labels: Signal<Record<string, string>> = this._labels.asReadonly()

  /** the resolved name for a subject, or the subject itself while it is unknown */
  label(subject: string): string {
    return this._labels()[subject] || subject
  }

  set(subject: string, label: string): void {
    this._labels.update(m => ({ ...m, [subject]: label }))
  }

  /**
   * The directory index lists each organization under several search keys — its full
   * name, its abbreviation and its numeric code — all pointing at the same id, so
   * collapse them to one entry per id.
   */
  parseOrgIndex(raw: any, prefix: OrgType): OrgEntry[] {
    const byId = new Map<string, OrgEntry>()
    if (!raw || typeof raw !== 'object') return []
    Object.keys(raw).forEach(code => {
      const group = raw[code]
      if (group && typeof group === 'object') {
        Object.keys(group).forEach(numericId => {
          const id = `${prefix}:${numericId}`
          const seen = byId.get(id)
          if (!seen) {
            byId.set(id, { id, name: group[numericId], code, type: prefix })
          } else if (/^\d+$/.test(code)) {
            // the numeric key is the organization's own code; the others are search aliases
            seen.code = code
          }
        })
      }
    })
    return [...byId.values()]
  }

  /** organizations with a word starting with `query`, across all three org levels */
  searchOrgs(query: string): Observable<OrgEntry[]> {
    const matches = this.wordPrefixMatcher(query)
    return forkJoin(
      ORG_TYPES.map(({ endpoint, prefix }) =>
        this.nsd.searchOrgIndex(endpoint, query).pipe(
          map(raw => this.parseOrgIndex(raw, prefix).filter(o => matches(o.name))),
          catchError(() => of([] as OrgEntry[]))
        )
      )
    ).pipe(map(results => results.flat()))
  }

  wordPrefixMatcher(query: string): (text: string) => boolean {
    const q = query.toLowerCase()
    return (text: string) => text.toLowerCase().split(/[\s()]+/).some(word => word.startsWith(q))
  }

  /**
   * Resolve the subjects that are not already known.  `groups` carries the MIDAS groups
   * the caller has loaded, whose names need no lookup.
   */
  resolve(subjects: string[], groups: { id: string; name: string }[] = []): void {
    const known = this._labels()
    const sync: Record<string, string> = {}
    const eids: string[] = []
    const orgs: string[] = []

    for (const subject of new Set(subjects)) {
      if (!subject || known[subject]) continue
      const group = groups.find(g => g.id === subject)
      if (group) {
        sync[subject] = group.name
      } else if (/^nist(ou|div|grp):/.test(subject) || /^\d+:\d+$/.test(subject) ||
                 /^[a-z]+:\d+$/.test(subject)) {
        orgs.push(subject)
      } else if (/^\d+$/.test(subject)) {
        sync[subject] = `Org group (${subject})`
      } else {
        eids.push(subject)
      }
    }

    if (Object.keys(sync).length > 0) {
      this._labels.update(m => ({ ...m, ...sync }))
    }
    eids.forEach(eid => this.resolveEid(eid))
    orgs.forEach(subject => this.resolveOrg(subject))
  }

  private resolveEid(eid: string): void {
    this.nsd.getPeopleByUsername(eid).pipe(
      catchError(() => of([]))
    ).subscribe((people: any[]) => {
      if (!Array.isArray(people)) return
      // the with_nistUsername filter is a substring match, so keep only the exact record
      const person = people.find(p => p?.nistUsername?.toLowerCase() === eid.toLowerCase())
      if (!person?.lastName) return
      this.set(eid, person.firstName ? `${person.lastName}, ${person.firstName}` : person.lastName)
    })
  }

  // Org subjects come in three shapes: "nistou:13289" (current), "775:13289"
  // (orgCode:orgId, written by older versions) and "mml:13213" (abbreviation:orgId).
  // The name in the index already carries the organization's code, so it is used as-is.
  private resolveOrg(subject: string): void {
    const colonIdx = subject.indexOf(':')
    const prefix = subject.substring(0, colonIdx)
    const orgId = subject.substring(colonIdx + 1)

    if (/^nist(ou|div|grp)$/.test(prefix)) {
      this.nsd.searchOrgIndex(ORG_ENDPOINT[prefix as OrgType]).pipe(
        catchError(() => of({}))
      ).subscribe((raw: any) => {
        const name = this.findInIndex(raw, orgId)
        if (name) this.set(subject, name)
      })
      return
    }

    forkJoin(
      ORG_TYPES.map(({ endpoint }) => this.nsd.searchOrgIndex(endpoint).pipe(catchError(() => of({}))))
    ).subscribe((responses: any[]) => {
      for (const raw of responses) {
        const name = /^\d+$/.test(prefix)
          ? (raw?.[prefix]?.[orgId] as string | undefined) ?? null
          : this.findInIndex(raw, orgId)
        if (name) {
          this.set(subject, name)
          return
        }
      }
    })
  }

  private findInIndex(raw: any, orgId: string): string | null {
    for (const code of Object.keys(raw ?? {})) {
      const group = raw[code]
      if (group && typeof group === 'object' && group[orgId]) return group[orgId] as string
    }
    return null
  }
}
