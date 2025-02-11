import { Component, Input } from '@angular/core';

@Component({
  selector: 'lib-header-pub',
  standalone: true,
  imports: [],
  templateUrl: './header-pub.component.html',
  styleUrl: './header-pub.component.css'
})
export class HeaderPubComponent {
  title_line01: string = "MIDAS";
  title_line02: string = "DATA PUBLISHING";

  @Input() appVersion: string = "1.0";
  @Input() titleLn1: string = "MIDAS";
  @Input() titleLn2: string = "DATA PUBLISHING";

  ngOnInit() {
    this.title_line01 = this.titleLn1.toUpperCase();
    this.title_line02 = this.titleLn2.toUpperCase();
  }
}
