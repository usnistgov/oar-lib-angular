import { Component, ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StartWizardComponent } from './startwiz.component';
import { CreateModule } from './create.module';

import * as mock from '../testing/mock.services';

fdescribe('StartWizardComponent', () => {
    let component : StartWizardComponent;
    let fixture : ComponentFixture<StartWizardComponent>;

    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ CreateModule, BrowserAnimationsModule ],
            declarations: [ ],
            providers: [ ]
        }).compileComponents();

        fixture = TestBed.createComponent(StartWizardComponent)
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('displays as a panel', () => {
        expect(component).toBeDefined();

    });
});
