import { ComponentFixture, TestBed, waitForAsync  } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration, CONFIG_URL } from '../config/config.model';
import { ConfigurationService } from '../config/config.service';
import { AuthModule, AuthenticationService, OARAuthenticationService } from './auth.module';
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

});
