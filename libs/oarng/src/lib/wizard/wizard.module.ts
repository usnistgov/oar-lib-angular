import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarModule } from 'ng-sidebar';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { WizardPanelComponent } from './wizardpanel.component';
import { PushingSidebarComponent } from './pushingsidebar.component';
import { SlideoutColumnComponent } from './slideoutcol.component';

/**
 * a module providing components used to build a wizard interface.
 */
@NgModule({
    imports: [
        CommonModule,
        ScrollPanelModule,
        SidebarModule.forRoot()
    ],
    declarations: [
        WizardPanelComponent,
        PushingSidebarComponent,
        SlideoutColumnComponent
    ],
    providers: [ ],
    exports: [
        WizardPanelComponent,
        PushingSidebarComponent,
        SlideoutColumnComponent
    ]
})
export class WizardModule { }

