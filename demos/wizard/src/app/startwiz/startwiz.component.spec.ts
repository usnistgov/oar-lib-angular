import { Component, ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StartWizardComponent } from './startwiz.component';
import { StartWizModule } from './startwiz.module';

fdescribe('StartWizardComponent', () => {
    let component : StartWizardComponent;
    let fixture : ComponentFixture<StartWizardComponent>;

    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ StartWizModule, BrowserAnimationsModule ],
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
