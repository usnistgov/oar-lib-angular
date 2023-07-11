# Common Configuration Service

It is typical for an Angular application to be driven by configuration data that can be customized at
run-time.  This data might include URL's to remote services or other web pages, or it might include
parameters describing how to retrieve an authentication token.  Different parts of the application may
require access to different pieces of the configuration.  And because the data should be set at run-time
and _not_ build-time, this data should be packaged with the application, but rather retrieved separately
from the application code itself.  It is useful, therefore, to have a service--i.e. a
`ConfigurationService`--that can be injected into components and other services that need access to
such data, all the while hiding the details of how the data was retrieved.

This module provide a service that provides OAR Angular applications with run-time-specific configuration 
data downloaded from the server independently of the application itself.  Through its use of the Angular
`APP_INITIALIZER` injection token, the configuration service is designed to automatically download the
configuration data before the application is fully initialized; this allows the application to access the
data via a _synchronous_ call.

The service is designed to require minimal setup (just import the module) to use; however, one can take
advantage of extra type safety and other features with a little extra setup.

#### Table of Contents

- [Using the `ConfigurationService` With Minimal Setup](#using-the-configurationservice-with-minimal-setup)
  - [Import the `ConfigModule`](#import-the-configmodule)
  - [Make `ConfigurationService` an Injectable
    Dependency](#make-configurationservice-an-injectable-dependency)
  - [Create a Default Configuration Data File](#create-a-default-configuration-data-file)
    - [Customizing the Configuration File Location](#customizing-the-configuration-file-location)
  - [Access Configuration Data as Needed](#access-configuration-data-as-needed)
- [Adding Type Safety (Recommended)](#adding-type-safety-recommended)
- [Including Access to Software Version Information](#including-access-to-software-version-information)
- [Extending the `ConfigurationService`](#extending-the-configurationservice)

## Using the `ConfigurationService` With Minimal Setup

### Import the `ConfigModule`

To enable automated fetching of configuration data via the [`ConfigurationService`](config.service.ts),
the [`ConfigModule`](config.model.ts) should be imported into at least one of the application's modules.
This can be either within each application's feature modules that need the configuration data (recommended
for making the module dependency explicit) or within the application's root module (`app.module.ts`).  In
either case, one global [`ConfigurationService`](config.service.ts) will get instantiated and shared
across the whole application.  The import would look somehting like this:

```javascript
import { NgModule } from '@angular/core';
include { ConfigModule } from 'oarng';

@NgModule({
    imports: [ ConfigModule ],
    declarations:  [ MyComponent ],
    providers: [
       MyService,      // some service that requires ConfigurationServie as a dependency
       MyComponent     // some component that requires ConfigurationServie as a dependency
    ]
});
export class MyModule { }
```

### Make `ConfigurationService` an Injectable Dependency

Add a [`ConfigurationService`](config.service.ts) argument to the constructor of any component or service
that needs access to configuration data.

```javascript
import { Component } from '@angular/core';
import { ConfigurationService' } from 'oarng';

@Component({
    ...
})
export Class MyComponent {

    constructor(private configSvc: ConfigurationService, ...) {
        ...
    }
    ...
}
```

### Create a Default Configuration Data File

Create a JSON file called `assets/config.json` to contain the default configuration data that you want
when you are running in development mode.  Its contents should a single JSON object whose properties are
the configuration parameters that your application needs.  An example might look like this:

```javascript
{
    "baseURL":    "http://localhost:4200/",
    "showSizes":  true
}
```

When your Angular application is served as part of an `oar-docker` system, the system will automatically 
replace this default file with a platform-specific version retrieved from the OAR configuration server.

#### Customizing the Configuration File Location

By default, [`ConfigurationService`](config.service.ts) will download the configuration from
`assets/config.json`.  To change this requires an addition to the `app.module.ts`.  Suppose you want to
change the location to `assets/environment.json`.  First, import the `CONFIG_URL` injection token:

```javascript
import { CONFIG_URL } from 'oarng';
```

Then, in the module's provider list, include the following:

```javascript
    { provide: CONFIG_URL, useValue: "assets/environment.json" },
```

Better yet, you could encode the location in the build-time files under `src/environments`:

```javascript
import { CONFIG_URL } from 'oarng';
import { environment } from './environments/environment.ts';

...

@NgModule({
    ...
    providers: [
        ...
        { provide: CONFIG_URL, useValue: environment.configURL },
        ...
    ]
    ...
})
```

### Access Configuration Data as Needed

After adding the [`ConfigurationService`](config.service.ts) as a dependency of a class (via its
constructor, as illustrated above), that class can now access the configuration data synchronously.
Suppose you need a parameter called `baseURL`, you can:

```javascript
    let baseURL = configSvc.getConfig()['baseURL'];
```

Note that this does not benefit from build-time type-checking.  In particular, you could accidentally
misspell the parameter name which would result in a runtime error rather that the more preferred
build-time error.  With a little more set up, you can ensure a bit more type safety, as explained in the
next section.

## Adding Type Safety (Recommended)

To attain a bit more type safety, you should define an interface that spells out exactly what parameters
your application expects.  To do this, create an importable file (say, `config-model.ts`) that contains
your interface definition:

```javascript
import { Configruation } from 'oarng';

export interface MyConfiguration extends Configuration {

    /**
     * the base URL to assume for this application
     */
    baseURL: string;

    /**
     * if true, file sizes will be displayed
     */
    showSizes: boolean;

    /*
     * Note: other parameters are allowed (as per the parent interface)
     */
}
```

In the above example, our application is expecting two parameters: `baseURL` and `showSizes`.
(Notice how we provided documentation explaining what they mean ;-) )

Now we can take advantage of this interface for improved type-safety.  In the components or services
that use the [`ConfigurationService`](config.service.ts), you should import your configuration model:

```javascript
import { MyConfiguration } form './config-model';
```

and then access parameters like this:
```javascript
    let baseURL = configSvc.getConfig<MyConfiguration>().baseURL;
```

If you misspell the parameter name, a build-time error will be raised.  If the configuration does not
include the `baseURL` parameter, a run-time error is raised when this line is executed, unless you mark
the parameter as optional (as in `baseURL? : string;`).  If your mark it as optional and it is not set,
then `baseURL` will contain `undefined`.  

## Including Access to Software Version Information

As you would see from examining the definition of the [base `Configuration` class](config.model.ts), this
module includes built-in support for accessing software version information.  There are two kinds of
software versions that are optionally accessible:

   * `componentRelease` -- an object that provides version information about your Angular application that
     includes `component` (the name of your Angular application), `package` (the repository that provides
     the application), and `version` (the version of the package release).

   * `systemVersion` -- the OAR-assigned version of the whole running system deployed via an `oar-docker` 
     setup.

All of this information is provided automatically by your OAR build system and the `oar-docker`
infrastructure; however, to access this information, you need to make an addition to the `app.module.ts`
file.  First, import the `RELEASE_INFO` injection token and the release data: 

```javascript
import { RELEASE_INFO } from 'oarng';
import { RELEASE } from './environments/release-info.ts';
```

Then, in the module's provider list, include the following:

```javascript
    { provide: RELEASE_INFO, useValue: RELEASE },
```

Afterwards, you should be able to access the `componentRelease` and `systemVersion` properties from
the [`ConfigurationService`](config.service.ts).

## Extending the `ConfigurationService`

You may want to extend the [`ConfigurationService`](config.service.ts) to add more specialized methods.
For an example of this, see the [`pdr-rpa-request`
application](https://github.com/usnistgov/oar-pdr-angular/tree/integration/pdr-rpa/pdr-rpa-request) and
its [specialized `ConfigurationSerivce`
class](https://github.com/usnistgov/oar-pdr-angular/blob/integration/pdr-rpa/pdr-rpa-request/src/app/service/config.service.ts).

