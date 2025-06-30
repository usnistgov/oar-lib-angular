import { Component, Input } from '@angular/core';

@Component({
  selector: 'lib-nist-logo',
  standalone: true,
  imports: [],
  templateUrl: './nist-logo.component.html',
  styleUrl: './nist-logo.component.css'
})
export class NistLogoComponent {
  @Input() titleLn1: string = "MIDAS";
  @Input() titleLn2: string = "DATA PUBLISHING";
}
