import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PushingSidebarComponent } from './pushingsidebar.component';
import { SlideoutColumnComponent } from './slideoutcol.component';

/**
 * a module providing components used to build a wizard interface.
 */
@NgModule({
    imports: [
        CommonModule,
        ScrollPanelModule
    ],
    declarations: [
        PushingSidebarComponent,
        SlideoutColumnComponent
    ],
    providers: [ ],
    exports: [
        PushingSidebarComponent,
        SlideoutColumnComponent
    ]
})
export class WizardModule { }

