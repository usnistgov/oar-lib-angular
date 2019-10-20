import { ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SlideoutColumnComponent } from './slideoutcol.component';
import { AppCommonModule } from './app.common.module';

import * as mock from '../testing/mock.services';

fdescribe('SlideoutColumnComponent', () => {
    let component : SlideoutColumnComponent;
    let fixture : ComponentFixture<SlideoutColumnComponent>;

    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ AppCommonModule, BrowserAnimationsModule ],
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
