import { ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SlideoutColumnComponent } from './slideoutcol.component';
import { WizardModule } from './wizard.module';

describe('SlideoutColumnComponent', () => {
    let component : SlideoutColumnComponent;
    let fixture : ComponentFixture<SlideoutColumnComponent>;

    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ WizardModule, BrowserAnimationsModule ],
            providers: [ ]
        }).compileComponents();

        fixture = TestBed.createComponent(SlideoutColumnComponent)
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('displays as a panel', () => {
        expect(component).toBeDefined();

    });
});
