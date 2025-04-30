import { Component, OnInit, Input, HostListener, Optional, ChangeDetectorRef } from '@angular/core';
import { AuthenticationService } from '../../auth/auth.service';
import { Credentials } from '../../auth/auth';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { HeaderPubComponent } from './header-pub/header-pub.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [
      CommonModule,
      HeaderPubComponent
    ],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    animations: [
        trigger('userExpand', [
            state('collapsed', style({height: '0px', minHeight: '0', opacity: '0'})),
            state('expanded', style({height: '*', opacity: '1'})),
            transition('expanded <=> collapsed', animate('625ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ])
    ]
})
export class HeaderComponent implements OnInit {
    title_line01: string = "MIDAS";
    title_line02: string = "DATA PUBLISHING";
    credential: Credentials = {} as Credentials;
    userBlockStatus: string = 'collapsed';

    @Input() appVersion: string = "1.0";
    @Input() titleLn1: string = "MIDAS";
    @Input() titleLn2: string = "DATA PUBLISHING";
    @Input() showUserIcon: boolean = true;

    constructor(
      @Optional() public authService: AuthenticationService,
      private chref: ChangeDetectorRef,) {
        if (this.authService) {
            this.authService.watchCredential((cred: Credentials) => {
                // console.debug('cred', cred);
                this.credential = cred;
                if (cred)
                    console.debug('User identified:', cred.userId);
            });
        } else {
            // authService  not provided
            console.log('AuthenticationService is not provided.');
        }
    }


    @HostListener('document:click', ['$event'])
    clickout() {
        this.userBlockStatus = 'collapsed';
    }

    ngOnInit(): void {
        this.title_line01 = this.titleLn1.toUpperCase();
        this.title_line02 = this.titleLn2.toUpperCase();
        console.log("showUserIcon", this.showUserIcon);
        this.chref.detectChanges();
    }

    toggleUserBlock() {
        if(this.userBlockStatus == 'collapsed'){
            this.userBlockStatus = 'expanded';
        }else{
            this.userBlockStatus = 'collapsed';
        }
    }

    goHome() {

    }
}
