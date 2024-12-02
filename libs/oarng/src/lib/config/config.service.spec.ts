import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { APP_INITIALIZER } from '@angular/core';

import { ConfigurationService } from './config.service';
import { Configuration, CONFIG_URL } from './config.model';
import { ConfigModule } from "./config.module";

import { environment } from '../../environments/environment';

describe('ConfigurationService', () => {
    let service: ConfigurationService;
    let httpMock: HttpTestingController;
    // Mock configuration object
    const mockConfig: Configuration = {
        PDRDMP: 'https://oardev.nist.gov/od/ds/rpa',
        daptool: {
            editEnabled: true
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: CONFIG_URL, useValue: environment.configUrl },
                ConfigurationService
            ],
        });

        service = TestBed.inject(ConfigurationService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        // After every test, assert that there are no more pending requests.
        // This throws an error if there are any requests that haven't been flushed yet.
        httpMock.verify();
    });

    it('should fetch configuration v2 (with promise)', async () => {
        // Create a promise. This will pause the test until the promise is resolved using await.
        const configPromise = service.fetchConfig().toPromise();
        // By the time the HTTP request is expected, the configPromise has already been created.
        const req = httpMock.expectOne('assets/config.json');
        
        expect(req.request.method).toBe('GET');
        // Set the HTTP response
        req.flush(mockConfig);

        // Wait for fetchConfig() to finish, which will hang on HttpClient.get() to finish
        const config = await configPromise;

        // Assert
        expect(config).toEqual(mockConfig);
        // Additional check using config getter
        expect(service.getConfig()).toEqual(mockConfig);
    });


    // getConfig() returns a default configuration object when config is null.
    it('should return default configuration when config is null', () => {
        service.config = null;
        expect(service.getConfig()).toEqual({ });
    });

    it('should return configuration object', () => {
        service.config = mockConfig;
        const actualConfig: Configuration = service.getConfig();
        expect(actualConfig).toBeDefined();
        expect(actualConfig['PDRDMP']).toEqual(mockConfig['PDRDMP']);
    });

    it('should return configuration parameter', () => {
        service.config = mockConfig;
        expect(service.get('PDRDMP', 'unconfigured')).toEqual(mockConfig['PDRDMP']);
        expect(service.get('daptool', 'unconfigured')).toEqual(mockConfig['daptool']);
        expect(service.get('daptool.editEnabled')).toBe(true);
        expect(service.get('daptool.endpoint', 'unconfigured')).toBe('unconfigured');
    });

})


describe('ConfgirationService via ConfigModule', () => {
    let svc: ConfigurationService;
    let initToken: any;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, ConfigModule],
            providers: [
                { provide: CONFIG_URL, useValue: environment.configUrl }
            ]
        });

        svc = TestBed.inject(ConfigurationService);
        httpMock = TestBed.inject(HttpTestingController);

        let req = httpMock.expectOne('assets/config.json');
        req.flush({
            PDRDMP: "http://localhost:4202/",
            recaptchaApiKey: "X"
        });

        initToken = TestBed.inject(APP_INITIALIZER);
        // await initToken;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('fetches config data', () => {
        let config: Configuration = svc.getConfig();
        expect(config['PDRDMP']).toBe("http://localhost:4202/");
    });

});
