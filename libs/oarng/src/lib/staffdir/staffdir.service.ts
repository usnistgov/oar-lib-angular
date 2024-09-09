import { Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject, throwError } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { of } from "rxjs";

import { Configuration, ConfigurationService } from "../config/config.module";

type anyobj = { [paramName: string]: any }
type idxrefs = { [paramName: string]: string }
type idxdata = { [paramName: string]: idxrefs }

const PARENT_ORG_ID = "parenT_ORG_ID";
const GROUP_ID = "groupOrgID";

/**
 * configuration data describing how to access the remote directory and indexing services assembled in a 
 * single object.
 */
export interface SDServiceConfig {
    /**
     * the base URL for the remote directory service
     */
    serviceEndpoint: string;

    /**
     * if True, require that an authentication token be sent in all queries.  
     */
    requireAuthToken?: boolean;
}

/**
 * the configuration part required by the StaffDirectoryService
 */
export interface SDSConfiguration extends Configuration {
    /**
     * the parameters describing how to access the remote authentication service
     */
    staffdir: SDServiceConfig;
}

/**
 * a reference to a staff directory record (either a person or an organization).  This is 
 * intended to be used as a suggestion for entering a person or organization into a form.  
 * It is normally created via the getSuggestions() method of the SDSIndex class.  This 
 * suggestion can be converted to a full description record via its getRecord() method.  
 */
export class SDSuggestion {

    /**
     * the identifer of the suggested record
     */
    public readonly id: number = 0;

    /**
     * the string to use to represent the suggestion in displays (e.g. pick-lists)
     */
    public readonly display: string = "";

    protected _getrec: (i: number) => Observable<anyobj|null>; 

    /**
     * create a suggestion for a person or organization.  This constructor is normally 
     * called via getSuggestions() method of the SDSIndex class.  
     * @param id       the id that can be used to get the full record
     * @param display  a string representation of the suggestion that should be used in 
     *                   in displays (namely, a suggetsion pick-list).  
     * @param getrecf  the function (whose argument is the record identifier) that will 
     *                   return the full record.  It is essentially this choice of 
     *                   function that determines whether the record refers to a person
     *                   or an organization.
     */
    constructor(id: number|string, display: string,
                protected getrecf : (i: number) => Observable<anyobj|null>) {
        let nid : number = 0;
        if (typeof id === "string")
            nid = parseInt(id as string);
        else 
            nid = id as number;
        this.id = nid;
        this.display = display;
        this._getrec = getrecf;
    }

    public getRecord() : Observable<anyobj> {
        return this.getrecf(this.id).pipe(
            map<anyobj|null, anyobj>((r) => {
                if (r == null)
                    throw new Error("Inconsistent or Expired Index: no record received for id="+this.id);
                return r as anyobj;
            })
        );
    }
}

/**
 * an index into records from the staff directory service.  
 * 
 * The purpose of this class is to offer suggestions for matching records based on the first few 
 * characters typed into an input by the end user.  Instead of continuously submitting full querys 
 * to the service in real time with each character the user types, an index into a subset of records 
 * matching the first few (one or two) characters is downloaded once; the angular app can then winnow 
 * the list down further on the client-side using the index.  When the user selects one of the records, 
 * the application uses this index instance to pull down the full record.
 *
 * An index is downloaded from the StaffDirectoryService via its getPeopleIndexFor() or getOrgsIndexFor() 
 * method.  The component using the index can then get matching suggestions by providing the user's 
 * input to the index's getSuggestions().  Each suggestion, an IndexReference, provides the record 
 * identifier for the matched record and a display string to show in the pick-list for that record.
 * (For example, for a person suggestion, the display string shows the last and first name of the person.)
 * When the user selects one of the suggestions, the component pull down the full record via the 
 * IndexReference's getRecord() method.  
 */
export class SDSIndex {

    /**
     * wrap a index data downloaded from the staff directory service into a useable object
     **/
    constructor(protected data: idxdata, protected getrecf: (id: number) => Observable<anyobj|null>) {
        // check data
    }

