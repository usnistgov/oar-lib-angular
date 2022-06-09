import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { DataModel } from '../models/data.model';

@Component({
    selector: 'app-contactinfo',
    templateUrl: './contactinfo.component.html',
    styleUrls: ['./contactinfo.component.css', '../startwiz.component.css']
})
export class ContactinfoComponent implements OnInit {
    parantFormGroup!: FormGroup;
    private _sbarvisible : boolean = true;

    @Input() dataModel!: DataModel;

    constructor(
        private rootFormGroup: FormGroupDirective, 
        private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.parantFormGroup = this.rootFormGroup.control.controls['contactInfo'] as FormGroup;
    }

    /**
     * cancel this wizard
     */
        cancel() {
        console.log("Canceling wizard input");
    }
    
    ngAfterViewInit() {
        this.cdr.detectChanges();
    }

    ngAfterContentInit() {
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
    }

    isSbarVisible() {
        return this._sbarvisible
    }

    toggleContactName(evt:any) {
        var target = evt.target;

        this.dataModel.creatorIsContact = (target.value==='true');
    }
}
