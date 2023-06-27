import { InjectionToken } from '@angular/core';

/**
 * information describing the release of the deployed Angular application
 */
export interface ReleaseInfo {
    /**
     * the name of the Angular application
     */
    component: string;

    /**
     * the name of the software package (i.e. software repository) providing this Angular application
     */
    package: string;

    /**
     * the version, tag, or branch of the software package that this application was built from
     */
    version: string;
}

export interface Configuration {
    /**
     * an object describing the release/version of this software
     */
    componentRelease?: ReleaseInfo;

    /**
     * the version of the system that this component was deployed as.  
     */
    systemVersion?: string;

    /**
     * other parameters are allowed
     */
    [paramName: string]: any;
}

export const RELEASE_INFO = new InjectionToken<ReleaseInfo>('release-info');
export const CONFIG_URL = new InjectionToken<string>('config-url');
