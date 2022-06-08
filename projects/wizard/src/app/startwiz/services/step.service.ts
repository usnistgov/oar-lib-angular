import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StepModel } from '../models/step.model';

const STEPS = [
    new StepModel(1, "step1"),
    new StepModel(2, "step2"),
    new StepModel(3, "step3")
];

@Injectable({
    providedIn: 'root'
})
export class StepService {

    steps$: BehaviorSubject<StepModel[]> = new BehaviorSubject<StepModel[]>(STEPS);
    currentStep$: BehaviorSubject<StepModel> = new BehaviorSubject<StepModel>(STEPS[1]);

    constructor() { 
        this.currentStep$.next(this.steps$.value[0]);
    }

    setCurrentStep(step: StepModel): void {
        this.currentStep$.next(step);
    }

    getCurrentStep(): Observable<StepModel> {
        return this.currentStep$.asObservable();
    }

    getSteps(): Observable<StepModel[]> {
        return this.steps$.asObservable();
    }

    moveToNextStep(): void {
        const index = this.currentStep$.value.stepIndex;

        if (index < this.steps$.value.length) {
            this.currentStep$.next(this.steps$.value[index]);
        }
    }

    isLastStep(): boolean {
        return this.currentStep$.value.stepIndex === this.steps$.value.length;
    }
}
