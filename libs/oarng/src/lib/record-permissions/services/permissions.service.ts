import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap, throwError } from 'rxjs';

import { ConfigurationService } from '../../config/config.service';
import { AuthenticationService } from '../../auth/auth.service';
import { Credentials } from '../../auth/auth';

import { Acls } from '../types/acls.type';
import { EndPointsConfiguration } from './config.model';
// import { PermissionsConfig } from '../types/permissions-config.model';


@Injectable(
  {  providedIn: 'root'  }
)
export class PermissionsService {
  private new_midas_record: Acls = {
    read:   [],
    write:  [],
    admin:  [],
    delete: []

  }

  constructor(
    private http: HttpClient,
    private configService: ConfigurationService, 
    private authService: AuthenticationService) {

      console.log("MidasService Constructor");
  }

  // Http Options
  getHttpOptions(creds?: Credentials): {headers: HttpHeaders} {
    let hdrs: {[name: string]: string} = {
      'Content-Type': 'application/json',
    };
    if (creds)
      hdrs["Authorization"] = "Bearer "+creds.token;
    return { headers: new HttpHeaders(hdrs) };
  };

  fetchMIDASRecord(recordID:string|null, recordTYPE:string|null)  {
    /**
     * get MIDAS record from API
     * return the ACLs currently set for this DMP get
     * https://localhost/midas/dmp/mdm1/{projid}/acls
     */


    let apiAddress:string = ""; 

    if (recordTYPE === "DMP"){
      console.log(this.configService.getConfig<EndPointsConfiguration>().PDRDMP);
      apiAddress = this.configService.getConfig<EndPointsConfiguration>().PDRDMP;
    }
    else if(recordTYPE === "DAP"){
      console.log(this.configService.getConfig<EndPointsConfiguration>().PDRDAP);
      apiAddress = this.configService.getConfig<EndPointsConfiguration>().PDRDAP;
    }
    else{

    }
    
    
    if (recordID !==null){
      apiAddress += "/" + recordID + "/acls";
    }
    // console.log("fetchMIDASRecord: pre get");
    //return this.http.get<any>(apiAddress, this.getHttpOptions(creds));
    return this.authService.getCredentials().pipe(
      switchMap(creds => {
        if (! creds)
          throwError(new Error("Authentication Failed"));
        return this.http.get<any>(apiAddress, this.getHttpOptions(creds))
      })
    );
    
    
  }
}
