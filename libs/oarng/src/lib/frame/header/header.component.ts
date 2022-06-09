import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
    @Input() appVersion: string = "1.0";

    constructor() { }

    ngOnInit(): void {
    }

    goHome() {
        
    }
}
