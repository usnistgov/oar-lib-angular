import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardModule } from 'oarng';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContactinfoComponent } from './contactinfo.component';
import { InputTextModule } from "primeng/inputtext";

@NgModule({
  declarations: [ContactinfoComponent],
  imports: [
    CommonModule, WizardModule, FormsModule, ReactiveFormsModule, InputTextModule
  ],
  exports: [ContactinfoComponent]
})
export class ContactinfoModule { }
