import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StartWizModule } from './startwiz/startwiz.module';
import { WizardModule } from 'oarng';
import { OARngModule } from 'oarng';
import { InputTextModule } from "primeng/inputtext";

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        StartWizModule,
        AppRoutingModule,
        WizardModule,
        InputTextModule,
        OARngModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
