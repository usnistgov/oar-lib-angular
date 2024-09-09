import { Component } from '@angular/core';

import { AutoCompleteCompleteEvent, AutoCompleteOnSelectEvent } from 'primeng/autocomplete';
import { tap, catchError } from "rxjs/operators";

import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'people-service';
    appVersion = 'demo';

}
