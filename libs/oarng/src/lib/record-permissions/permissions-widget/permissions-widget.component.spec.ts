import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionsWidgetComponent } from './permissions-widget.component';

describe('PermissionsWidgetComponent', () => {
  let component: PermissionsWidgetComponent;
  let fixture: ComponentFixture<PermissionsWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PermissionsWidgetComponent]
    });
    fixture = TestBed.createComponent(PermissionsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
