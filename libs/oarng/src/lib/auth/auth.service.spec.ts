import { ComponentFixture, TestBed, waitForAsync  } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration, CONFIG_URL } from '../config/config.model';
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
                serviceEndpoint: "https://auth.nist/",
                redirectURL: "https://oar.app.nist/"
            }
        });
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service instanceof OARAuthenticationService).toBeTruthy();
        let svc = service as OARAuthenticationService;
        expect(svc.endpoint).toEqual("https://auth.nist/");
        expect(svc.redirectURL).toEqual("https://oar.app.nist/");
    });

});
