import { Component, Input, OnInit } from '@angular/core';
import * as footerlinks from '../../../assets/site-constants/footer-links.json';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
    faXTwitter, faFacebook, faLinkedin, faInstagram, faYoutube
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faRss } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule, FontAwesomeModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
    appVersion: string = "1.0";

    footerLinks: any;

    // Social media list
    socialMediaList : any[];

    // Footer link line #1
    footerLinks01: any[];

    // Footer link line #2
    footerLinks02: any[];

    @Input() useNewIcons: boolean = false;

    constructor(public iconLibrary: FaIconLibrary) {
        iconLibrary.addIcons(
            faXTwitter, faFacebook, faLinkedin, faInstagram, faEnvelope, faYoutube, faRss
        );

        // For some reason, footerlinks does not have "default" field in unit test
        // So we have to use following condition to make both production and unit test work.
        if((footerlinks as any).default)
            this.footerLinks = (footerlinks as any).default;
        else
            this.footerLinks = footerlinks as any;

        // Add footerLinks to the condition to avoid unit test error
        this.socialMediaList = this.footerLinks.socialMediaList;

        this.footerLinks01 = this.footerLinks.footerLinks01;
        this.footerLinks02 = this.footerLinks.footerLinks02;
    }

    ngOnInit() {
        if (this.useNewIcons) {
            this.replaceSocialMediaIcons();    
        }
    }

    replaceSocialMediaIcons() {
        for (let i = 0; i < this.socialMediaList.length; i++) {
            let character = "-";
            let newSocialMediaIcon = "";

            // Find the index of the character
            const startIndex = this.socialMediaList[i].icon.indexOf(character);

            // Check if the character was found
            if (startIndex !== -1) {
            // Get the substring starting one position after the character
                newSocialMediaIcon = this.socialMediaList[i].icon.substring(startIndex + 1);
            } 

            if(newSocialMediaIcon == "twitter") {
                newSocialMediaIcon = "x-twitter";
            } 

            this.socialMediaList[i].icon = newSocialMediaIcon;
        }
    }

    /**
     * The classes for the first and last items are different from the items in the link array.
     * This function return different class name based on the index of an item.
     * @param index - index number of the given array
     * @param linkArray - the link array. The array's length is used to decide the position of the given index.
     * @returns class name
     */
    getLinkClass(index: number, linkArray: any[]) {
        let className = "menu__item is-leaf leaf menu-depth-1";

        if( index == 0){
            className = "menu__item is-leaf first leaf menu-depth-1";
        } else if(index == linkArray.length-1) {
            className = "menu__item is-leaf last leaf menu-depth-1";
        }

        return className;
    }
}
