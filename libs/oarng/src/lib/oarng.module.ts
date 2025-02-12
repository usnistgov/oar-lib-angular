import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardModule } from './wizard/wizard.module';
import { FrameModule } from './frame/frame.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { RecordPermissionsModule } from './record-permissions/record-permissions.module';

@NgModule({
    declarations: [
    
  ],
    imports: [
        WizardModule, CommonModule, FrameModule, ConfigModule, AuthModule, RecordPermissionsModule
    ],
    providers: [
    ],
    exports: []
})
export class OARngModule { }
