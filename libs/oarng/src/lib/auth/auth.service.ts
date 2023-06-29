import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError, Subscriber } from 'rxjs';

import { UserDetails, deepCopy } from './auth';
import { Configuration, ConfigurationService } from '../config/config.module';

/**
 * a container for authentication information that is obtained from the authentication
 * service.  It contains two key parts.  The first is a block of unencode attributes describing 
 * the user which the Angular application can use directly for display or for customizing the 
 * view.  The second is an authentication token which can be passed to other server-side services
 * as an HTTP Bearer Authorization string.  Typically, this token is a JSON Web Token (JWT) that 
 * encodes the same information as the unencoded attributes and which can by used by the service 
 * to make authorization decisions.
 */
export interface AuthInfo {
    /**
     * the unencoded user identity and attributes
     */
    userDetails?: UserDetails,

    /**
     * the token that can be used to authenticate to other services.  This is typically a JWT,
     * but it is not required to be. 
     */
    token?: string | null,

    /**
     * other parameters are allowed
     */
    [prop: string]: any;
}

/**
 * the front-end authentication service used to retrieve identity information and to manage 
 * the authentication process.  
 *
 * This service allows an OAR Angular application to retrieve infomation the currently logged 
 * in user, to log the user in if they are not already logged in, and to retrieve an authentication
 * token that can be used to authenticate to other backend services.  
 *
 * This abstract class allows for different implementations for different execution 
 * contexts.  In particular, mock versions can be provided for development and testing 
 * contexts.
 */
export abstract class AuthenticationService {
    protected _authcred: AuthInfo = {
        userDetails: { userId: "" },
        token: ""
    }

    /**
     * the full set of user information obtained via the log-in process
     */
    get userDetails() { return this._authcred.userDetails as UserDetails; }

    /**
     * the user ID that the current authorization has been granted to.
     */
    get userID() { return this.userDetails.userId; }

    set userDetails(userDetails: UserDetails) { this._authcred.userDetails = userDetails; }

    /**
     * Store the error message returned from getAuthInfo
     */
    protected _errorMessage: string | null = null;

    set errorMessage(errMsg: string) { this._errorMessage = errMsg; }
    get errorMessage() { return this._errorMessage as string; }

    /**
     * construct the service
     */
    constructor() { }

    /**
     * return the user details in a implementation-specific way
     */
    // protected abstract _getUserDetails(): UserDetails;

    /**
     * return true if the user is currently authenticated.
     * If false, one can attempt to gain authorization via a call to getAuthInfo();
     */
    public isAuthorized(): boolean { return !!this.userID && !!this._authcred.token; }

    /**
     * return the authentication information describing the current user.  
     * Note that an implementation may need to redirect the browser 
     * to an authentication service to determine who the current user is.  
     *
     * @param nologin   if false (default) and the user is not logged in, the browser will be redirected 
     *                  to the authentication service.  If true, redirection will not occur; instead, 
     *                  no user information is set and null is returned if the user is not logged in.  
     */
    public abstract getAuthInfo(nologin?: boolean): Observable<AuthInfo>;

    /**
     * redirect the browser to the authentication service, instructing it to return back to 
     * this application after the login process is complete.  
     */
    public abstract loginUser(): void;
}

/**
 * an implementation of the CustomizationService that caches metadata updates on the 
 * server via a web service.  
 *
 * This implementation is intended for use in production.  
 */
@Injectable()
export class OARAuthenticationService extends AuthenticationService {

    private _endpoint: string|null  = null;
    private _authtok: string | null = null;

    /**
     * create the AuthService 
     */
    constructor(protected httpcli: HttpClient, protected configSvc: ConfigurationService) {
        super()
    }

    /**
     * the endpoint URL for the customization web service 
     */
    get endpoint(): string { 
        if (! this._endpoint) {
            this._endpoint = this.configSvc.getConfig()['AUTHAPI'] as string;
            if (!this._endpoint.endsWith('/')) this._endpoint += "/";
        }
        return this._endpoint;
    }

    /**
     * the URL the remote authorization service should redirect to to restart the application
     * after routing the browser user through the login service.  
     */
    get redirectURL(): string { return this.configSvc.getConfig()["REDIRECTAUTHAPI"] as string; }

    /**
     * the authorization token that gives the user permission to edit the resource metadata
     */
    get authToken(): string|null|undefined { return this._authcred.token; }

