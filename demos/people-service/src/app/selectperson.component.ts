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
    selector: 'od-select-person',
    templateUrl: './selectperson.component.html'
})
export class SelectPersonComponent {
    minPromptLength = 2;

    // the index we will download after the first minPromptLength (2) characters are typed
    index: SDSIndex|null = null;

    // the current list of suggested completions matching what has been typed so far.
    suggestions: SDSuggestion[] = [];

    // the suggested completion that was picked; it contains a reference to the full record
    selectedSuggestion: SDSuggestion|null = null;

    // the full record for the selected person
    selected: any = null;

    // the organizations that the selected person is a member of
    selectedOrgs: any[]|null = null;

    json = JSON;

    constructor(private ps: StaffDirectoryService) { }

    set_suggestions(ev: AutoCompleteCompleteEvent) {
        if (ev.query) {
            if (ev.query.length >= this.minPromptLength) {  // don't do anything unless we have 2 chars
                if (! this.index) {
                    // retrieve initial index
                    this.ps.getPeopleIndexFor(ev.query).subscribe(
                        pi => {
                            // save it to use with subsequent typing
                            this.index = pi;
                            if (this.index != null) {
                                // pull out the matching suggestions
                                this.suggestions = (this.index as SDSIndex).getSuggestions(ev.query);
                            }
                        },
                        e => {
                            console.error('Failed to pull people index for "'+ev.query+'": '+e)
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
                console.error("Failed to resolve suggestion into person data");
            }
        );
    }

    showOrgs(ev: MouseEvent) {
        if (this.selectedSuggestion) {
            this.ps.getOrgsFor(this.selectedSuggestion.id).subscribe(
                recs => {
                    this.selectedOrgs = recs;
                },
                err => {
                    console.error("Failed to resolve person id into org data");
                }
            );
        }
    }
}

    

    
