import { InjectionToken } from '@angular/core'

/**
 * Provide a function that returns the current Bearer token string.
 * In the portal: { provide: GROUPS_AUTH_TOKEN, useFactory: (c: CredentialsService) => () => c.token(), deps: [CredentialsService] }
 */
export const GROUPS_AUTH_TOKEN = new InjectionToken<() => string>('GROUPS_AUTH_TOKEN')
