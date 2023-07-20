# Common Authentication Service

Some of the OAR front-end applications--namely, the various MIDAS Angular front-ends--need to authenticate
the user before allowing them to create or update any assets.  In particular, such an applcation needs to:
   * Send the user through a login process that proves who they are,
   * Access the user's identifier and other personal attributes (name, division, email address, etc.), and
   * Obtain an authenticated token that the application can pass on to other services.

In systems where it's needed (like the MIDAS system), the OAR infrastructure provides a dedicated
authentication service that can help manage these activities.  The OAR authentication service would
typically collaborate with an institutional authentication service that can log a user in and then
provide information about the now authenticated user.  Typically, logging into a browser-based
application using a standard protocol (like SAML or OpenID) involves redirecting the browser to separate
server that hosts the login page and process, and then, upon a successful login, redirecting back to the
application.

This module provides an Angular front-end counterpart, an [`AuthenticationService`](./auth.service.ts), to
the remote authentication service.  The [`AuthenticationService`](./auth.service.ts) hides many of the
details of regarding how to log the user in while providing the user information and authentication token
it needs to operate on behalf of a user.  The [`AuthenticationService`](./auth.service.ts) requires some
specific configuration data to operate; thus, it is dependent on the _oarng_
[`ConfigurationService`](../config/config.service.ts).  Using an
[`AuthenticationService`](./auth.service.ts), one can accomplish all of the above three actions with one
method call returning a [`Credentials`](auth.ts) object.

#### Table of Contents

