import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { SubjectLabelService } from './subject-label.service'
import { NsdService } from './nsd.service'

// The directory index lists one organization under several search keys — its full name,
// its abbreviation and its numeric code — all pointing at the same id.
const MML_INDEX = {
  'material measurement laboratory': { '13213': 'Material Measurement Laboratory (63)' },
  'mml': { '13213': 'Material Measurement Laboratory (63)' },
  '63': { '13213': 'Material Measurement Laboratory (63)' },
}

describe('SubjectLabelService', () => {
  let svc: SubjectLabelService
  let nsd: { searchOrgIndex: jest.Mock; getPeopleByUsername: jest.Mock }

  beforeEach(() => {
    nsd = {
      searchOrgIndex: jest.fn().mockReturnValue(of({})),
      getPeopleByUsername: jest.fn().mockReturnValue(of([])),
    }
    TestBed.configureTestingModule({
      providers: [SubjectLabelService, { provide: NsdService, useValue: nsd }]
    })
    svc = TestBed.inject(SubjectLabelService)
  })

  describe('parseOrgIndex()', () => {
    it('collapses the repeated keys into one entry per id', () => {
      const orgs = svc.parseOrgIndex(MML_INDEX, 'nistou')

      expect(orgs).toHaveLength(1)
      expect(orgs[0]).toEqual({
        id: 'nistou:13213',
        name: 'Material Measurement Laboratory (63)',
        code: '63',
        type: 'nistou'
      })
    })

    it('keeps organizations that differ by id', () => {
      const orgs = svc.parseOrgIndex({
        'engineering laboratory': { '13215': 'Engineering Laboratory (73)' },
        'el': { '13215': 'Engineering Laboratory (73)' },
        'physical measurement laboratory': { '13214': 'Physical Measurement Laboratory (68)' },
      }, 'nistou')

      expect(orgs.map(o => o.id).sort()).toEqual(['nistou:13214', 'nistou:13215'])
    })

    it('returns nothing for a non-object response', () => {
      expect(svc.parseOrgIndex(null, 'nistou')).toEqual([])
      expect(svc.parseOrgIndex('nope', 'nistou')).toEqual([])
    })
  })

  describe('searchOrgs()', () => {
    it('returns an org once even though the index repeats it', () => {
      nsd.searchOrgIndex.mockImplementation((endpoint: string) =>
        of(endpoint === 'OU' ? MML_INDEX : {}))

      let result: any[] = []
      svc.searchOrgs('material').subscribe(r => result = r)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('nistou:13213')
    })

    it('matches on a word prefix, not a bare substring', () => {
      nsd.searchOrgIndex.mockImplementation((endpoint: string) =>
        of(endpoint === 'OU' ? MML_INDEX : {}))

      let measurement: any[] = []
      let aterial: any[] = []
      svc.searchOrgs('measurement').subscribe(r => measurement = r)
      svc.searchOrgs('aterial').subscribe(r => aterial = r)

      expect(measurement).toHaveLength(1)
      expect(aterial).toHaveLength(0)
    })

    it('ignores a level whose request fails', () => {
      nsd.searchOrgIndex.mockImplementation((endpoint: string) =>
        endpoint === 'OU' ? of(MML_INDEX) : of({}))

      let result: any[] = []
      svc.searchOrgs('material').subscribe(r => result = r)

      expect(result).toHaveLength(1)
    })
  })

  describe('resolve()', () => {
    it('labels a MIDAS group from the groups the caller supplied, without a lookup', () => {
      svc.resolve(['grp0:alice:team'], [{ id: 'grp0:alice:team', name: 'My Team' }])

      expect(svc.labels()['grp0:alice:team']).toBe('My Team')
      expect(nsd.getPeopleByUsername).not.toHaveBeenCalled()
      expect(nsd.searchOrgIndex).not.toHaveBeenCalled()
    })

    it('resolves an org subject to the directory name, not an index key', () => {
      nsd.searchOrgIndex.mockReturnValue(of(MML_INDEX))

      svc.resolve(['nistou:13213'])

      expect(svc.labels()['nistou:13213']).toBe('Material Measurement Laboratory (63)')
    })

    it('resolves the legacy orgCode:orgId shape', () => {
      nsd.searchOrgIndex.mockReturnValue(of({ '63': { '13213': 'Material Measurement Laboratory (63)' } }))

      svc.resolve(['63:13213'])

      expect(svc.labels()['63:13213']).toBe('Material Measurement Laboratory (63)')
    })

    it('resolves the abbreviation:orgId shape', () => {
      nsd.searchOrgIndex.mockReturnValue(of(MML_INDEX))

      svc.resolve(['mml:13213'])

      expect(svc.labels()['mml:13213']).toBe('Material Measurement Laboratory (63)')
    })

    it('resolves an EID to "Last, First" using the exact nistUsername match', () => {
      nsd.getPeopleByUsername.mockReturnValue(of([
        { nistUsername: 'mchiang', lastName: 'Chiang', firstName: 'Martin' },
        { nistUsername: 'mch', lastName: 'Hawes', firstName: 'Melvin' },
      ]))

      svc.resolve(['mch'])

      expect(svc.labels()['mch']).toBe('Hawes, Melvin')
    })

    it('leaves an EID unlabelled when nothing matches exactly', () => {
      nsd.getPeopleByUsername.mockReturnValue(of([
        { nistUsername: 'mchiang', lastName: 'Chiang', firstName: 'Martin' },
      ]))

      svc.resolve(['mch'])

      expect(svc.labels()['mch']).toBeUndefined()
      expect(svc.label('mch')).toBe('mch')
    })

    it('labels a bare numeric subject without any lookup', () => {
      svc.resolve(['13252'])

      expect(svc.labels()['13252']).toBe('Org group (13252)')
      expect(nsd.getPeopleByUsername).not.toHaveBeenCalled()
    })

    it('does not look a subject up twice', () => {
      nsd.searchOrgIndex.mockReturnValue(of(MML_INDEX))

      svc.resolve(['nistou:13213'])
      const callsAfterFirst = nsd.searchOrgIndex.mock.calls.length
      svc.resolve(['nistou:13213'])

      expect(nsd.searchOrgIndex.mock.calls.length).toBe(callsAfterFirst)
    })
  })
})
