import { Component, ElementRef, ViewChild } from '@angular/core';
// import * as footerlinks from '../assets/site-constants/footer-links.json';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    host: {
        '(window:resize)': 'onResize($event)'
    }
})
export class AppComponent {
    constructor() { 
    }

    ngOnInit(): void {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        
    }

    ngAfterViewInit(): void {
        //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
        //Add 'implements AfterViewInit' to the class.
        // this.footbarHeight = -this.elementView.nativeElement.offsetHeight;
        // console.log('this.footbarHeight', this.footbarHeight)
    }

    onResize(event: any){
        // console.log(window.innerHeight)
        // this.clientHeight = window.innerHeight; // window width
    }
}
