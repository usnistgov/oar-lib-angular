import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of, map, tap, switchMap, catchError, throwError, Subscriber, EMPTY } from 'rxjs';

import { AuthInfo, UserDetails, Credentials, MOCK_CREDENTIALS, messageToCredentials, deepCopy } from './auth';
import { Configuration, ConfigurationService } from '../config/config.module';

const anonymousCreds: Credentials = {
    userId: "anon",
    userAttributes: { userName: "Anonymous", userLastName: "Public" },
    token: null
};

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
    protected _cred: Credentials = deepCopy(anonymousCreds);

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

    static authenticatedCreds(cred: Credentials) {
        return (!!cred && !!cred.token &&
                (!cred.expires || (new Date()) < cred.expires));
    }

    /**
     * return true if the user is currently authenticated.
     * If false, one can attempt to gain authorization via a call to getAuthInfo();
     */
    public isAuthenticated(): boolean { return AuthenticationService.authenticatedCreds(this._cred); }

    /**
     * return valid credentials.  If valid credentials are internally cached, they are returned
     * for immediate use.  Otherwise, credentials are fetched via fetchCredentials().
     *
     * @param nologin   if false (default) and the user is not logged in, an attempt ot log the 
     *                  user in will be made.  This may cause the browser to be redirected 
     *                  to a login service.  If this value is true, redirection will not occur; instead, 
     *                  the anonymous identity will be set as the credentials.  
     */
    public getCredentials(nologin: boolean = false): Observable<Credentials> {
        if (this.isAuthenticated())
            return of(deepCopy(this._cred));

        return this.fetchCredentials(nologin).pipe(
            tap(c => this._cred = deepCopy(c))
        );
    }

    /**
     * fetch valid credentials.  These credentials may come from a remote authentication
     * service and may trigger a user log-in process.
     *
     * @param nologin   if false (default) and the user is not logged in, an attempt to log the 
     *                  user in will be made.  This may cause the browser to be redirected 
     *                  to a login service.  If this value is true, redirection will not occur; instead, 
     *                  the anonymous identity will be set as the credentials.  
     */
    public abstract fetchCredentials(nologin?: boolean): Observable<Credentials>;

    /**
     * redirect the browser to the authentication service, instructing it to return back to 
     * this application after the login process is complete.  
     * @param returnURL   the URL to redirect the browser to after a successful login to return to 
     *                    to the application.  If not provided, window.location.href will be used. 
     * @return boolean  True if the implementation issued a browser redirect; False, otherwise. 
     *                  This allows the caller to halt operations if redirection is imminent.  
     */
    public abstract loginUser(returnURL?: string): boolean;
}

/**
 * configuration data describing how to access the remote authentication service assembled in a 
 * single object.
 */
export interface AuthServiceAccessConfig {
    /**
     * the base URL for the remote authentication service
     */
    serviceEndpoint: string;

    /**
     * the base URL to redirect to when it is necessary to request that the user log in.  If
     * not provided, a default based on serviceEndpoint will be used.  It is expected that this
     * URL will require a second URL to be appended to it which represents the URL for gettting 
     * back to this application after a successful login.  This typically means that the loginURL
     * should include queryParameters where that last parameter is for the return URL and ends with 
     * an equal sign ("=").  
     */
    loginBaseURL?: string;

    /**
     * the URL that should be used to redirect the user back to the current application 
     * from the remote login service after a successful login.  If not provided, the current 
     * value of window.location.href will be used.  
     */
    returnURL?: string;
}

/**
 * the configuration part required by the AuthenticationService
 */
export interface AuthConfiguration extends Configuration {
    /**
     * the parameters describing how to access the remote authentication service
     */
    auth: AuthServiceAccessConfig;
}

/**
 * an implementation of the AutenticationService that caches metadata updates on the 
 * server via a web service.  
 *
 * This implementation is intended for use in production.  
 */
