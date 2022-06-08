export class StepModel {
    stepIndex: number;
    title: string;
    active: boolean;
    canEnter: boolean;
    canExit: boolean;
    touched: boolean;
    nextStepId: number;
    prevStepId: number;
    position_x: string;
    position_y: string;
    isComplete: boolean;

    constructor(
        stepIndex: number, 
        title: string, 
        active: boolean = true, 
        canEnter: boolean = true,
        canExit: boolean = true,
        nextStepId: number = 0,
        prevStepId: number = 0,
        touched: boolean = false,
        position_x: string = '0px',
        position_y: string = '80px',
        isComplete: boolean = false
    ) {
        this.stepIndex = stepIndex;
        this.title = title;
        this.active = active;
        this.canEnter = canEnter;
        this.canExit = canExit;
        this.nextStepId = nextStepId;
        this.prevStepId = prevStepId;
        this.touched = touched;
        this.position_x = position_x;
        this.position_y = position_y;
        this.isComplete = isComplete;
    }
}