import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import environment from '../../assets/environment.json';
import { isPlatformBrowser } from '@angular/common';
import process from 'process';
import { Location } from '@angular/common';

declare var require: any

// const process = require('process');


export interface Config {
    AUTHAPI: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppConfig {
    private appConfig: any;
    private confCall: any;
    private envVariables = "assets/environment.json";
    private confValues = {} as Config;

    constructor(private http: HttpClient, @Inject(PLATFORM_ID)
                private platformId: Object
    ) { }

    loadAppConfig() {
        if (isPlatformBrowser(this.platformId)) {

            // set this.envVariables to be the full URL for retrieving
            // configuration.  Normal rules of relative URLs are applied.    
            let baseurl = null;
            if (this.envVariables.startsWith("/")) {
                baseurl = location.origin;
            }
            else {
                console.log(location.href);
                baseurl = location.href.replace(/#.*$/, "");
                baseurl = baseurl.split("/", 3).join("/") + "/";
                // if (! this.envVariables.endsWith("/"))
                //     baseurl = baseurl.replace(/\/[^\/]+$/, "/");
            }
            this.envVariables = baseurl + this.envVariables;
        //   console.log("Retrieving configuration from "+this.envVariables);
            
            this.confCall = this.http.get(this.envVariables)
            .toPromise()
            .then(
                resp => {
                // resp as Config;
                this.confValues.AUTHAPI = (resp as Config)['AUTHAPI'];
                },
                err => {
                console.log("ERROR IN CONFIG :" + JSON.stringify(err));
                }
            );
            return this.confCall;
        } else {

            this.appConfig = <any>environment;
            this.confValues.AUTHAPI = process.env['AUTHAPI'] || this.appConfig.AUTHAPI;
            console.log(" ****** In server: " + JSON.stringify(this.confValues));
        }
    }

    getConfig() {
    // console.log(" ****** In Browser 3: "+ JSON.stringify(this.confValues));
        return this.confValues;
    }

    loadConfigForTest(){
        this.confValues = {
            "AUTHAPI":  "http://localhost:9091/midas/"
        };
    }    
}
