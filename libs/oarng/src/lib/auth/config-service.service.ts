import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

declare var require: any

export interface Config {
    AUTHAPI: string;
    REDIRECTAUTHAPI: string
}

@Injectable({
  providedIn: 'root'
})
export class AppConfig {
    private confCall: any;
    private envVariables = "assets/environment.json";
    private confValues = {} as Config;

    constructor(private http: HttpClient
    ) { }

    loadAppConfig() {
        console.log("Retrieving configuration from "+this.envVariables);
        
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
    }

    getConfig() {
    // console.log(" ****** In Browser 3: "+ JSON.stringify(this.confValues));
        return this.confValues;
    }

    loadConfigForTest(){
        this.confValues = {
            "AUTHAPI":  "http://localhost:9091/midas/",
            "REDIRECTAUTHAPI": "saml/login?redirectTo="
        };
    }    
}
