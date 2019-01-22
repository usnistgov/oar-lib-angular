import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollapseDirective } from './collapse.directive';

/**
 * a module of re-usable directives and components that can be used repeatedly across the 
 * the app.
 */
@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        CollapseDirective
    ],
    providers: [ ],
    exports: [
        CollapseDirective
    ]
})
export class AppCommonModule { }

