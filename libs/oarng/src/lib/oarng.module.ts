import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardModule } from './wizard/wizard.module';
import { FrameModule } from './frame/frame.module';
import { LibAuthModule } from './auth/auth.module';
import { AppConfig, Config } from './auth/config-service.service';

/**
 * Initialize the configs for backend services
 */
const appInitializerFn = (appConfig: AppConfig) => {
    return () => {
      console.log("**** CAlling APP Initialization ***");
      return appConfig.loadAppConfig();
    };
};

@NgModule({
    declarations: [],
    imports: [
        WizardModule, CommonModule, FrameModule, LibAuthModule
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFn,
            multi: true,
            deps: [AppConfig]
        },
    ],
    exports: []
})
export class OARngModule { }
