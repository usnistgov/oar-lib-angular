import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PubtypeComponent } from './pubtype.component';
import { WizardModule } from 'oarng';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [PubtypeComponent],
  imports: [
    CommonModule, WizardModule, FormsModule, ReactiveFormsModule
  ],
  exports: [ PubtypeComponent ]
})
export class PubtypeModule { }
