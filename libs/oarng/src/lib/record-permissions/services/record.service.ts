import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap, throwError } from 'rxjs';

import { ConfigurationService } from '../../config/config.service';
import { AuthenticationService } from '../../auth/auth.service';
import { Credentials } from '../../auth/auth';

import { Acls } from '../types/acls.type';
// import { PermissionsConfig } from '../types/permissions-config.model';


@Injectable(
  {  providedIn: 'root'  }
)
export class MidasRecordService {
  PDR_API = "http://localhost:9091/midas/dmp/mdm1"//https://mdsdev.nist.gov
  // dmpsAPI = "http://127.0.0.1:5000/dmps"

  private new_midas_record: Acls = {
    read:   [],
    write:  [],
    admin:  [],
    delete: []

  }

  constructor(
    private http: HttpClient, 
    // private configService: ConfigurationService, 
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

  fetchMIDASRecord(recordID:string|null) {
    /**
     * get MIDAS record from API
     */
    
    let apiAddress:string = this.PDR_API; //this.configService.getConfig<PermissionsConfig>().PDRMIDAS;
    if (recordID !==null){
      apiAddress += "/" + recordID;
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
