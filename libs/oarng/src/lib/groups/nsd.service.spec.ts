import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { NsdService } from './nsd.service'
import { ConfigurationService } from '../config/config.service'
import { GROUPS_AUTH_TOKEN } from './groups-auth.token'

const CONFIG = { staffdir: { serviceEndpoint: 'https://nsd.example.com/oar1' } }

describe('NsdService', () => {
  let svc: NsdService
  let httpMock: HttpTestingController

  describe('with an auth token', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: ConfigurationService, useValue: { getConfig: () => CONFIG } },
          { provide: GROUPS_AUTH_TOKEN, useValue: () => 'tok123' },
        ]
      })
      svc = TestBed.inject(NsdService)
      httpMock = TestBed.inject(HttpTestingController)
    })

    afterEach(() => httpMock.verify())

    it('getPeopleByUsername queries with_nistUsername with the bearer token', () => {
      svc.getPeopleByUsername('cnd7').subscribe()

      const req = httpMock.expectOne('https://nsd.example.com/oar1/people?with_nistUsername=cnd7')
      expect(req.request.method).toBe('GET')
      expect(req.request.headers.get('Authorization')).toBe('Bearer tok123')
      req.flush([])
    })

    it('getPeopleByUsername URL-encodes the username', () => {
      svc.getPeopleByUsername('a b').subscribe()

      const req = httpMock.expectOne('https://nsd.example.com/oar1/people?with_nistUsername=a%20b')
      req.flush([])
    })

    it('searchPeople uppercases the query against the index endpoint', () => {
      svc.searchPeople('davis').subscribe()

      const req = httpMock.expectOne('https://nsd.example.com/oar1/people/index?DAVIS')
      expect(req.request.headers.get('Authorization')).toBe('Bearer tok123')
      req.flush({})
    })
  })

  describe('without an auth token', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: ConfigurationService, useValue: { getConfig: () => CONFIG } },
        ]
      })
      svc = TestBed.inject(NsdService)
      httpMock = TestBed.inject(HttpTestingController)
    })

    afterEach(() => httpMock.verify())

    it('getPeopleByUsername sends no Authorization header', () => {
      svc.getPeopleByUsername('cnd7').subscribe()

      const req = httpMock.expectOne('https://nsd.example.com/oar1/people?with_nistUsername=cnd7')
      expect(req.request.headers.has('Authorization')).toBe(false)
      req.flush([])
    })
  })
})
