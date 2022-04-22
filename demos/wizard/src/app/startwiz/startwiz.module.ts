import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { ArchwizardModule } from 'angular-archwizard';

import { StartWizardComponent } from './startwiz.component';
import { AppCommonModule } from '../common/app.common.module';

@NgModule({
    imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        ArchwizardModule,
        AppCommonModule
    ],
    declarations: [
        StartWizardComponent
    ],
    exports: [
        StartWizardComponent
    ]
})
export class CreateModule { }