    /**
     * return a list of record references from the index that match the given prompt.  Note that 
     * the prompt must start with the string that was used to download the index from the service;
     * otherwise, an empty list (indicating no matches) will be returned.  To get suggestions for 
     * prompt with a different prefix, one must create a new index first. 
     */
    public getSuggestions(prompt: string) : SDSuggestion[] {
        let matched: idxrefs = {};
        for (let key in this.data) {
            if (key.startsWith(prompt)) {
                for (let id in this.data[key]) 
                    matched[id] = this.data[key][id];
            }
        }

        let out: SDSuggestion[] = [];
        for (let id in matched)
            out.push(new SDSuggestion(id, matched[id], this.getrecf))
        return out;
    }
}


/**
 * Service for pulling data from the remote staff directory service.  This is compatible with the "oar1"
 * version of the service in which data search, retrieval, and indexing are all available via a single
 * endpoint.  
 *
 * In the case when clients need to authenticate to the remote directory service with a token, that 
 * token must be added to an instance of this class before any data methods can be used.  
 * 
 * This service pulls configuration data from a ConfigurationService under the "staffdir" object 
 * property.  Subproperties it looks for include:
 * 
 *   * serviceEndpoint  -- (reqired) the base URL for the oar1 staff directory service
 *   * requireAuthToken -- (optional) if True, an error will be thrown if an attempt to query 
 *                         the service happens before setting an authentication token.  
 */
@Injectable()
export class StaffDirectoryService {
    static readonly ORGS_EP = "Orgs";
    static readonly OU_EP = "Orgs/OU";
    static readonly DIV_EP = "Orgs/Div";
    static readonly GROUP_EP = "Orgs/Group";
    static readonly PEOPLE_EP = "People";

    protected _token: string|null = null;
    _cfg: SDServiceConfig;

    constructor(protected httpcli: HttpClient, protected configSvc: ConfigurationService) {
        try {
            this._cfg = this.configSvc.getConfig<SDSConfiguration>().staffdir;
            if (! this._cfg.serviceEndpoint.endsWith('/')) 
                this._cfg.serviceEndpoint += '/';
        } catch (ex) {
            if (ex instanceof Error) 
                ex.message = "Incomplete Staff Directory Service configuration: " + ex.message;
            throw ex;
        }
    }

    /**
     * set the token that should be used to authenticate to the service
     */
    public setAuthToken(token: string) : void {
        this._token = token;
    }

    protected _headers() : anyobj {
        let out: anyobj = { 'Accept': 'application/json' };
        if (this._token) 
            out['Authorization'] = "Bearer "+this._token;
        else if (this._cfg.requireAuthToken)
            throw new Error("Missing Authentication Token (must be set prior to first request)");
        return out;
    }

    protected _get(relurl: string) : Observable<anyobj|anyobj[]> {
        return this.httpcli.get(this._cfg.serviceEndpoint + relurl);
    }

    protected _handleHTTPError(error: Error) : anyobj|anyobj[] {
        let emsg: string = '';
        let herr: HttpErrorResponse|null = null;
        
        if (error instanceof HttpErrorResponse) {
            herr = error as HttpErrorResponse;

            if (herr.status == 0) 
                // client-side system error
                emsg = "Failed to connect to staff directory: " + herr.error
            else if (herr.error) {
                emsg = "Staff directory service error ("+herr.status+" "+herr.statusText+")"
                if (herr.error.message) 
                    emsg += ": "+herr.error.message;
                else if (herr.error["oar:message"])
                    emsg += ": "+herr.error["oar:message"];
                else
                    emsg += herr.error
            }
        }
        else if (error.message)
            emsg = "Unexpected error while processing staff directory request: " + error.message;
        else 
            emsg = "Unexpected error while processing staff directory request: " + error;

        console.error(emsg);
        throw error;
    }

    /**
     * return the metadata describing a staff person given its identifier or null 
     * if the identifier is not found.
     */
    public getPerson(id: number) : Observable<anyobj|null> {
        let url = StaffDirectoryService.PEOPLE_EP + "/" + id.toString();
        return this._get(url).pipe(
            map<any, anyobj>((r) => {
                if (! (r.peopleID))
                    throw new Error("Non-Person record response from staff directory person request: "+r);
                return r as anyobj;
            }),
            catchError((e) => {
                if (! e.status || e.status != 404)
                    this._handleHTTPError(e);
                
                // ID was not found
                return of<anyobj|null>(null);
            })
        );
    }

