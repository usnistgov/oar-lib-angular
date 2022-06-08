import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WizardComponent } from './startwiz/wizard.component';

const routes: Routes = [
    { path: '', component: WizardComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'corrected' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
