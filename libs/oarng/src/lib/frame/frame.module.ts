import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPubComponent } from './header/header-pub/header-pub.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component'

/**
 * a module providing components used to build a wizard interface.
 */
@NgModule({
    imports: [
        CommonModule,
        HeaderPubComponent,
        HeaderComponent,
        FooterComponent
    ],
    declarations: [
    ],
    providers: [ ],
    exports: [
    ]
})
export class FrameModule { }

