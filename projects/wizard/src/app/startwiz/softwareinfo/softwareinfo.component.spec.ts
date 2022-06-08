import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareinfoComponent } from './softwareinfo.component';

describe('SoftwareinfoComponent', () => {
  let component: SoftwareinfoComponent;
  let fixture: ComponentFixture<SoftwareinfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoftwareinfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoftwareinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
