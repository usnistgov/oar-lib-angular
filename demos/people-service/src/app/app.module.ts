import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';

import { FrameModule } from 'oarng';
import { StaffDirModule } from 'oarng';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SelectPersonComponent } from './selectperson.component';
import { SelectOrgComponent } from './selectorg.component';

@NgModule({
    declarations: [
        AppComponent,
        SelectPersonComponent,
        SelectOrgComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        FrameModule,
        AutoCompleteModule,
        ButtonModule,
        StaffDirModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
