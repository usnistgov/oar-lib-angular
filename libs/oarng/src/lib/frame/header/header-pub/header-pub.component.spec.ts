import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPubComponent } from './header-pub.component';

describe('HeaderPubComponent', () => {
  let component: HeaderPubComponent;
  let fixture: ComponentFixture<HeaderPubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderPubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
