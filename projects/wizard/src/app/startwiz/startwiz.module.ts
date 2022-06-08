import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ArchwizardModule } from 'angular-archwizard';

import { StartWizardComponent } from './startwiz.component';
// import { OARngModule } from 'oarng/lib/oarng.module';
import { WizardModule } from 'oarng';
import { PubtypeModule } from './pubtype/pubtype.module';
import { ContactinfoModule } from './contactinfo/contactinfo.module';
import { SoftwareinfoModule } from './softwareinfo/softwareinfo.module';
import { FilesComponent } from './files/files.component';
import { AssociatedPapersComponent } from './associated-papers/associated-papers.component';
import { WizardComponent } from './wizard.component';
import { NavigatorModule } from './navigator/navigator.module';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        ArchwizardModule,
        WizardModule,
        PubtypeModule,
        ContactinfoModule,
        SoftwareinfoModule,
        NavigatorModule,
        RouterModule
    ],
    declarations: [
        StartWizardComponent,
        FilesComponent,
        AssociatedPapersComponent,
        WizardComponent
    ],
    exports: [
        StartWizardComponent
    ]
})
export class StartWizModule { }
