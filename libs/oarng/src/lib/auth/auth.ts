import { InjectionToken } from '@angular/core';

/**
 * a container for information describing the user logged into the application.
 */
export interface UserAttributes {

    /**
     * the user's given name
     */
    userName ?: string;

    /** 
     * the user's family name
     */
    userLastName ?: string;

    /**
     * the user's email address
     */
    userEmail ?: string;

    /**
     * the user's group
     */
    userGroup ?: string;

    /**
     * the user's division
     */
    userDiv ?: string;

    /**
     * the user's division number
     */
    userDivNum ?: string;

    /**
     * the user's organizational unit
     */
    userOU ?: string;

    /**
     * other attributes are allowed
     */
    [paramName: string]: any;
}

/**
 * an object provided to applications indicating that the user is authenticated.  The user should be 
 * considered unauthenticated if there is no token or if the current time is later than the 
 * expires value. 
 */
export interface Credentials {

    /** 
     * the unique user identifier that the user logged in as
     */
    userId : string;

    /**
     * attributes describing the user with the above identifier
     */
    userAttributes : UserAttributes;

    /**
     * authentication token that can be used to connect with other services requiring authentication.
     * In the OAR context, this is typically a JSON Web Token (JWT), but it is not required to be.
     * It is intended, for example, to be presented as a Authorization Bearer token in HTTP requests 
     * to the services.
     */
    token? : string|null;

    /**
     * the UTC date when these credentials (specifically, the token) are no longer valid.  If there 
     * is such an expiration time, it should be encoded into the token as well for evalution by services 
     * requiring it.  An application may evaluate this time to determine if re-authentication is necessary.
     */
    expires? : Date;

    /**
     * The UTC date when the authenticated session started as marked by the creation of the above token.
     * Applications may use this value to manage the session independently of the token's expiration date.
     * This value, if set, should also be encoded into the token.
     */
    since? : Date;

    /**
     * other attributes are allowed
     */
    [paramName: string]: any;
}

/**
 * part of the OAR Authentication web service message format providing the unencoded user information
 */
export interface UserDetails extends UserAttributes {

    /** 
     * the unique user identifier that the user logged in as
     */
    userId : string;
}

/**
 * the OAR Authentication web service message format for retrieving authentication information
 */
export interface AuthInfo {

    userDetails : UserDetails;

    /**
     * the authentication token
     */
    token? : string;

    /**
     * the epoch date when these credentials (specifically, the token) are no longer valid.  
     */
    expires? : number;

    /**
     * the epoch date when these credentials (specifically, the token) are no longer valid.  
     */
    since? : number;

    [prop: string]: any;
}

/**
 * convert an OAR authentication web service message to a Credentials object
 */
export function messageToCredentials(message: AuthInfo) : Credentials {
    let out : Credentials = {
        userId: message.userDetails.userId,
        userAttributes: deepCopy(message.userDetails)
    }
    if (out.userAttributes['userId'])
        delete out.userAttributes['userId']
    if (message.token)
        out.token = message.token;
    if (message.token)
        out.token = message.token;
    if (message.expires)
        out.expires = new Date(message.expires);
    if (message.since)
        out.since = new Date(message.since);

    for (const prop in message) {
        if (! out.hasOwnProperty(prop) && prop != "userDetails")
            out[prop] = deepCopy(message[prop])
    }

    return out;
}

/**
 * create a deep copy of an object
 */
export function deepCopy(obj: any): any {
    // this implementation comes courtesy of and with thanks to Steve Fenton via
    // https://stackoverflow.com/questions/28150967/typescript-cloning-object/42758108
    var copy: any;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = deepCopy(obj[attr]);
        }
        return copy;
    }
 
    throw new Error("Unable to copy obj! Its type isn't supported.");
}

export const MOCK_CREDENTIALS = new InjectionToken<Credentials>('mock-credentials');
