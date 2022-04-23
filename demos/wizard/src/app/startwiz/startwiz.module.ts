import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { ArchwizardModule } from 'angular-archwizard';

import { StartWizardComponent } from './startwiz.component';
import { WizardModule } from 'oar-modules/wizard/wizard.module';

@NgModule({
    imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        ArchwizardModule,
        WizardModule
    ],
    declarations: [
        StartWizardComponent
    ],
    exports: [
        StartWizardComponent
    ]
})
export class StartWizModule { }
