import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component'

/**
 * a module providing components used to build a wizard interface.
 */
@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        HeaderComponent,
        FooterComponent
    ],
    providers: [ ],
    exports: [
        HeaderComponent,
        FooterComponent
    ]
})
export class FrameModule { }