- [Using the `AuthenticationService`](#using-the-authenticationservice)
  - [Import the `AuthModule`](#import-the-authmodule)
  - [Add Authentication Parameters to your Default Configuration File](#add-authentication-parameters-to-your-default-configuration-file)
  - [Make `AuthenticationService` an Injectable Dependency](#make-authenticationservice-an-injectable-dependency)
  - [Retrieve a `Credentials` Instance Where Needed](#retrieve-a-credentials-instance-where-needed)
- [Using the Authentication Token](#using-the-authentication-token)
- [Using a Mock Instance in Unit Tests](#using-a-mock-instance-in-unit-tests)

## Using the `AuthenticationService`

### Import the `AuthModule`

To make use of the [`AuthenticationService`](./auth.service.ts) to authenticate the user, the
[`AuthModule`](./auth.module.ts) should be imported into at least one of the application's modules.
Because authentication typically must occur before the application can do anything for the user, the
import is usually done via the root application module in `app.module.ts`; however, this is not a
requirement.  Regardless, the import would look like this:

```javascript
import { NgModule } from '@angular/core';
import { AuthModule } from 'oarng';

@NgModule({
    imports: [ ConfigModule ],
    declarations:  [ MyComponent ],
    providers: [
       AppComponent,  // a component that requires information about the logged-in user
       MyService,     // a service that needs an authentication token to talk to another backend service
    ]
});
export class MyModule { }
```

Note that importing the [`AuthModule`](./auth.module.ts) transparently imports
[`ConfigModule`](../config/config.module.ts) as well.  If you also want access to software version
information (see [the ConfigModule README](../config/README.md)), include the provider for the
`RELEASE_INFO` injection token in your `app.module.ts` as well.

### Add Authentication Parameters to your Default Configuration File

Assuming your application requires its own specialized configuration data, you have probably already [set
up your default configuration](../config/README.md) in a file called `assets/config.json`.  To support
your [`AuthenticationService`](./auth.service.ts), you will need to add an `auth` parameter which is an
object containing at a minimum a `serviceEndpoint` sub-parameter:

```javascript
{
   ...
   "auth": {
       "serviceEndpoint": "http://localhost:4300/"
   }
}
```

The `auth` object supports two additional but optional parameters:
   * `loginBaseURL` -- the specific URL hosted by the remote authentication service that the
     browser should be redirected to in order to log the user in.  If not provided, a default
     based on the value of `serviceEndpoint` will be used.
   * `returnURL` -- the URL that the login page should redirect to after a successful login
     to return the user to your application.  If not provided, the value of `window.locaiton.href`
     will be used (which is usually what you want).

### Make `AuthenticationService` an Injectable Dependency

Add an [`AuthenticationService`](./auth.service.ts) argument to the constructor of any component that
wants to display information about the logged-in user.  If a component or service needs an authentication
token to make authenticated requests to another backend service (like the MIDAS DBIO service), add an
[`AuthenticationService`](./auth.service.ts) argument to its constructor as well.  Again, because you
typically want to authenticate the user early in the application lifecycle, you would handle this in the
`AppComponent` (defined in `app.component.ts`):

```javascript
import { Component } from '@angular/core';
import { AuthenticationService' } from 'oarng';

@Component({
    ...
})
export Class AppComponent {

    constructor(private authSvc: AuthenticationService, ...) {
        ...
    }
    ...
}
```

### Retrieve a `Credentials` Instance Where Needed

Any component or service that needs authentication information and has the
[`AuthenticationService`](./auth.service.ts) as a dependenty (via its constructor, as illustrated above)
can retrieve a [`Credentials`](auth.ts) object by calling the service's `getCredentials()` method, which
returns an `Observable`.  For a component, this would typically be called via its `ngOnInit()` method.
For example, you might cache the user's ID and authentication token for subsequent display and use:

```javascript
    ngOnInit(): void {
        ...
        this.authervice.getCredentials().pipe(
            // cache the user ID
            tap(c => {
                if (! c)
                    throwError(new Error("Authentication failed"));
                this.userId = c.userId;
            }),

            // cache the authentication token
            tap(c => {
                if (! c.token)
                    throwError(new Error("Authentication failed"));
                c => this.authtoken = c.token
            }),

            // continue with further component setup now that we know the
            // user is logged in
            ...

            catchError(e => {
                // handle possible errors including HTTP status 500.
                ...
                throwError(e)
            }
        );
    });
```

If the user is not logged in, the call to `getCredentials()` will automatically redirect the user to the
login page.  After a successful login, the browser will return the user back to your application.  Note
that the application restarts and re-initializes from the beginning, except this time when
`getCredentials()` is called, the user does not need to log in, and the Credentials are fetched and
returned asynchronously.

Note also that it is okay if multiple components or services call `getCredentials()`.  After the
[`AuthenticationService`](./auth.service.ts) fetches the `Credentials` the first time, it caches them
internally.  It will only re-fetch fresh `Credentials` if it notices that the previous instance has
expired.

## Using the Authentication Token

Typically, your Angular application needs to authenticate the user because it needs to make requests to
another backend service that requires authentication (such as the MIDAS DBIO service).  Your application
accomplishes this by sending with its request the token that is included in the `Credentials` object.
This token takes the form of a JSON Web Token, a standard for service-to-service authentication.

To use the token, include it as a "Bearer" token to the `Authorization` HTTP request header:

```javascript
    let hdrs = {
        ...  // what ever other headers you need
    };
    if (this.token)
        hdrs['Authorization'] = "Bearer "+this.token;

    this.httpClient.get(url, new HttpHeaders(hdrs)).pipe(
        ...
    );
```

(Import `HttpHeaders` from `@angular/http`.)

If the token is invalid, the backend service should return a 401 status, so be sure to handle that
possible error.  

## Using a Mock Instance in Unit Tests

The `AuthModule` also provides a mock implementation of an `AuthenticationService` called
[`MockAuthenticationService`](auth.service.ts) for use in unit tests
of components or services that require an `AuthenticationService`.  To use it, provide it to your
unit test's `TestBed` configuration:

```javascript
import { AuthenticationService, MockAuthenticationService } from 'oarng';

describe('...', () => {
    ...

    beforeEach(() => {
        TestBed.configureTestingModule({
            ...
            providers: [
                ...
                { provide: AuthenticationService, useClass: MockAuthenticationService },
                ...
            ],
            ...
    }
}
```

By default, calling `getCredentials()` on this mock service will always successfully return a
`Credentials` instance describing a fake user.  (The associated token is also fake, and not a
real JWT.)  You can override the default identity by providing your own `Credentials` instance as an
argument to the class's constructor.  For example:

```javascript
import { Credentials, AuthenticationService, MockAuthenticationService } from 'oarng';

let myFakeCreds: Credentials = {
    userId: "wash1",
    userAttributes: { userName: "George", userLastName: "Washington" },
    token: "fake token"
}

describe('...', () => {
    ...

    beforeEach(() => {
        TestBed.configureTestingModule({
            ...
            providers: [
                ...
                { provide: MOCK_CREDENTIALS, useValue: myFakeCreds },
                { provide: AuthenticationService, useClass: MockAuthenticationService,
                  dependencies: [ MOCK_CREDENTIALS ]  },
                ...
            ],
            ...
    }
}
```
