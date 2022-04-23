import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

/**
 * a wizard for starting the publication record.
 */
@Component({
    selector: 'pdr-start-wiz',
    templateUrl: 'startwiz.component.html',
    styleUrls: [ 'startwiz.component.css' ]
})
export class StartWizardComponent {

    modelctl = new FormGroup({
        resourceType: new FormControl(''),
        paperState: new FormControl('')
    });

    constructor() {
        this.modelctl.get("resourceType")?.valueChanges.subscribe({
            next(x) { if (x) console.log("resourceType: "+x); }
        });
    }

    /**
     * cancel this wizard
     */
    cancel() {
        console.log("Canceling wizard input");
    }

    /**
     * close out the collection of information and dispatch it as necessary
     */
    finish() {
        console.log("Done!");
    }
}
