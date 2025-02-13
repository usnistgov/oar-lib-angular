import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatAutocompleteModule}  from '@angular/material/autocomplete';

import { PermissionsWidgetComponent } from './permissions-widget/permissions-widget.component';

@NgModule({
  
  imports: [
    CommonModule,
    MatAutocompleteModule
  ],
  declarations: [
    PermissionsWidgetComponent
  ],
  providers:[],
  exports:[
    PermissionsWidgetComponent
  ]
})
export class RecordPermissionsModule { }
