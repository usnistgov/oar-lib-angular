# Staff Directory Service

This module provides a client service front-end to the OAR1 version of the staff directory
service that is built into the MIDAS DBIO web service suite.  This version is not compatible 
with the NIST Staff Directory (NSD) service; rather, its API is optimized for use with the
OAR Angular front-end applications.  In particular this service provides an indexing feature
that can be used to provide real-time completion suggestions based on a few characters typed
by the user.

The Angular front-end service, `StaffDirectoryService`, provides the staff directory
information to an Angular application, communicating with the backend service efficiently.
As of this writing, it does not provide access to all the backend capabilities, but this
could be added in the future.  

#### Table of Contents

- [Using the `StaffDirectoryService`](#using-the-staffdirectoryservice)
  - [Update Your Configuration Data](#update-your-configuration-data)
  - [Import the `StaffDirModule`](#import-the-staffdirmodule)
  - [Inject `StaffDirectoryService` along side of the `AuthenticationService`](#inject-staffdirectoryservice-along-side-of-the-authenticationservice)
  - [Set the Autentication Token](#set-the-autentication-token)
  - [Inject `StaffDirectoryService` Where You Need Suggestions](#inject-staffdirectoryservice-where-you-need-suggestions)
  - [Request an Index Asynchronously](#request-an-index-asynchronously)
  - [Look Up Full Record When User Selects a Suggestion](#look-up-full-record-when-user-selects-a-suggestion)
- [Running with a Backend Server](#running-with-a-backend-server)
  - [Configuring For Use With `oar-docker`](#configuring-for-use-with-oar-docker)
  - [Configuring for a Stand-Alone MIDAS Server](#configuring-for-a-stand-alone-midas-server)
- [Use Cases](#use-cases)
  - [Provide User with Suggestions of Matching People or
     Organizations](#provide-user-with-suggestions-of-matching-people-or-organizations)
  - [Resolving a Suggestion to a Hierarchy of
     Organizations](#resolving-a-suggestion-to-a-hierarchy-of-organizations)
- [Testing with `StaffDirectoryService`](#testing-with-staffdirectoryservice)

## Using the `StaffDirectoryService`

This section describes how to integrate `StaffDirectoryService` into an application and use
it within a component.  Consult also with the [people-service demo
application](../../../../../demos/people-service) that illustrates its use in action.

The staff directory service that runs as part of the MIDAS DBIO requires a JWT token to use.
Consequently, the `StaffDirectoryService` must be used in conjunction with the
[`AuthenticationService`](../auth/README.md).  In particular, one must provide the token
retrieved from the `AuthenticationService` to the `StaffDirectoryService` instance via its
`setAuthToken()` function.  

(For simplicity, [people-service demo application](../../../../../demos/people-service) does
not require an authentication token; see its
[README.md document](../../../../../demos/people-service/README.md) for more details.)

### Update Your Configuration Data

The `StaffDirectoryService` has a dependency on the [`ConfigurationService`](../config/README.md)
because it needs to know the URL for the back-end service; thus, you should add this
information to your configuration data.  In particular, add this `staffdir` property:

```javascript
   "staffdir": {
       "serviceEndpoint":  "http://localhost:9091/midas/nsd/oar1",
       "requireAuthToken": true
   }
```

(See the section [](#below) below for running a backend server for development.)

### Import the `StaffDirModule`

The `StaffDirModule`, which defines the `StaffDirectoryService`, can be imported either in
the root app module (`app.module.ts`) or in a more specific module or component where it will
be used.  Because of the service's need for an authentication token, it is recommended that
the module be imported in the same module or comonent where the `AuthModule` is imported.  

Thus, the import looks like this:

```javascript
import { StaffDirModule, AuthModule } from 'oarng';

@NgModule({
   ...
   imports: [
      ...
      AuthModule,
      StaffDirModule
   ]
})
```

(In [demo app](../../../../../demos/people-service), this is added in the `app.module.ts`
file.)

### Inject `StaffDirectoryService` along side of the `AuthenticationService`

In the component (or service) class where you use the `AuthenticationService` to obtain a
token, add `StaffDirectoryService` as an injected dependency along side of it by adding it to
service/component class's constructor:

```javascript
import { AuthenticationService, StaffDirectoryService } from 'oarng';

@Component({
    ...
})
export class MyComponent {
    ...
    constructor(private authsvc: AuthenticationService,
                private sdsvc: StaffDirectoryService, ...)
    { ... }
    ...
}
```

### Set the Autentication Token

In the same class where you added `StaffDirectoryService` as a dependency along with
'AuthenticationService' is where you provide the authentication token to it.  In the code
where you retrieve authentication credentials, add a call to the
`StaffDirectoryService.setAuthToken()` function:

```javascript
    this.authsvc.getCredentials().subscribe(
      creds => {
         ...
         if (creds.token) {
             this.authToken = creds.token
             this.sdsvc.setAuthToken(creds.token)
         }
         ...
      }
      ...
    );
```


### Inject `StaffDirectoryService` Where You Need Suggestions

You will use the `StaffDirectoryService` within the component where you want to display
suggestions from the staff directory.  (In [demo app](../../../../../demos/people-service),
this would be in the `selectperson.component.ts` file.)  In addition to importing the
`StaffDirectoryService` class, you will also want `SDSuggestion` and `SDSIndex`.  Enable
service injection by adding the `StaffDirectoryService` class to the constructor:

```javascript
import { SDSuggestion, SDSIndex, StaffDirectoryService } from 'oarng';

@Component({
    ...
})
export class MyInputComponent {

    index: SDIndex|null = null;
    suggestions: SDSuggestions[] = []
    selectedSuggestion: SDSuggestion|null = null;
    selectedRec: any = null;

    constructor(private sdsvc: StaffDirectoryService) {
       ...
    }
    ...
}
```

### Request an Index Asynchronously

To offer suggestions, your component will need to capture text that the user enters as they
enter it.  Once 2 or 3 characters have been typed, use either the `getPeopleIndexFor()` or
`getOrgsIndexFor()` method to retrieve an index:

```javascript
   if (typed.length >= 2) {
      if (! this.index) {
          this.sdsvc.getPeopleIndexFor(typed).subscribe(
             idx => {
                 // save it to use with subsequent typing
                 this.index = idx;
                 if (this.index != null) {
                     // pull out the matching suggestions
                     this.suggestions = (this.index as SDSIndex).getSuggestions(typed);
                 }
             },
             ...
          );
      }
      else {
          // we already have a downloaded index; just pull out the matching suggestions
          this.suggestions = (this.index as SDSIndex).getSuggestions(typed);
      }
   }
   else if (this.index) {
       // if the input was cleared, clear out our index and suggestions
       this.index = null;
       this.suggestions = [];
   }
```

In the example above, `this.suggestions` is an array of completion suggestions that match
what was typed.  Each `SDSuggestion` in the array has a `display` property that provides a
string that you can show the user as a representation of a person or organization that can be
selected.  

(See also [`selectperson.component.ts` in the demo app](../../../../../demos/people-service).)

### Look Up Full Record When User Selects a Suggestion

When the user selects a provided suggestion, your component should capture that selection
into `this.selectedSuggestion` field and then retrieve the record using its `getRecord()`
method:

```javascript
    this.selectSuggstion.getRecord().subscribe(
       rec => {
           this.selectedRec = rec;
       },
       ...
    );
```

(See also [the `showFullRecord()` method in `selectperson.component.ts` within the demo
app](../../../../../demos/people-service).)

## Running with a Backend Server

Whether you are running the [demo app](../../../../../demos/people-service) or doing
front-end development using the `StaffDirectoryService`, you will need to run a backend
server that provides the staff directory API.  For MIDAS front-end development, this means
running a MIDAS (DBIO) server.  There are two ways to accomplish this: running the full MIDAS
system locally under `oar-docker`, or running a stand-alone MIDAS server (provided in the
[`oar-pdr-py` repository](https://github.com/usnistgov/oar-pdr-py)).

### Configuring For Use With `oar-docker`

_Note: this section applies to NIST developers only._

Running a MIDAS server locally as part of `oar-docker` has the advantage that it provides an
authentication service as well, allowing you to naturally test the use of an authentication
token.

To avoid problems site certificate validation, it is recommended that you set your front-end
configuration to talk directly to the MIDAS DBIO container without going through the
reverse-proxy server.  To do this, set your endpoint configuration as follows:

```javascript
staffdir: {
    "serviceEndpoint":  "http://localhost:9091/midas/nsd/oar1"
    "requireAuthToken": true
}
```

After the MIDAS system is up, you can start your front-end app using `npm`.

### Configuring for a Stand-Alone MIDAS Server

Alternatively, you can provide your front-end with a backend service by running the
stand-alone MIDAS server that comes with 
[`oar-pdr-py`](https://github.com/usnistgov/oar-pdr-py).  Consult the server
[README](https://github.com/usnistgov/oar-pdr-py/blob/integration/docker/midasserver/README.md)
for details on how to run the server.  Be sure to start the server with the `-P` option to
ensure that the staff directory API is included.

To talk to this server, set your configuration as follows:

```javascript
staffdir: {
    "serviceEndpoint":  "http://localhost:9091/nsd/oar1"
    "requireAuthToken": false
}
```

Even though the server, when you run it stand-alone in this way, does not require an
authentication token, you will still need to have an `AuthenticationService` in your
application.  To deal with this, you can either:
  * also run a stand-alone authentication server (provided by
    ['oar-auth-py'](https://github.com/usnistgov/oar-auth-py)), 
  * "hard-wire" a static token into your app for development purposes (such a token is
    available from [`oar-pdr-py` in the file
    `docker/midasserver/xytoken`](https://github.com/usnistgov/oar-pdr-py/blob/integration/docker/midasserver/xyztoken.txt)), or
  * Run your front-end using the `MockAuthenticationService`.

The last option is the easiest thing to do.  In the module or component provider where you
request an `AuthenticationService`, ask for it like this:

```javascript
providers: [
   { provide: AuthenticationService, useClass: MockAuthenticationService }
],
```

## Use Cases

This section covers some of the common use cases the OAR MIDAS front-ends have for accessing
people and organization information.  This repo includes a
[demonstration app](../../../../../demos/people-service) that illustrates most of these use
cases.  It leverages the PrimeNG component `AutoComplete` which can be used to offer
suggestions for completing a value to go into a text input box.  

### Provide User with Suggestions of Matching People or Organizations

This is the use case that is addressed via the integration instructions above.  The
`StaffDirectoryService` addresses this use case with three logical steps:

  1. use `StaffDirectoryService.getPeopleIndexFor()` (or `getOrgsIndexFor()`) to request an
     index (`SDIndex`) for records that match 2 or 3 characters.
  2. extract suggestions (`SDSuggestion[]`) from the index based on the text typed so far via
     `SDIndex.getSuggestions()`.
  3. Resolve the user's selection into the full detailed record by calling the selected
     `SDSuggestion.getRecord()`.

### Resolving a Suggestion to a Hierarchy of Organizations

There are two variations on this use case.  In the first, user selects a person from the
suggestions, and now the application wants all the records for the organizations they are a
member of.  This can be addressed with `StaffDirectoryService` by passing the person
identifier (a number) to the `StaffDirectoryService.getOrgsFor()` method.

The other variation is that the user selects an organization from the suggestions, and now
the application wants all the records for the organizations that contain the selected one
(e.g. if a group was selected, the application wants the data for the group as well as
the division and OU enclosing it).  This can be addressed with `StaffDirectoryService` by
passing the organization identifier to the `StaffDirectoryService.getParentOrgs()` method.

## Testing with `StaffDirectoryService`

_edits in progress_

