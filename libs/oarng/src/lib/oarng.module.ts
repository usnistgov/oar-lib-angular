import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardModule } from './wizard/wizard.module';
import { FrameModule } from './frame/frame.module';

@NgModule({
    declarations: [],
    imports: [
        WizardModule,CommonModule,FrameModule
    ],
    exports: []
})
export class OARngModule { }
