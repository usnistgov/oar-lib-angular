import { Component, Inject, Input, ViewEncapsulation } from '@angular/core';
import { NistLogoComponent } from '../nist-logo/nist-logo.component';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faXmark, faHouse } from '@fortawesome/free-solid-svg-icons';
import { GovBannerComponent } from '../../gov-banner/gov-banner.component';

@Component({
    selector: 'app-header-pub',
    standalone: true,
    imports: [
        NistLogoComponent,
        CommonModule,
        FontAwesomeModule,
        GovBannerComponent,
    ],
    templateUrl: './header-pub.component.html',
    styleUrls: ['./header-pub.component.css', '../header.component.css'],
})
export class HeaderPubComponent {
    title_line01: string = 'MIDAS';
    title_line02: string = 'DATA PUBLISHING';
    mobileMenuOpen = false;

    bannerExpanded = false;

    faBars = faBars;
    faXmark = faXmark;
    faHouse = faHouse;

    @Input() appVersion: string = '1.0';
    @Input() titleLn1: string = 'MIDAS';
    @Input() titleLn2: string = 'DATA PUBLISHING';
    @Input() homeButtonLink: string = '';

    constructor(@Inject(DOCUMENT) private document: Document) {}

    ngOnInit() {
        this.title_line01 = this.titleLn1.toUpperCase();
        this.title_line02 = this.titleLn2.toUpperCase();
    }

    goHome() {
        this.document.location.href = this.homeButtonLink;
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu(): void {
        this.mobileMenuOpen = false;
    }

    toggleBanner(): void {
        this.bannerExpanded = !this.bannerExpanded;
    }
}
