import { ComponentFixture, TestBed, waitForAsync  } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Configuration, CONFIG_URL } from '../config/config.model';
import { ConfigurationService } from '../config/config.service';
import { AuthModule, AuthenticationService, OARAuthenticationService } from './auth.module';
import { MockAuthenticationService } from './auth.service';
import { Credentials } from './auth';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
    let service: AuthenticationService;
    let httpMock: HttpTestingController;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule, AuthModule ],
            providers: [
                { provide: CONFIG_URL, useValue: environment.configUrl }
            ]
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);

        service = TestBed.inject(AuthenticationService);

        let req = httpMock.expectOne('assets/config.json');
        req.flush({
            auth: {
                serviceEndpoint: "https://auth.nist/"
            }
        });
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service instanceof OARAuthenticationService).toBeTruthy();
        let svc = service as OARAuthenticationService;
        expect(svc.endpoint).toEqual("https://auth.nist/");
    });

    it('should generate a login URL', () => {
        let svc = service as OARAuthenticationService;
        expect(svc.getLoginURL()).toEqual("https://auth.nist/saml/login?redirectTo=http://localhost/");

        let cfgsvc = TestBed.inject(ConfigurationService);
        cfgsvc.loadConfig({
            auth: {
                serviceEndpoint: "https://oarauth.nist/",
                loginBaseURL: "https://login.nist/?redirect="
            }
        });
        expect(svc.getLoginURL()).toEqual("https://login.nist/?redirect=http://localhost/");
        expect(svc.getLoginURL("http://nowhere.net/")).toEqual("https://login.nist/?redirect=http://nowhere.net/");

        cfgsvc.loadConfig({
            auth: {
                serviceEndpoint: "https://oarauth.nist/",
                loginBaseURL: "https://login.nist/redirect=",
                returnURL:  "https://righthere.net/"
            }
        });
        expect(svc.getLoginURL()).toEqual("https://login.nist/redirect=https://righthere.net/");
        expect(svc.getLoginURL("http://nowhere.net/")).toEqual("https://login.nist/redirect=http://nowhere.net/");
        
    });

    /*
    test("Should handle fetch errors well", async () => {
        let svc = service as OARAuthenticationService;
        expect.assertions(3);
        try {
            const c = await svc.fetchCredentialsFrom("goob://example.com/fake").toPromise();
            throw new Error("Did not catch bad URL (cred: "+c+")");
        }
        catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain("goob");
            expect((error as Error).message).not.toContain("Error Code");
        }
    });
    */

    test("handleError: processing error", async () => {
        let svc = service as OARAuthenticationService;
        let err = new Error("test error");
        debugger;
        expect.assertions(1);
        try {
            await svc.handleFetchError(err).toPromise();
        }
        catch (e) {
            expect(e).toBe(err);
        }
    });

    test("handleError: HTTP error", async () => {
        let svc = service as OARAuthenticationService;
        let err = new HttpErrorResponse({status: 404, statusText: "Not Found"});
        expect.assertions(1);
        try {
            await svc.handleFetchError(err).toPromise();
        }
        catch (e) {
            expect(e).toBe(err);
        }
    });
});

describe("MockAuthenticationService", () => {
    let service: AuthenticationService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthenticationService, useClass: MockAuthenticationService }
            ]
        }).compileComponents();

        service = TestBed.inject(AuthenticationService);
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service instanceof MockAuthenticationService).toBeTruthy();
    });

    it('should fetch fake credentials', async () => {
        const credpromise = service.fetchCredentials(true).toPromise();

        const creds: Credentials = (await credpromise) as Credentials;
        expect(creds).toBeTruthy();
        expect(creds.userId).toEqual("anon");
        expect(creds.token).toEqual("fake jwt token");
    });
});

