/**
 * a container for information describing the user logged into the application.
 */
export interface UserDetails {

    // TODO: check this documentation against the documentation of the customization service
    
    /** 
     * the user name that the user used to log in with at the authentication service
     */
    userId : string,

    /**
     * the user's given name
     */
    userName ?: string,

    /** 
     * the user's family name
     */
    userLastName ?: string,

    /**
     * the user's email address
     */
    userEmail ?: string,

    /**
     * the user's group
     */
    userGroup ?: string,

    /**
     * the user's division
     */
    userDiv ?: string,

    /**
     * the user's division number
     */
    userDivNum ?: string,

    /**
     * the user's 
     */
    userOU ?: string
}


/**
 * a container for information describing the update detail info.
 */
export interface UpdateDetails {
    
    /**
     * User info who made the update
     */
    userDetails: UserDetails;

    /**
     * Update date
     */
    _updateDate: string;
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