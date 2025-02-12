import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PermissionsWidgetComponent } from './permissions-widget/permissions-widget.component';

@NgModule({
  
  imports: [
    CommonModule
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