    /**
     * return the metadata describing a staff person given its ORCID identifier or null 
     * if the identifier is not found.
     */
    public getPersonByORCID(orcid: string) : Observable<anyobj|null> {
        let url = StaffDirectoryService.PEOPLE_EP + "?with_orcid=" + orcid
        return this._get(url).pipe(
            map<any, anyobj>((r) => {
                if (r instanceof Array) {
                    if (r.length > 0)
                        return r[0];
                    return null;
                }

                let msg = "Unexpected response from staff service: not an array"
                console.error(msg);
                throw new Error(msg);
            }),
            catchError((e) => {
                this._handleHTTPError(e);
                throw "Unhandled error: "+e;
            })
        );
    }

    /**
     * return an index for person records that match a given prompt.  The items in the index
     * reference records where the last name or first name of the person starts with the 
     * prompt string.  
     */
    public getPeopleIndexFor(prompt: string) : Observable<SDSIndex> {
        let url = StaffDirectoryService.PEOPLE_EP + "/index?like=" + prompt
        return this._get(url).pipe(
            map<any, SDSIndex>((r) => new SDSIndex(r, this.getPerson)),
            catchError((e) => {
                this._handleHTTPError(e);
                throw "Unhandled error: "+e;
            })
        );
    }

    /**
     * return the metadata describing an organization from the org-chart given its identifier, 
     * or return null if the identifier is not found.  The matched organization may be an OU,
     * division, group, or other special type.
     */
    public getOrg(id: number) : Observable<anyobj|null> {
        let url = StaffDirectoryService.ORGS_EP + "/" + id.toString();
        return this._get(url).pipe(
            map<any, anyobj>((r) => {
                if (! (r.orG_ID))
                    throw new Error("Non-Org record response from staff directory person request: "+r);
                return r as anyobj;
            }),
            catchError((e) => {
                if (! e.status || e.status == 404)
                    this._handleHTTPError(e);
                
                // ID was not found
                return of<anyobj|null>(null);
            })
        );
    }

    /**
     * return an index for person records that match a given prompt.  The items in the index
     * reference records where the last name or first name of the person starts with the 
     * prompt string.  
     */
    public getOrgsIndexFor(prompt: string) : Observable<SDSIndex> {
        let url = StaffDirectoryService.ORGS_EP + "/index?like=" + prompt
        return this._get(url).pipe(
            map<any, SDSIndex>((r) => new SDSIndex(r, this.getOrg)),
            catchError((e) => {
                this._handleHTTPError(e);
                throw "unhandled error: "+e;
            })
        );
    }

    /**
     * return a list of the full organization records for the line of organizations that a 
     * person with the given identifier is a member of.  The first three organizations in the 
     * list are the group, division, and OU, respectively.  If there are more than three elements,
     * the latter ones represent higher level groupings that contain the OU.  Null is returned 
     * if the given ID is not found.
     */
    public getOrgsFor(personId: number) : Observable<anyobj[]|null> {
        return this.getPerson(personId).pipe(
            switchMap((r) => {
                if (r == null)
                    return of<anyobj[]|null>(null);

                if (r[GROUP_ID] == undefined)
                    throw new Error("Unexpected Person record data: missing groupOrdID property");

                return this._addParentOrg(r[GROUP_ID], []);
            })
        );
    }

    _addParentOrg(parentID: number, orgs: anyobj[]) : Observable<anyobj[]> {
        return this.getOrg(parentID).pipe(
            switchMap((r) => {
                if (r == null || r[PARENT_ORG_ID] == null)
                    return of(orgs);

                if (r[PARENT_ORG_ID] == undefined) {
                    console.error("Unexpected Org record returned (id="+parentID+
                                  "): missing parentT_ORG_ID")
                    if (orgs.length == 0)
                        throw new Error("Unexpected Group record returned: missing parentT_ORG_ID");
                    console.info("Returning orgs found so far");
                    return of(orgs);
                }

                return this._addParentOrg(r[PARENT_ORG_ID], orgs)
            })
        );
    }
}
