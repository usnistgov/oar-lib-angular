import { Component } from '@angular/core';

/**
 * A Component presents one step in a wizard.
 *
 * Features:
 *  * a subpanel for inputs 
 *  * a dynamic help panel on the right.  The content can be triggered to 
 *    change depending on the focus in the inputs panel.
 *
 * This component does not handle wizard navigation; it only handles the 
 * display of one step of the wizard workflow. 
 */
@Component({
    selector: 'oar-wizard-panel',
    templateUrl: 'wizardpanel.component.html',
    styleUrls: [ 'wizardpanel.component.html' ],
    providers: [ ]
})
export class WizardPanelComponent {
    _opened : boolean = false;
    toggleSidebar() : void {
        this._opened = !this._opened;
    }
}
