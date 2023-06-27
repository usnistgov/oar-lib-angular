import { ComponentFixture, TestBed, waitForAsync  } from '@angular/core/testing';
import { LibAuthService } from './auth.service';

describe('AuthService', () => {
    let service: LibAuthService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ ],
            providers: [
                LibAuthService
            ]
        }).compileComponents();

        service = TestBed.inject(LibAuthService);
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
