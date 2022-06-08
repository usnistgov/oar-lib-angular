import { Component, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { WizardComponent } from 'angular-archwizard';
import { NavigationMode } from 'angular-archwizard'
import { DataModel } from './models/data.model';

/**
 * a wizard for starting the publication record.
 */
@Component({
    selector: 'oar-start-wiz',
    templateUrl: 'startwiz.component.html',
    styleUrls: [ 'startwiz.component.css' ],
    encapsulation: ViewEncapsulation.None,
    host: {
        '(window:resize)': 'onResize($event)'
    }
})
export class StartWizardComponent {
    fgPubtype!: FormGroup;
    fgContactInfo!: FormGroup;
    fgSoftwareInfo!: FormGroup;
    fgFiles!: FormGroup;
    fgAssocPapers: FormGroup;
    bodyHeight: number = 550;

    onSoftware: boolean = false;

    dataModel: DataModel = {} as DataModel;

    constructor(private fb: FormBuilder, private changeDetectorRef: ChangeDetectorRef) {
        this.fgPubtype = this.fb.group({
            resourceType: [""]
        });

        this.fgSoftwareInfo = this.fb.group({
            provideLink: [false],
            softwareLink: [""]
        });

        this.fgContactInfo = this.fb.group({
            creatorIsContact: [true],
            contactName: [""]
        });

        this.fgFiles = this.fb.group({
            willUpload: [true]
        });

        this.fgAssocPapers = this.fb.group({
            assocPageType: [""]
        });

        let that = this;
        this.fgPubtype.get("resourceType")?.valueChanges.subscribe({
            next(x) { 
                if (x) console.log("resourceType: "+x); 

                that.onSoftware = (x == "software");

            }
        });
    }

    ngOnInit(): void {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        this.bodyHeight = window.innerHeight - 150;
    }

    /**
     * Add this line to fix runtime error: ExpressionChangedAfterItHasBeenCheckedError with child component
     */
    ngAfterViewChecked(): void {
        this.changeDetectorRef.detectChanges();
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

    onResize(event: any){
        // console.log(window.innerHeight)
        this.bodyHeight = window.innerHeight - 150;
        console.log('this.bodyHeight', this.bodyHeight)
    }

    save(step: number) {
        console.log("Step", step);
        console.log("dataModel", this.dataModel)
    }
}
