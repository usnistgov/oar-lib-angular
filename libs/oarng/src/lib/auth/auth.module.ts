import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';

import { LibMockAuthService, LibWebAuthService } from './auth.service';

/**
 * a module providing components used to build a wizard interface.
 */
@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
    ],
    providers: [ LibMockAuthService, LibWebAuthService ],
    exports: [
    ]
})
export class LibAuthModule { }