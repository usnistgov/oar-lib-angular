import { ComponentFixture, TestBed, waitForAsync  } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration, CONFIG_URL } from '../config/config.model';
import { AuthModule, OARAuthenticationService } from './auth.module';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
    let service: OARAuthenticationService;
    let httpMock: HttpTestingController;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule, AuthModule ],
            providers: [
                { provide: CONFIG_URL, useValue: environment.configUrl }
            ]
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);

        service = TestBed.inject(OARAuthenticationService);

        let req = httpMock.expectOne('assets/config.json');
        req.flush({
            AUTHAPI: "https://auth.nist/",
            REDIRECTAUTHAPI: "https://oar.app.nist/"
        });
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.endpoint).toEqual("https://auth.nist/");
    });

});
