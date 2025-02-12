import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// us once the module is finished and oarng has been built
// import { RecordPermissionsModule } from 'oarng';

// use while testing and building demo app
import { RecordPermissionsModule } from 'libs/oarng/src/lib/record-permissions/record-permissions.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RecordPermissionsModule
],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
