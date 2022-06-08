import { Component, Input, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { StepModel } from "../models/step.model";
import { StepService } from '../services/step.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'wiz-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NavigatorComponent implements OnInit {
    totalSteps: number = 0;
    stepDistance: number = 0;
    // currentStep: StepModel = {} as StepModel;
    // steps: Observable<StepModel[]>;
    currentStep!: Observable<StepModel>;

    @Input() steps: StepModel[] = [];

    constructor(private stepService: StepService) { }

    ngOnInit(): void {
        this.updateNavigator();
        // this.steps = this.stepService.getSteps();
        this.currentStep = this.stepService.getCurrentStep();
    }

    ngOnChanges(changes: SimpleChanges): void {
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
        this.updateNavigator();
    }

    updateNavigator() {
        this.totalSteps = this.steps.length;
        this.stepDistance = Math.floor(window.innerWidth / (this.totalSteps + 1));

        for(let i = 0; i < this.steps.length; i++) {
            this.steps[i].position_x = this.stepDistance * (i + 1) + "px";
        }
    }

    onStepClick(step: StepModel) {
        this.stepService.setCurrentStep(step);
    }
}
