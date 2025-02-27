import { ComponentFixture, TestBed, waitForAsync, async  } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Configuration, CONFIG_URL } from '../config/config.model';
import { ConfigurationService } from '../config/config.service';
import { StaffDirModule, StaffDirectoryService, SDSIndex, SDSuggestion } from './staffdir.module';
import { environment } from '../../environments/environment';

describe('StaffServiceService', () => {
    let service: StaffDirectoryService;
    let httpMock: HttpTestingController;
    let svcep : string = "https://mds.nist.gov/midas/nsd";

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule, StaffDirModule ],
            providers: [
                { provide: CONFIG_URL, useValue: environment.configUrl }
            ]
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);

        let req = httpMock.expectOne('assets/config.json');
        req.flush({
            staffdir: {
                serviceEndpoint: svcep
            }
        });

        service = TestBed.inject(StaffDirectoryService);
    }));

    afterEach(() => {
        // After every test, assert that there are no more pending requests.
        // This throws an error if there are any requests that haven't been flushed yet.
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service instanceof StaffDirectoryService).toBeTruthy();
        let svc = service as StaffDirectoryService;
        expect(svc._cfg).toBeTruthy();
        expect(svc._cfg.serviceEndpoint).toEqual(svcep+'/');
    });

    it('getPerson()', async () => {
        const pdata = {
            peopleID: 3,
            lastName: "Cranston",
            firstName: "Gurn"
        };
        const svcpromise = service.getPerson(3).toPromise();
        const req = httpMock.expectOne(svcep+"/People/3");
        expect(req.request.method).toBe('GET');
        req.flush(pdata);

        const person = await svcpromise;
        expect(person).toEqual(pdata);
    });

    it('getPersonByORCID()', async () => {
        const pdata = {
            peopleID: 3,
            lastName: "Cranston",
            firstName: "Gurn",
            orcid: "0000"
        };
        const svcpromise = service.getPersonByORCID("0000").toPromise();
        const req = httpMock.expectOne(svcep+"/People?with_orcid="+pdata.orcid);
        expect(req.request.method).toBe('GET');
        req.flush([pdata]);

        const person = await svcpromise;
        expect(person).toEqual(pdata);
    });

    it('getPersonByUserName()', async () => {
        const pdata = {
            peopleID: 3,
            lastName: "Cranston",
            firstName: "Gurn",
            orcid: "0000",
            nistUsername: "grc0"
        };
        const svcpromise = service.getPersonByUserName("grc0").toPromise();
        const req = httpMock.expectOne(svcep+"/People?with_nistUsername="+pdata.nistUsername);
        expect(req.request.method).toBe('GET');
        req.flush([pdata]);

        const person = await svcpromise;
        expect(person).toEqual(pdata);
    });

    it('getPeopleIndexFor()', async () => {
        const pdata = {
            peopleID: 3,
            lastName: "Cranston",
            firstName: "Gurn",
            orcid: "0000"
        };
        const idxdata = {
            "gurn": { "3": "Cranston, Gurn" },
            "gary": { "5": "Cooper, Gary", "7": "Cole, Gary" }
        }
        const svcpromise = service.getPeopleIndexFor("cran").toPromise();
        const req = httpMock.expectOne(svcep+"/People/index?like=cran");
        expect(req.request.method).toBe('GET');
        req.flush(idxdata);

        let index: SDSIndex = (await svcpromise) as SDSIndex;
        expect(index).not.toBeNull();
        let suggs: SDSuggestion[] = index.getSuggestions("gurn");
        expect(suggs.length).toEqual(1);
        expect(suggs[0].id).toEqual(3);
        expect(suggs[0].display).toEqual("Cranston, Gurn");
    });

    it('getOrg()', async () => {
        const odata = {
            orG_ID: 4,
            parentT_ORG_ID: 1,
            orG_Name: "Data Sciences Group"
        };
        const svcpromise = service.getOrg(4).toPromise();
        const req = httpMock.expectOne(svcep+"/Orgs/4");
        expect(req.request.method).toBe('GET');
        req.flush(odata);

        const org = await svcpromise;
        expect(org).toEqual(odata);
    });

    it('getOrgsIndexFor()', async () => {
        const odata = {
            orG_ID: 4,
            parentT_ORG_ID: 1,
            orG_Name: "Data Sciences Group",
            orG_CD: "64201"
        };
        const idxdata = {
            "data": { "4": "Data Sciences Group (64101)", "5": "Data Services Group (64102)" }
        }
        const svcpromise = service.getOrgsIndexFor("data").toPromise();
        const req = httpMock.expectOne(svcep+"/Orgs/index?like=data");
        expect(req.request.method).toBe('GET');
        req.flush(idxdata);

        let index: SDSIndex = (await svcpromise) as SDSIndex;
        expect(index).not.toBeNull();
        let suggs: SDSuggestion[] = index.getSuggestions("data");
        expect(suggs.length).toEqual(2);
        expect(suggs[0].id).toEqual(4);
        expect(suggs[0].display).toEqual("Data Sciences Group (64101)");
        expect(suggs[1].id).toEqual(5);
        expect(suggs[1].display).toEqual("Data Services Group (64102)");
    });

    it('getOrgsFor()', () => {
        const odata = [
          {
            "orG_Name": "Bureau of Western Mythology", 
            "parenT_ORG_ID": 5,
            "parenT_ORG_CD": "100",
            "orG_ID": 7, 
            "orG_CD": "10000", 
          }, 
          {
            "orG_Name": "Lost Electricity Reclamation Agency", 
            "parenT_ORG_ID": 3,
            "parenT_ORG_CD": "03",
            "orG_ID": 5, 
            "orG_CD": "100", 
          }, 
          {
            "orG_Name": "Department of Failure", 
            "parenT_ORG_ID": null,
            "parenT_ORG_CD": null,
            "orG_CD": "03", 
            "orG_ID": 3, 
          }
        ];
        const pdata = {
            peopleID: 3,
            lastName: "Cranston",
            firstName: "Gurn",
            groupOrgID: 7,
            orcid: "0000"
        };

        service.getOrgsFor(3).subscribe(orgs => {
            expect(orgs).not.toBeNull();
            orgs = orgs as any[];
            expect(orgs.length).toEqual(3);
            expect(orgs[0]).toEqual(odata[0]);
            expect(orgs[1]).toEqual(odata[1]);
            expect(orgs[2]).toEqual(odata[2]);
        });

        const preq = httpMock.expectOne(svcep+"/People/3");
        preq.flush(pdata);
        httpMock.expectOne(svcep+"/Orgs/7").flush(odata[0]);
        httpMock.expectOne(svcep+"/Orgs/5").flush(odata[1]);
        httpMock.expectOne(svcep+"/Orgs/3").flush(odata[2]);
    });

    it('getParentOrgs()', async () => {
        const odata = [
          {
            "orG_Name": "Bureau of Western Mythology", 
            "parenT_ORG_ID": 5,
            "parenT_ORG_CD": "100",
            "orG_ID": 7, 
            "orG_CD": "10000", 
          }, 
          {
            "orG_Name": "Lost Electricity Reclamation Agency", 
            "parenT_ORG_ID": 3,
            "parenT_ORG_CD": "03",
            "orG_ID": 5, 
            "orG_CD": "100", 
          }, 
          {
            "orG_Name": "Department of Failure", 
            "parenT_ORG_ID": null,
            "parenT_ORG_CD": null,
            "orG_CD": "03", 
            "orG_ID": 3, 
          }
        ];

        const svcpromise = service.getParentOrgs(7, true).toPromise()

        httpMock.expectOne(svcep+"/Orgs/7").flush(odata[0]);
        httpMock.expectOne(svcep+"/Orgs/5").flush(odata[1]);
        httpMock.expectOne(svcep+"/Orgs/3").flush(odata[2]);

        let orgs = await svcpromise;

        expect(orgs).not.toBeNull();
        orgs = orgs as any[];
        expect(orgs.length).toEqual(3);
        expect(orgs[0]).toEqual(odata[0]);
        expect(orgs[1]).toEqual(odata[1]);
        expect(orgs[2]).toEqual(odata[2]);
    });

    it('getParentOrgs() without ref org', async () => {
        const odata = [
          {
            "orG_Name": "Bureau of Western Mythology", 
            "parenT_ORG_ID": 5,
            "parenT_ORG_CD": "100",
            "orG_ID": 7, 
            "orG_CD": "10000", 
          }, 
          {
            "orG_Name": "Lost Electricity Reclamation Agency", 
            "parenT_ORG_ID": 3,
            "parenT_ORG_CD": "03",
            "orG_ID": 5, 
            "orG_CD": "100", 
          }, 
          {
            "orG_Name": "Department of Failure", 
            "parenT_ORG_ID": null,
            "parenT_ORG_CD": null,
            "orG_CD": "03", 
            "orG_ID": 3, 
          }
        ];

        const svcpromise = service.getParentOrgs(7).toPromise();

        httpMock.expectOne(svcep+"/Orgs/7").flush(odata[0]);
        httpMock.expectOne(svcep+"/Orgs/5").flush(odata[1]);
        httpMock.expectOne(svcep+"/Orgs/3").flush(odata[2]);
        
        let orgs = await svcpromise;

        expect(orgs).not.toBeNull();
        orgs = orgs as any[];
        expect(orgs.length).toEqual(2);
        expect(orgs[0]).toEqual(odata[1]);
        expect(orgs[1]).toEqual(odata[2]);
    });
});

    
