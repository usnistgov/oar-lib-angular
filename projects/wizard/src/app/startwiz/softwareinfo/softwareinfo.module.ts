import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoftwareinfoComponent } from './softwareinfo.component';
import { WizardModule } from 'oarng';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from "primeng/inputtext";

@NgModule({
  declarations: [SoftwareinfoComponent],
  imports: [
    CommonModule, WizardModule, FormsModule, ReactiveFormsModule, InputTextModule
  ],
  exports: [SoftwareinfoComponent]
})
export class SoftwareinfoModule { }
