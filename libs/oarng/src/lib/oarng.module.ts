import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardModule } from './wizard/wizard.module';
import { FrameModule } from './frame/frame.module';
import { LibAuthModule } from './auth/auth.module';

@NgModule({
    declarations: [],
    imports: [
        WizardModule, CommonModule, FrameModule, LibAuthModule
    ],
    exports: []
})
export class OARngModule { }
