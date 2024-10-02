import { Component, OnInit } from '@angular/core';

import { AutoCompleteCompleteEvent, AutoCompleteOnSelectEvent } from 'primeng/autocomplete';
import { tap, catchError } from "rxjs/operators";

import { SDSuggestion, SDSIndex, StaffDirectoryService, AuthenticationService } from 'oarng';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'people-service';
    appVersion = 'demo';
    authToken: string|null = null;

    constructor(private authsvc: AuthenticationService,
                private sdsvc: StaffDirectoryService)
    { }

    ngOnInit() {
        this.authsvc.getCredentials().subscribe(
            creds => {
                if (creds.token) {
                    this.authToken = creds.token
                    this.sdsvc.setAuthToken(creds.token)
                }
            }
        );
    }
}
