import { NgModule } from '@angular/core';
import { WizardModule } from './wizard/wizard.module';
import { HeaderComponent } from './frame/header/header.component';
import { FooterComponent } from './frame/footer/footer.component';

@NgModule({
    imports: [
        WizardModule,
        HeaderComponent,
        FooterComponent
    ],
    exports: [
        HeaderComponent,
        FooterComponent
    ]
})
export class OARngModule { }
