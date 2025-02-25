import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { MatAutocompleteModule }  from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';

import { PermissionsWidgetComponent } from './permissions-widget/permissions-widget.component';


@NgModule({
  
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    
    MatAutocompleteModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatTableModule,
    MatInputModule
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
