import { Component } from '@angular/core';

import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { tap, catchError } from "rxjs/operators";

import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';

/**
 * a demonstration components showing the use of the StaffDirectoryService to provide 
 * suggests to an input component.  This uses the PrimeNG AutoComplete component to display 
 * and select suggested completions for partially typed names.
 */
@Component({
    selector: 'od-select-org',
    templateUrl: './selectorg.component.html'
})
export class SelectOrgComponent {
    minPromptLength = 2;

    // the index we will download after the first minPromptLength (2) characters are typed
    index: SDSIndex|null = null;

    // the current list of suggested completions matching what has been typed so far.
    suggestions: SDSuggestion[] = [];

    // the suggested completion that was picked; it contains a reference to the full record
    selectedSuggestion: SDSuggestion|null = null;

    // the full record for the selected organization
    selected: any = null;

    json = JSON;

    constructor(private ps: StaffDirectoryService) { }

    set_suggestions(ev: AutoCompleteCompleteEvent) {
        if (ev.query) {
            if (ev.query.length >= this.minPromptLength) {  // don't do anything unless we have 2 chars
                if (! this.index) {
                    // retrieve initial index
                    this.ps.getOrgsIndexFor(ev.query).subscribe(
                        pi => {
                            // save it to use with subsequent typing
                            this.index = pi;
                            if (this.index != null) {
                                // pull out the matching suggestions
                                this.suggestions = (this.index as SDSIndex).getSuggestions(ev.query);
                            }
                        },
                        e => {
                            console.error('Failed to pull orgs index for "'+ev.query+'": '+e)
                        }
                    );
                }
                else
                    // pull out the matching suggestions
                    this.suggestions = (this.index as SDSIndex).getSuggestions(ev.query);
            }
            else if (this.index) {
                this.index = null;
                this.suggestions = [];
            }
        }
    }

    showFullRecord(ev: AutoCompleteSelectEvent) {
        let sugg = ev.value as SDSuggestion;
        sugg.getRecord().subscribe(
            rec => { 
                this.selected = rec;
            },
            err => {
                console.error("Failed to resolve suggestion into org data");
            }
        );
    }


    showAllOrgs(ev: MouseEvent) {
        if (this.selectedSuggestion) {
            this.ps.getParentOrgs(this.selectedSuggestion.id, true).subscribe(
                recs => {
                    this.selected = recs;
                },
                err => {
                    console.error("Failed to resolve org id into org chain");
                }
            );
        }
    }
}

    

    
