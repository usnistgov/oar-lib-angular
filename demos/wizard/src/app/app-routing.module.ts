import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StartWizardComponent } from './startwiz/startwiz.component';

const routes: Routes = [
    { path: '', component: StartWizardComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'corrected' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
