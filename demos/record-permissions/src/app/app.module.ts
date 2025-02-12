import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FrameModule } from 'oarng';
import { RecordPermissionsModule } from 'libs/oarng/src/lib/record-permissions/record-permissions.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FrameModule,
    RecordPermissionsModule
],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
