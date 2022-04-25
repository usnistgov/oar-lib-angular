import { Component, ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PushingSidebarComponent } from './pushingsidebar.component';
import { WizardModule } from './wizard.module';

@Component({
    selector: 'test-cmp',
    template:`
  <h3>Wizard Panel</h3>
  <pdr-pushing-sidebar>
    <div class="main-content">
      <p>Main Content.</p>
      <p>The request has been fulfilled and resulted in a new resource being created. The newly created resource can be referenced by the URI(s) returned in the entity of the response, with the most specific URI for the resource given by a Location header field. The response SHOULD include an entity containing a list of resource characteristics and location(s) from which the user or user agent can choose the one most appropriate. The entity format is specified by the media type given in the Content-Type header field. The origin server MUST create the resource before returning the 201 status code. If the action cannot be carried out immediately, the server SHOULD respond with 202 (Accepted) response instead.</p>

      <p>A 201 response MAY contain an ETag response header field indicating the current value of the entity tag for the requested variant just created, see section 14.19.</p>
    </div>

    <div class="sidebar-content">
      <p>Help Content</p>
      <p>We should try to make this as <i>helpful</i> as possible.</p>
    </div>
  </pdr-pushing-sidebar>
`
})
class TestComponent { }

describe('PushingSidebarComponent', () => {
    let component : TestComponent;
    let fixture : ComponentFixture<TestComponent>;

    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ WizardModule, BrowserAnimationsModule ],
            declarations: [ TestComponent ],
            providers: [ ]
        }).compileComponents();

        fixture = TestBed.createComponent(TestComponent)
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('displays as a panel', () => {
        expect(component).toBeDefined();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h3')?.textContent).toBe('Wizard Panel');
    });
});

