import { Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

import { Configuration, ReleaseInfo, RELEASE_INFO, CONFIG_URL } from "./config.model";
import { environment } from "../../environments/environment";

/**
 * Service responsible for providing configuration data for the application.
 * It loads the configuration from a given file and provides access to it
 * throughout the app.
 */
@Injectable()
export class ConfigurationService {

    configUrl = environment.configUrl;
    config: Configuration | null = null;
    relInfo: ReleaseInfo|undefined|null = null;

    constructor(private http: HttpClient,
                @Inject(CONFIG_URL) configUrl?: string,
                @Optional() @Inject(RELEASE_INFO) relInfo?: ReleaseInfo)
    {
        this.relInfo = relInfo;
        if (configUrl) this.configUrl = configUrl;
    }

    loadConfig(data: any): void {
        this.config = data as Configuration;

        if (! this.config.componentRelease && this.relInfo != null)
            this.config.componentRelease = this.relInfo

        let r: ReleaseInfo|undefined = this.config.componentRelease;
        let msg = "app configuration loaded for ";
        if (r) msg += " for "+r.component+", version "+r.version
        console.log(msg);
    }

    /**
     * Get the configuration object from the config URL.
     * @returns An observable containing the configuration object.
     */
    public fetchConfig(configURL: string | null = null): Observable<Configuration> {
        const url = configURL ?? this.configUrl;
        return this.http.get<Configuration>(url, { responseType: 'json' }).pipe(
            catchError(this.handleError),
            tap(cfg => this.loadConfig(cfg))
        );
    }

    /**
     * return the (already loaded) configuration data.  It is expected that when this 
     * method is call that the configuration was already fetched (via fetchConfg()) at 
     * application start-up.  
     */
    public getConfig(): Configuration {
        return this.config ?? { };
    }

    /**
     * Handle the HTTP errors.
     * @param error The error object.
     * @returns An observable containing the error message.
     */
    private handleError(error: any) {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            // Get client-side error
            errorMessage = error.error.message;
        } else {
            // Get server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        window.alert(errorMessage);
        return throwError(() => {
            return errorMessage;
        });
    }
}


