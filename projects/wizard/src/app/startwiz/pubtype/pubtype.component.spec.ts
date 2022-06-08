import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubtypeComponent } from './pubtype.component';

describe('PubtypeComponent', () => {
  let component: PubtypeComponent;
  let fixture: ComponentFixture<PubtypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PubtypeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PubtypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