    /**
     * return the authentication information describing the current user.  
     * Note that an implementation may need to redirect the browser 
     * to an authentication service to determine who the current user is.  
     *
     * @param nologin   if false (default) and the user is not logged in, the browser will be redirected 
     *                  to the authentication service.  If true, redirection will not occur; instead, 
     *                  no user information is set and null is returned if the user is not logged in.  
     */
    public getAuthInfo(nologin: boolean = false): Observable<AuthInfo> {
        if (this.authToken)
            return of(this._authcred);

        // we need an authorization token
        return new Observable<AuthInfo>(subscriber => {
            this.getAuthorization(this.endpoint).subscribe({
                next:((response: AuthInfo) => {
                    if(response) {
                        this._authcred.token = response.token;
                        this._authcred.userDetails = deepCopy(response.userDetails);
                        if (response.token) {
                            // the user is authenticated and authorized to edit!
                            subscriber.next(this._authcred);
                            subscriber.complete();
                        }
                        else if (response.userDetails && response.userDetails.userId) {
                            // the user is authenticated but not authorized
                            this.errorMessage = response["message"];
                            subscriber.next(this._authcred);
                            subscriber.complete();
                        }else{
                            // the user is not authenticated!
                            subscriber.complete();

                            // redirect the browser to the authentication server
                            if (!nologin){
                                this.loginUser();
                            }else {
                                subscriber.next(undefined);
                                subscriber.complete();
                            }
                        }
                    }else{
                        subscriber.next(undefined);
                        subscriber.complete();
                    }
                }),
                error: ((err) => {
                    if (err['status'] && err.statusCode == 401) {
                        // User needs to log in; redirect the browser to the authentication server
                        if (!nologin){
                            this.loginUser();
                        }else {
                            subscriber.next(undefined);
                            subscriber.complete();
                        }
                    }
                    else
                        subscriber.error(err);
                })}
            );
        });
    }

    /**
     * fetch authorization information afresh from the remote authorization service.  If the user
     * has not completed the login process, an empty info object is returned.  
     *
     * @return Observable<AuthInfo>  -- On success, an AuthInfo containing either (1) the user's 
     *            ID and an authorization token, indicating that the user is authenticated, or (2)
     *            an empty AuthInfo object, indicating that the user needs to log in. 
     */
    public getAuthorization(endpoint: string | null): Observable<AuthInfo> {
        let endp: string = "";
        if(!endpoint) {
            return new Observable((subscriber) => {
                let msg = "No endpoint for auth service.";
                subscriber.error(msg);
            });
        }else if (!endpoint.endsWith('/')) endp = endpoint + "/";
        else endp = endpoint;

        let url = endp + "auth/_tokeninfo";

        console.debug("Authentication url", url);

        // wrap the HttpClient Observable with our own so that we can manage errors
        return new Observable<AuthInfo>(subscriber => {
            // this.httpcli.get(url, { headers: { 'Content-Type': 'application/json' } }).
            this.httpcli.get(url).subscribe(
                response => {
                    // URL returned OK
                    subscriber.next(response as AuthInfo);
                },
                err => {
                    let httperr: any = err;

                    if(typeof err === "string")
                        httperr = JSON.parse(err);

                    if (httperr.status == 401) {
                        // User failed authentication (usually does not happen)
                        subscriber.next({} as AuthInfo);
                        subscriber.complete();
                    }
                    else {
                        subscriber.error(httperr)
                    }
                }
            );
        });
    }

    /**
     * redirect the browser to the authentication service, instructing it to return back to 
     * the current landing page.  
     * 
     * @return string   the authenticated user's identifier, or null if authentication was not 
     *                  successful.  
     */
    public loginUser(): void {
        let redirectURL = this.endpoint + this.redirectURL + window.location.href;
        console.log("Redirecting to " + redirectURL + " to authenticate user");
        window.location.assign(redirectURL);
    }
}

/**
 * An AuthService intended for development and testing purposes which simulates interaction 
 * with a authorization service.  
 *
 * This implementation does not contact any remote service.  Instead, this service is provided 
 * with the user identity information representing the authenticated user at construction time.  
 */
@Injectable()
export class MockAuthenticationService extends AuthenticationService {

    /**
     * construct the authorization service
     *
     * @param userid     the ID of the user; default "anon"
     */
    constructor(@Inject('userDetails') userDetails1: UserDetails) {
        super();
        if (userDetails1 === undefined) {
            this._authcred = {
                userDetails: {
                    userId: "anon",
                    userName: "Anon",
                    userLastName: "Lee",
                    userEmail: "Anon.Lee@nist.gov"
                },
                token: 'fake jwt token'
            }
        } else {
            this._authcred = {
                userDetails: userDetails1,
                token: 'fake jwt token'
            }
        }
    }

    /**
     * return the authentication information describing the current user.  
     * Note that an implementation may need to redirect the browser 
     * to an authentication service to determine who the current user is.  
     *
     * @param nologin   if false (default) and the user is not logged in, the browser will be redirected 
     *                  to the authentication service.  If true, redirection will not occur; instead, 
     *                  no user information is set and null is returned if the user is not logged in.  
     */
    public getAuthInfo(nologin: boolean = false): Observable<AuthInfo> {
        // simulate logging in with a redirect 
        if (!this.userDetails){ 
          this.loginUser();}

        return of<AuthInfo>(this._authcred);
    }

    /**
     * redirect the browser to the authentication service, instructing it to return back to 
     * the current landing page.  
     */
    public loginUser(): void {
        let redirectURL = window.location.href + "?editEnabled=true";
        console.log("Bypassing authentication service; redirecting directly to " + redirectURL);
        if (!this._authcred.userDetails){
            this._authcred = {
                userDetails: {
                userId: "anon",
                userName: "Anon",
                userLastName: "Lee",
                userEmail: "Anon.Lee@nist.gov"
                },
                token: 'fake jwt token'
            }
        } 
        window.location.assign(redirectURL);
    }

}


