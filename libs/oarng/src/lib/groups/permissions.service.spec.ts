import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { PermissionsService } from './permissions.service'
import { GROUPS_AUTH_TOKEN } from './groups-auth.token'
import { RecordRef, Acls } from './group.types'

const RECORD: RecordRef = { id: 'mdm1:0001', apiBase: 'https://api.example.com/midas/dmp/1.0' }
const ACLS: Acls = { read: ['alice'], write: ['alice'], admin: ['alice'], delete: ['alice'] }
const EMPTY_ACLS: Acls = { read: [], write: [], admin: [], delete: [] }

describe('PermissionsService — URL construction and HTTP methods', () => {
  let svc: PermissionsService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PermissionsService]
    })
    svc = TestBed.inject(PermissionsService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  describe('getAcls()', () => {
    it('issues GET to {apiBase}/{id}/acls', () => {
      svc.getAcls(RECORD).subscribe()
      const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls')
      expect(req.request.method).toBe('GET')
      req.flush(ACLS)
    })

    it('strips trailing slash from apiBase', () => {
      svc.getAcls({ ...RECORD, apiBase: 'https://api.example.com/midas/dmp/1.0/' }).subscribe()
      const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls')
      req.flush(ACLS)
    })

    it('does not set Authorization header when no token provider is given', () => {
      svc.getAcls(RECORD).subscribe()
      const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls')
      expect(req.request.headers.has('Authorization')).toBe(false)
      req.flush(ACLS)
    })
  })

  describe('setAcls()', () => {
    it('issues PUT to {apiBase}/{id}/acls with the full acls object', () => {
      svc.setAcls(RECORD, ACLS).subscribe()
      const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls')
      expect(req.request.method).toBe('PUT')
      expect(req.request.body).toEqual(ACLS)
      req.flush(ACLS)
    })
  })

  describe('grantPerm()', () => {
    it('issues POST to .../acls/{perm}', () => {
      svc.grantPerm(RECORD, 'read', 'alice').subscribe()
      const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/read')
      expect(req.request.method).toBe('POST')
      req.flush(['alice'])
    })

    it('sends JSON-encoded subject string as body', () => {
      svc.grantPerm(RECORD, 'read', 'alice').subscribe()
      const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/read')
      expect(req.request.body).toBe('"alice"')
      req.flush(['alice'])
    })

    it('sets Content-Type: application/json', () => {
      svc.grantPerm(RECORD, 'write', 'alice').subscribe()
      const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/write')
      expect(req.request.headers.get('Content-Type')).toBe('application/json')
      req.flush(['alice'])
    })

    it('works for all four permission types', () => {
      for (const perm of ['read', 'write', 'admin', 'delete'] as const) {
        svc.grantPerm(RECORD, perm, 'alice').subscribe()
        const req = http.expectOne(
          `https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/${perm}`
        )
        req.flush(['alice'])
      }
    })
  })

  describe('revokePerm()', () => {
    it('issues DELETE to .../acls/{perm}/{subject}', () => {
      svc.revokePerm(RECORD, 'admin', 'alice').subscribe()
      const req = http.expectOne(
        'https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/admin/alice'
      )
      expect(req.request.method).toBe('DELETE')
      req.flush(EMPTY_ACLS)
    })

    it('URL-encodes a subject containing colons (group ID)', () => {
      svc.revokePerm(RECORD, 'read', 'grp0:alice:team').subscribe()
      const req = http.expectOne(
        'https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/read/grp0%3Aalice%3Ateam'
      )
      req.flush(EMPTY_ACLS)
    })
  })
})

describe('PermissionsService — Authorization header with token', () => {
  let svc: PermissionsService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PermissionsService,
        { provide: GROUPS_AUTH_TOKEN, useValue: () => 'test-bearer-token' }
      ]
    })
    svc = TestBed.inject(PermissionsService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('includes Authorization: Bearer {token} on GET requests', () => {
    svc.getAcls(RECORD).subscribe()
    const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls')
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-bearer-token')
    req.flush(ACLS)
  })

  it('includes Authorization header on POST requests', () => {
    svc.grantPerm(RECORD, 'read', 'alice').subscribe()
    const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/read')
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-bearer-token')
    req.flush(['alice'])
  })

  it('includes Authorization header on DELETE requests', () => {
    svc.revokePerm(RECORD, 'read', 'alice').subscribe()
    const req = http.expectOne('https://api.example.com/midas/dmp/1.0/mdm1:0001/acls/read/alice')
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-bearer-token')
    req.flush(EMPTY_ACLS)
  })
})
