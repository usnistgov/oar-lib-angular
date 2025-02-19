import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { MatAutocompleteModule}  from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';

import { PermissionsWidgetComponent } from './permissions-widget/permissions-widget.component';

@NgModule({
  
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    
    MatAutocompleteModule,
    MatFormFieldModule
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
