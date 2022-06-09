import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardModule } from './wizard/wizard.module';
import { HeaderComponent } from './frame/header/header.component';
import { FooterComponent } from './frame/footer/footer.component'

@NgModule({
    declarations: [HeaderComponent, FooterComponent],
    imports: [
        WizardModule,CommonModule
    ],
    exports: [HeaderComponent, FooterComponent]
})
export class OARngModule { }
