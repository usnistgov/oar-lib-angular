import { Component, ChangeDetectorRef } from '@angular/core';
import { state, style, trigger, transition, animate } from '@angular/animations';

/**
 * A Panel that includes a sidebar that can be opened and closed.  When it is opened,
 * it pushes content out of the way (as opposed to covering over it).  
 */
@Component({
    selector: 'oar-slideout-col',
    template: `
<div class="p-grid oar-so-panel-root">
   <div class="p-col oar-so-main">
        Main Content.
        The request has been fulfilled and resulted in a new resource being created. The newly created resource can be referenced by the URI(s) returned in the entity of the response, with the most specific URI for the resource given by a Location header field. The response SHOULD include an entity containing a list of resource characteristics and location(s) from which the user or user agent can choose the one most appropriate. The entity format is specified by the media type given in the Content-Type header field. The origin server MUST create the resource before returning the 201 status code. If the action cannot be carried out immediately, the server SHOULD respond with 202 (Accepted) response instead.

A 201 response MAY contain an ETag response header field indicating the current value of the entity tag for the requested variant just created, see section 14.19.
   </div>
   <div class="p-col oar-so-slider">
     <a href="#" (click)="toggleHelpView()" >&lt;&lt;</a>
   </div>
   <div *ngIf="isHelpVisible()" class="p-col oar-so-content">
      Sidebar Content
   </div>
</div>
`,
    styles: [`
.oar-so-panel-root {
    width: 100%;
    border: 1px solid yellow;
    overflow-x: hidden;
}

.oar-so-content {
    width: 30%;
    height: 200px;
    background-color: white;
    border: 1px solid black;
}

.oar-so-main {
    border: 1px solid black;
}

.oar-so-slider {
    float: right;
    height: 50px;
    width: 5%;
    vertical-align: middle;
    top: 0px;
    bottom: 0px;
}
`],
    animations: [
    ]})
export class SlideoutColumnComponent {
    private _helpvisible : boolean = false;
    
    constructor(private chref: ChangeDetectorRef) { }
    
    toggleHelpView() {
        this._helpvisible = ! this._helpvisible;
        console.log("toggling view: " + this._helpvisible);
        this.chref.detectChanges();
    }

    isHelpVisible() {
        return this._helpvisible;
    }
}
