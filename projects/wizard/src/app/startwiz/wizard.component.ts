import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { StepModel } from "./models/step.model";
import { DataModel } from './models/data.model';
import { StepService } from './services/step.service';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, Validators, FormBuilder, FormGroupDirective} from '@angular/forms';

@Component({
    selector: 'app-wizard',
    templateUrl: './wizard.component.html',
    styleUrls: ['./wizard.component.scss'],
    providers: [FormGroupDirective],
    host: {
        '(window:resize)': 'onResize($event)'
    }
})
export class WizardComponent implements OnInit {
    steps: StepModel[] = [];
    currentStep: StepModel = {} as StepModel;
    dataModel: DataModel = {} as DataModel;
    currentStepSub!: Subscription;
    onSoftware: boolean = false;
    bodyHeight: number = 550;

    fgSteps!: FormGroup;

    constructor(
        private stepService: StepService,
        private fb: FormBuilder, 
        private cdr: ChangeDetectorRef
    ) { 
        this.fgSteps = fb.group({
            'pubtype': fb.group({
                resourceType: [""]
            }),
            'softwareInfo': fb.group({
                provideLink: [false],
                softwareLink: [""]
            }),
            'contactInfo': fb.group({
                creatorIsContact: [true],
                contactName: [""]
            }),
            'files': fb.group({
                willUpload: [true]
            }),
            'assocPapers': fb.group({
                assocPageType: [""]
            })
        });

        // let that = this;
        // this.fgPubtype.get("resourceType")?.valueChanges.subscribe({
        //     next(x) { 
        //         if (x) console.log("resourceType: "+x); 

        //         that.onSoftware = (x == "software");

        //     }
        // });
    }

    ngOnInit(): void {
        this.steps = [
            new StepModel(1, 'Publication Type'),
            new StepModel(2, 'Contact Info'),
            new StepModel(3, 'Files'),
            new StepModel(4, 'Optional'),
            new StepModel(5, 'Associated Papers')
        ]

        this.stepService.setSteps(this.steps);
        
        this.currentStepSub = this.stepService.getCurrentStep().subscribe((step: StepModel) => {
            this.currentStep = step;
        });

        this.bodyHeight = window.innerHeight - 150;
    }

    ngAfterViewInit() {
        this.cdr.detectChanges();
    }

    onNextStep() {
        if (!this.stepService.isLastStep()) {
            this.stepService.moveToNextStep();
        } else {
            this.onSubmit();
        }
    }

    get isFirstStep() {
        return this.stepService.isFirstStep();
    }

    onPrevStep() {
        if (!this.isFirstStep) {
            this.stepService.moveToPrevStep();
        } else {
            this.onSubmit();
        }
    }

    showButtonLabel() {
        // return "continue";
        return !this.stepService.isLastStep() ? 'Next' : 'Finish';
    }

    ngOnDestroy(): void {
        // Unsubscribe to avoid memory leaks and unexpected angular errors
        this.currentStepSub.unsubscribe();
    }

    onSubmit(): void {
        // this.router.navigate(['/complete']);
    }

    onResize(event: any){
        // console.log(window.innerHeight)
        this.bodyHeight = window.innerHeight - 150;
    }
}
