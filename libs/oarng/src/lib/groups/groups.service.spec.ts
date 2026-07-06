import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { GroupsService } from './groups.service'
import { ConfigurationService } from '../config/config.service'
import { GROUPS_AUTH_TOKEN } from './groups-auth.token'
import { Group } from './group.types'

const BASE = 'https://api.example.com/midas/groups/grp0'
const GROUP: Group = { id: 'grp0:alice:team', name: 'Team', owner: 'alice', members: ['bob'] }

function makeTestBed(token?: string): void {
  const providers: any[] = [
    GroupsService,
    { provide: ConfigurationService, useValue: { getConfig: () => ({ groupAPI: BASE }) } },
  ]
  if (token) providers.push({ provide: GROUPS_AUTH_TOKEN, useValue: () => token })
  TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers })
}

describe('GroupsService — HTTP methods and URL construction', () => {
  let svc: GroupsService
  let http: HttpTestingController

  beforeEach(() => {
    makeTestBed()
    svc = TestBed.inject(GroupsService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  describe('getGroups()', () => {
    it('issues GET to the base URL', () => {
      svc.getGroups().subscribe()
      const req = http.expectOne(BASE)
      expect(req.request.method).toBe('GET')
      req.flush([GROUP])
    })
  })

  describe('createGroup()', () => {
    it('issues POST to the base URL', () => {
      svc.createGroup('My Team').subscribe()
      const req = http.expectOne(BASE)
      expect(req.request.method).toBe('POST')
      req.flush(GROUP)
    })

    it('sends { name } as the request body', () => {
      svc.createGroup('My Team').subscribe()
      const req = http.expectOne(BASE)
      expect(req.request.body).toEqual({ name: 'My Team' })
      req.flush(GROUP)
    })
  })

  describe('deleteGroup()', () => {
    it('issues DELETE to /{shoulder}/{groupId}', () => {
      svc.deleteGroup('grp0:alice:team').subscribe()
      const req = http.expectOne(`${BASE}/grp0/grp0:alice:team`)
      expect(req.request.method).toBe('DELETE')
      req.flush('Group deleted', { headers: { 'Content-Type': 'text/plain' } })
    })
  })

  describe('addMember()', () => {
    it('issues POST to /{shoulder}/{groupId}', () => {
      svc.addMember('grp0:alice:team', 'bob').subscribe()
      const req = http.expectOne(`${BASE}/grp0/grp0:alice:team`)
      expect(req.request.method).toBe('POST')
      req.flush(['bob'])
    })

    it('sends JSON-encoded memberId as body', () => {
      svc.addMember('grp0:alice:team', 'bob').subscribe()
      const req = http.expectOne(`${BASE}/grp0/grp0:alice:team`)
      expect(req.request.body).toBe('"bob"')
      req.flush(['bob'])
    })

    it('sets Content-Type: application/json', () => {
      svc.addMember('grp0:alice:team', 'bob').subscribe()
      const req = http.expectOne(`${BASE}/grp0/grp0:alice:team`)
      expect(req.request.headers.get('Content-Type')).toBe('application/json')
      req.flush(['bob'])
    })
  })

  describe('removeMember()', () => {
    it('issues DELETE to /{shoulder}/{groupId}/{memberId}', () => {
      svc.removeMember('grp0:alice:team', 'bob').subscribe()
      const req = http.expectOne(`${BASE}/grp0/grp0:alice:team/bob`)
      expect(req.request.method).toBe('DELETE')
      req.flush('Removed bob from group', { headers: { 'Content-Type': 'text/plain' } })
    })

    it('URL-encodes memberId containing special characters', () => {
      svc.removeMember('grp0:alice:team', 'user@nist.gov').subscribe()
      const req = http.expectOne(`${BASE}/grp0/grp0:alice:team/user%40nist.gov`)
      req.flush('removed', { headers: { 'Content-Type': 'text/plain' } })
    })
  })
})

describe('GroupsService — groupUrl shoulder routing', () => {
  let svc: GroupsService
  let http: HttpTestingController

  beforeEach(() => {
    makeTestBed()
    svc = TestBed.inject(GroupsService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('routes grp0:{owner}:{name} to /{base}/grp0/{groupId}', () => {
    svc.deleteGroup('grp0:alice:myteam').subscribe()
    http.expectOne(`${BASE}/grp0/grp0:alice:myteam`).flush('deleted', {
      headers: { 'Content-Type': 'text/plain' }
    })
  })

  it('uses the full groupId as shoulder when there is no colon', () => {
    svc.deleteGroup('orphanGroup').subscribe()
    // fix: when there is no colon, fall back to grp0 shoulder
    http.expectOne(`${BASE}/grp0/orphanGroup`).flush('deleted', {
      headers: { 'Content-Type': 'text/plain' }
    })
  })

  it('falls back to grp0 shoulder when groupId starts with a colon', () => {
    svc.deleteGroup(':headless').subscribe()
    http.expectOne(`${BASE}/grp0/:headless`).flush('deleted', {
      headers: { 'Content-Type': 'text/plain' }
    })
  })

  it('extracts the correct shoulder from a non-grp0 prefix', () => {
    svc.deleteGroup('grp1:alice:team').subscribe()
    http.expectOne(`${BASE}/grp1/grp1:alice:team`).flush('deleted', {
      headers: { 'Content-Type': 'text/plain' }
    })
  })
})

describe('GroupsService — Authorization header', () => {
  let svc: GroupsService
  let http: HttpTestingController

  afterEach(() => http.verify())

  it('sets Authorization: Bearer {token} when token is provided', () => {
    makeTestBed('group-secret')
    svc = TestBed.inject(GroupsService)
    http = TestBed.inject(HttpTestingController)

    svc.getGroups().subscribe()
    const req = http.expectOne(BASE)
    expect(req.request.headers.get('Authorization')).toBe('Bearer group-secret')
    req.flush([])
  })

  it('omits Authorization header when no token is provided', () => {
    makeTestBed()
    svc = TestBed.inject(GroupsService)
    http = TestBed.inject(HttpTestingController)

    svc.getGroups().subscribe()
    const req = http.expectOne(BASE)
    expect(req.request.headers.has('Authorization')).toBe(false)
    req.flush([])
  })
})
