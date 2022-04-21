import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarModule } from 'ng-sidebar';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { CollapseDirective } from './collapse.directive';
import { WizardPanelComponent } from './wizardpanel.component';
import { PushingSidebarComponent } from './pushingsidebar.component';
import { SlideoutColumnComponent } from './slideoutcol.component';

/**
 * a module of re-usable directives and components that can be used repeatedly across the 
 * the app.
 */
@NgModule({
    imports: [
        CommonModule,
        ScrollPanelModule,
        SidebarModule.forRoot()
    ],
    declarations: [
        CollapseDirective,
        WizardPanelComponent,
        PushingSidebarComponent,
        SlideoutColumnComponent
    ],
    providers: [ ],
    exports: [
        CollapseDirective,
        WizardPanelComponent,
        PushingSidebarComponent,
        SlideoutColumnComponent
    ]
})
export class AppCommonModule { }