@Injectable({
    providedIn: 'root'
})
export class OARAuthenticationService extends AuthenticationService {

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
        try {
            return this.configSvc.getConfig<AuthConfiguration>().auth.serviceEndpoint;
        } catch (ex) {
            if (ex instanceof Error) 
                ex.message = "Incomplete auth configuration: missing 'serviceEndpoint' ("+ex.message+")";
            throw ex;
        }
    }

    /**
     * the URL the remote authorization service should redirect to to restart the application
     * after routing the browser user through the login service.  
     * @param returnURL   the URL that the login service should redirect to after a successful login
     *                    to return the browser to this application.  If not provided, the value
     *                    of window.location.href will be used.  
     */
    getLoginURL(returnURL?: string): string {
        let out : string|null|undefined = null;
        try {
            out = this.configSvc.getConfig<AuthConfiguration>().auth.loginBaseURL;
        } catch (ex) { }
        if (! out)
            out = this.endpoint + "saml/login?redirectTo=";
        if (! returnURL) {
            try {
                returnURL = this.configSvc.getConfig<AuthConfiguration>().auth.returnURL;
            }
            catch (ex) { }
        }
        if (! returnURL)
            returnURL = window.location.href;
        return out + returnURL;
    }

    /**
     * fetch valid credentials.  These credentials may come from a remote authentication
     * service and may trigger a user log-in process.
     *
     * @param nologin   if false (default) and the user is not logged in, an attempt to log the 
     *                  user in will be made.  This may cause the browser to be redirected 
     *                  to a login service.  If this value is true, redirection will not occur; instead, 
     *                  the anonymous identity will be set as the credentials.  
     * @param returnURL   the URL that the login service should redirect to after a successful login
     *                    to return the browser to this application.  If not provided, the value
     *                    of window.location.href will be used.  
     */
    public fetchCredentials(nologin: boolean = false, returnURL?: string): Observable<Credentials> {
        return this.fetchCredentialsFrom(this.endpoint).pipe(
            switchMap((c) => {
                console.log("Credentials fetched for "+c.userId);
                if (!nologin && ! AuthenticationService.authenticatedCreds(c))
                    // this will cause the browser to redirect to login service,
                    // terminating this application
                    if (this.loginUser(returnURL))
                        return EMPTY;
                return of(c);
            }),
            catchError((e) => {
                console.error("Credentials not available (status = "+e.status+")");
                if (e.status && e.status == 401) 
                    return this.handleUnauthenticated(!nologin, returnURL);
                return this.handleFetchError(e);
            })
        );
    }

    /**
     * fetch credentials for the currently logged in user from a given endpoint.  This will not 
     * attempt to log the user in.
     */
    public fetchCredentialsFrom(endpoint: string): Observable<Credentials> {
        if (!endpoint)
            throw new Error("Missing or empty authorization service endpoint URL");

        let url = endpoint;
        if (! url.endsWith('/')) url += '/';
        url += "auth/_tokeninfo";
        console.debug("Authentication request url: ", url);

        return this.httpcli.get(url).pipe(
            map<any, Credentials>(messageToCredentials)
        );
    }

    /**
     * handle the case where the remote service indicates that the user is not logged in.  This 
     * implementation will redirect the browser to the login site (via loginUser()) if requested;
     * otherwise, it returns anonymous credentials.
     * @param authReturnURL  if provided, the login process will be initiated; if this requires 
     *                       browser redirection, this parameter will be interpreeted as the 
     *                       URL to return to after completing the process.
     * @return Observable<Credentials> 
     */
    handleUnauthenticated(dologin: boolean, authReturnURL?: string) : Observable<Credentials> {
        if (dologin) 
            // this will cause the browser to redirect to login service,
            // terminating this application
            if (this.loginUser(authReturnURL))
                return EMPTY;
        return of(deepCopy(anonymousCreds));
    }

    /**
     * Handle the possible errors while fetching Credentials.  The error could be 
     * directly from the HTTP call (and is, thus, an HttpErrorResponse) or an error
     * occuring while processing the response (making it a simple Error).  This
     * implementation will interpret the type of error to report a helpful error message 
     * to the consult, and then reraise the error.
     * @param error The error object.
     * @returns an Observable returned by throwError()
     */
    handleFetchError(error: any) {
        if (error.status != undefined) {
            let message = null;
            if (error.status == 0) 
                message = "Authentication Client/Communiction Error: " + error.error
            else if (error.status >= 400 && error.status < 500) 
                message = "Authentication service reports: " + error.message +
                    "; incorrect service endpoint configuration?"
            else if (error.status > 500)
                message = "Authentication server error: " + error.message
            else
                message = "Unexpected Authentication service response: " + error.message
            console.error(message);
        }
        else 
            console.error("Failure processing Authentication service response: "+error);

        return throwError(error);
    }
                       
    /**
     * redirect the browser to the authentication service, instructing it to return back to 
     * the current landing page.  
     * 
     * @param returnURL the URL that the login service should redirect to after a successful login
     *                  to return the browser to this application.  If not provided, the value
     *                  of window.location.href will be used.  
     * @return boolean  True if the implementation issued a browser redirect; False, otherwise. 
     *                  This allows the caller to halt operations if redirection is imminent.  
     */
    public loginUser(returnURL?: string): boolean {
        let loginURL = this.getLoginURL(returnURL);
        console.log("To login user, redirecting to " + loginURL);
        window.location.assign(loginURL);
        return true;
    }
}

/**
 * An AuthService intended for development and testing purposes which simulates interaction 
 * with a authorization service.  
 *
 * This implementation does not contact any remote service.  Instead, this service is provided 
 * with the user identity information representing the authenticated user at construction time.  
 */
@Injectable({
    providedIn: 'root'
})
export class MockAuthenticationService extends AuthenticationService {

    private _fakeCred: Credentials = {
        userId: "anon",
        userAttributes: { userName: "John", userLastName: "Public" },
        token: 'fake jwt token'
    }

    /**
     * construct the authorization service
     *
     * @param userid     the ID of the user; default "anon"
     */
    constructor(@Optional() @Inject(MOCK_CREDENTIALS) userCred: Credentials) {
        super();
        if (userCred)
            this._fakeCred = userCred;
    }

    /**
     * fetch valid credentials.  
     *
     * This implementation just returns the fake credentials set at construction time
     *
     * @param nologin   if false (default) and the user is not logged in, an attempt to log the 
     *                  user in will be made.  This may cause the browser to be redirected 
     *                  to a login service.  If this value is true, redirection will not occur; instead, 
     *                  the anonymous identity will be set as the credentials.  
     */
    public fetchCredentials(nologin: boolean = false): Observable<Credentials> {
        return of(this._fakeCred);
    }
    
    /**
     * redirect the browser to the authentication service, instructing it to return back to 
     * this application after the login process is complete.  
     *
     * This implementation does nothing.
     */
    public loginUser(returnURL?: string): boolean {
        if (! returnURL)
            returnURL = window.location.href;
        window.location.assign(returnURL);
        return true;
    }
}


