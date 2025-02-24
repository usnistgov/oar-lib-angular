import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// us once the module is finished and oarng has been built
// import { RecordPermissionsModule } from 'oarng';

// use while testing and building demo app
import { RecordPermissionsModule } from 'libs/oarng/src/lib/record-permissions/record-permissions.module';
import { StaffDirModule } from 'libs/oarng/src/public-api';
import { ConfigModule } from 'libs/oarng/src/public-api';
import { AuthenticationService } from 'libs/oarng/src/public-api';
import { MockAuthenticationService } from 'libs/oarng/src/public-api';




@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    RecordPermissionsModule,
    HttpClientModule,
    ConfigModule,
    StaffDirModule
  ],
  providers: [
    // remove line below to switch to OARAuthenticationService for normal operation
    { provide: AuthenticationService, useClass: MockAuthenticationService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
