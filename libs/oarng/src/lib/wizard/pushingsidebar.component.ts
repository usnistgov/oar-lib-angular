import { Component, ChangeDetectorRef } from '@angular/core';
import { state, style, trigger, transition, animate } from '@angular/animations';

/**
 * A Panel that includes a sidebar that can be opened and closed.  When it is opened,
 * it pushes content out of the way (as opposed to covering over it).  
 */
@Component({
    selector: 'oar-pushing-sidebar',
    templateUrl: 'pushingsidebar.component.html',
    styleUrls: ['pushingsidebar.component.css'],
    animations: [
        trigger("togglesbar", [
            state('sbarvisible', style({
                position: 'absolute',
                right: '0%',
                top: "0%",
                bottom: "100%"
            })),
            state('sbarhidden', style({
                position: 'absolute',
                right: '-35%',
                top: "0%",
                bottom: "100%"
            })),
            transition('sbarvisible <=> sbarhidden', [
                animate('0.1s')
            ]),
            state('mainsquished', style({
                "margin-right": "35%"
            })),
            state('mainexpanded', style({
                "margin-right": "0%"
            })),
            transition('mainsquished <=> mainexpanded', [
                animate('0.1s')
            ])
        ])
    ]
})
export class PushingSidebarComponent {
    private _sbarvisible : boolean = true;

    constructor(private chref: ChangeDetectorRef) { }

    /**
     * toggle whether the sidebar is visible.  When this is called, a change in 
     * in the visiblity of the sidebar will be animated (either opened or closed).
     */
    toggleSbarView() {
        this._sbarvisible = ! this._sbarvisible;
        console.log("toggling view: " + this._sbarvisible);
        this.chref.detectChanges();
    }

    isSbarVisible() {
        return this._sbarvisible
    }
}
