import { NgModule, APP_INITIALIZER }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { AuthenticationService, OARAuthenticationService } from './auth.service';
import { ConfigModule } from '../config/config.module';

/**
 * a module providing components used to build a wizard interface.
 */
@NgModule({
    imports: [
        CommonModule, ConfigModule
    ],
    declarations: [
    ],
    providers: [
        OARAuthenticationService
    ],
    exports: [
    ]
})
export class AuthModule { }

export { AuthenticationService, OARAuthenticationService }
