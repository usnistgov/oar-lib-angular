import { Component, Inject, Input } from '@angular/core';
import { NistLogoComponent } from '../nist-logo/nist-logo.component';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-header-pub',
  standalone: true,
  imports: [ NistLogoComponent, CommonModule ],
  templateUrl: './header-pub.component.html',
  styleUrls: ['./header-pub.component.css','../header.component.css']
})
export class HeaderPubComponent {
    title_line01: string = "MIDAS";
    title_line02: string = "DATA PUBLISHING";
    
    @Input() appVersion: string = "1.0";
    @Input() titleLn1: string = "MIDAS";
    @Input() titleLn2: string = "DATA PUBLISHING";
    @Input() homeButtonLink: string = "";

    constructor(@Inject(DOCUMENT) private document: Document) { }
    
    ngOnInit() {
        this.title_line01 = this.titleLn1.toUpperCase();
        this.title_line02 = this.titleLn2.toUpperCase();
    }

    goHome() {
        this.document.location.href = this.homeButtonLink;
    }
}
