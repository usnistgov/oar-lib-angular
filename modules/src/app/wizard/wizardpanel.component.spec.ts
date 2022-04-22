import { ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardPanelComponent } from './wizardpanel.component';
import { WizardModule } from './wizard.module';

describe('WizardPanelComponent', () => {
    let component : WizardPanelComponent;
    let fixture : ComponentFixture<WizardPanelComponent>;

    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ WizardModule ],
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
        expect(el.textContent).toBe("Content");

        el = cmpel.querySelector("button")
        expect(el).not.toBeNull();
        expect(el.textContent).toBe("What am I doing?");
    });
});

               
