import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { DataModel } from '../models/data.model';

@Component({
    selector: 'app-pubtype',
    templateUrl: './pubtype.component.html',
    styleUrls: ['./pubtype.component.css', '../startwiz.component.css']
})
export class PubtypeComponent implements OnInit {
    parantFormGroup!: FormGroup;
    private _sbarvisible : boolean = true;

    @Input() dataModel!: DataModel;

    constructor(
        private rootFormGroup: FormGroupDirective, 
        private chref: ChangeDetectorRef) { 
        
    }

    ngOnInit(): void {
        this.parantFormGroup = this.rootFormGroup.control.controls['pubtype'] as FormGroup;
        // console.log('this.parantFormGroup', this.parantFormGroup.controls['pubtype'])
        this.parantFormGroup.valueChanges.subscribe(selectedValue  => {
            // console.log('form value changed')
            // console.log(selectedValue)
        })
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

    toggleSbarView() {
        this._sbarvisible = ! this._sbarvisible;
        console.log("toggling view: " + this._sbarvisible);
        this.chref.detectChanges();
    }

    isSbarVisible() {
        return this._sbarvisible
    }

}
