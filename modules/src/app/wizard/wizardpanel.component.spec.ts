import { ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardPanelComponent } from './wizardpanel.component';
import { AppCommonModule } from './app.common.module';

import * as mock from '../testing/mock.services';

describe('WizardPanelComponent', () => {
    let component : WizardPanelComponent;
    let fixture : ComponentFixture<WizardPanelComponent>;

    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ AppCommonModule ],
            providers: [ ]
        }).compileComponents();

        fixture = TestBed.createComponent(WizardPanelComponent)
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('displays as a panel', () => {
        expect(component).toBeDefined();

        let cmpel = fixture.nativeElement;
        let el = cmpel.querySelector(".wizpan");
        expect(el).not.toBeNull();
        el = cmpel.querySelector(".wizpan-content");
        expect(el).toBeDefined();
        el = cmpel.querySelector(".wizpan-content p");
        expect(el).not.toBeNull();
        // expect(el.textContent).toBe("What am I doing?");

        el = cmpel.querySelector("p");
        expect(el).not.toBeNull();
        expect(el.textContent).toBe("What am I doing?");
    });
});

               
