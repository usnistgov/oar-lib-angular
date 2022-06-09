import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';

@Component({
  selector: 'app-associated-papers',
  templateUrl: './associated-papers.component.html',
  styleUrls: ['./associated-papers.component.css', '../startwiz.component.css']
})
export class AssociatedPapersComponent implements OnInit {
    parantFormGroup!: FormGroup;
    private _sbarvisible : boolean = true;

    constructor(private rootFormGroup: FormGroupDirective, private chref: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.parantFormGroup = this.rootFormGroup.control.controls['assocPapers'] as FormGroup;
    }

    ngAfterContentInit() {
        this.chref.detectChanges();
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
