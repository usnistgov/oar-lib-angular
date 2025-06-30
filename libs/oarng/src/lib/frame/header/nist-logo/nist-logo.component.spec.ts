import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NistLogoComponent } from './nist-logo.component';

describe('NistLogoComponent', () => {
  let component: NistLogoComponent;
  let fixture: ComponentFixture<NistLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NistLogoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NistLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
