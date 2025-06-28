import { AnyObj } from './types';

/**
 * A wrapper class around data stored in a hierarchical object that eases access.  It provides two 
 * key features:
 *  * a get() function for accessing items deep in the hierarcy via dot-delimited name
 *  * the ability to specify a default if the parameter is not set.
 */
export class NamedParameters {

    data: AnyObj;
    _defs: NamedParameters|null = null;

    /**
     * wrap a data object
     * @param params     the data object to wrap
     * @param defParams  a data object that provides default values to return if a parameter 
     *                   is not set in params _and_ a default is not provided to the get()
     *                   function.  
     */
    constructor(params: AnyObj, defParams?: AnyObj) {
        this.data = params;
        if (defParams)
            this._defs = new NamedParameters(defParams);
    }

    /**
     * get hierarchical values by name with an option to request a default value.  
     * 
     * This function accomplishes two things:  first, it provides a bit of syntactic 
     * sugar for getting at deep values in the parameter hierarchy.  That is, 
     * `params.get("links.orgHome")` is equivalent to `params.data["links"]["orgHome"]`.  
     *
     * The second bit of functionality is the optional parameter that allows the caller 
     * to set the default value to return if the value is not set.  If the stored value
     * is null or undefined, the default value is returned.  
     * 
     * @param param    the name of the desired parameter
     * @param default  the default value to return if a parameter with the given name
     *                 is not set or is null.  This overrides any default set at 
     *                 construction time.  Do not set or set to undefined to explicity 
     *                 defer to a construction-time default.
     */
    get<T>(param: string, defval?: T | null): T | null | undefined {
        let names: string[] = param.split(".");
        let val: any = this.data;
        for (var i = 0; i < names.length; i++) {
            if (typeof val != "object") {
                val = null;
                break;
            }
            val = val[names[i]];
        }
        if (val == null || val == undefined) {
            if (defval == undefined && this._defs)
                defval = this._defs.get(param);
            val = defval;
        }
        return val;
    }
}

export { AnyObj }
