import { NgModule, APP_INITIALIZER }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { LibMockAuthService, LibWebAuthService, createAuthService } from './auth.service';
import { AppConfig, Config } from './config-service.service';

/**
 * a module providing components used to build a wizard interface.
 */
@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
    ],
    providers: [ 
        { provide: LibWebAuthService, useFactory: createAuthService, deps: [ AppConfig, HttpClient ] }
    ],
    exports: [
    ]
})
export class LibAuthModule { }