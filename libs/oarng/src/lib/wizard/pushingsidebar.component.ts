import { Component, ChangeDetectorRef } from '@angular/core';
import { state, style, trigger, transition, animate } from '@angular/animations';

/**
 * A Panel that includes a sidebar that can be opened and closed.  When it is opened,
 * it pushes content out of the way (as opposed to covering over it).  
 */
@Component({
    selector: 'oar-pushing-sidebar',
    template: `
  <div class="oar-psidebar-panel-root">
    <div class="oar-psidebar-container" 
               [@togglesbar]="isSbarVisible() ? 'sbarvisible' : 'sbarhidden'">
      <div>
        <div style="float: right; margin: 0px 5px 5px 5px;">
          <a (click)="toggleSbarView()" aria-label="Close Help"
             title="Close Help"><i 
             class="faa faa-times-circle faa-lg" aria-hidden="true" 
             style="color: orange; cursor: pointer;"></i></a>
        </div>
        <div class="oar-psidebar-title">
          <ng-content select=".sidebar-title"></ng-content>
        </div>
      </div>
      <div class="oar-psidebar-frame">
        <p-scrollPanel [style]="{width: '100%', height: '90%'}" 
                       styleClass="oar-psidebar-content">
          <ng-content select=".sidebar-content"></ng-content>
        </p-scrollPanel>
      </div>
    </div>

    <div class="oar-psidebar-main"
         [@togglesbar]="isSbarVisible() ? 'mainsquished' : 'mainexpanded'">
      <div class="oar-psidebar-slider">
        <span style="line-height: 100%">
          <a (click)="toggleSbarView()" aria-label="Help" 
             title="{{(isSbarVisible()) ? 'Close Help' : 'Open Help'}}">
            <i class="faa faa-question-circle-o faa-lg" aria-hidden="true"
               style="color: orange; cursor: pointer;"></i>
          </a>
        </span>
      </div>
      <div class="oar-psidebar-main-content">
        <ng-content select=".main-content"></ng-content>
      </div>
    </div>

  </div>
`,
    styles: [`
.oar-psidebar-panel-root {
    width: 100%;
    position: relative;
    left: 0px;
    top: 0px;
    overflow: hidden;
}

.oar-psidebar-frame {
    padding: 10px 10px 10px 10px; 
    height: 100%;
}

.oar-psidebar-container {
    width: 35%;
    height: 100%;
    float: right;
    border: 3px solid orange; 
    border-radius: 10px;
    background-color:  #f7f7f7;
    padding-bottom: 5px;
    padding-top: 5px;
}

.oar-psidebar-show {
    position: absolute;
    right: 0%;
    top: 0px;
    bottom: 0px;
}

.oar-psidebar-hide {
    position: absolute;
    right: -20%;
    top: 0px;
    bottom: 0px;
}

.oar-psidebar-main {
    height: 100%;
    position: relative;
    left: 0px;
    top: 0px;
}

.oar-psidebar-main-content {
    padding: 15px 15px 15px 15px;
}

.oar-psidebar-main-expand {
    margin-right: 10%
}

.oar-psidebar-main-squish {
    margin-right: 35%
}

.oar-psidebar-slider {
    float: right;
    padding-top: 10px;
    padding-right: 10px;
    position: relative;
    right: 0px;
    top: 0px;
    bottom: 0px;
}

.oar-psidebar-container {
}

.oar-psidebar-title {
    font-size: larger;
    color: orange;
    padding-left: 10px;
}

.oar-psidebar-content .ui-scrollpanel-bar-x {
    height: 20px;
    visibility: visible;
}

.oar-psidebar-content .ui-scrollpanel-bar-y {
    width: 4px;
}
`],
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
