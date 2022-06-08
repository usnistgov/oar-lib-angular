import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociatedPapersComponent } from './associated-papers.component';

describe('AssociatedPapersComponent', () => {
  let component: AssociatedPapersComponent;
  let fixture: ComponentFixture<AssociatedPapersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssociatedPapersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociatedPapersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
