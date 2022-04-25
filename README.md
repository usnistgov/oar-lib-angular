# OAR Common Angular Library (oar-lib-angular)

[![main branch status](https://github.com/usnistgov/oar-lib-angular/actions/workflows/main.yml/badge.svg)](https://github.com/usnistgov/oar-lib-angular/actions/workflows/main.yml) | 
[![integration branch status](https://github.com/usnistgov/oar-lib-angular/actions/workflows/integration.yml/badge.svg)](https://github.com/usnistgov/oar-lib-angular/actions/workflows/integration.yml)

This repository provides Angular modules that can be shared across multiple Angular applications
supporting the NIST Open Access to Research (OAR) program, specifically the publishing of NIST
research.  This repository is usually included as a submodule in other repositories dedicated to
particular applications; these currently include: 
  * oar-midas-portal -- providing the NIST-internal portal site that serves as a gateway to various
    activities related to research publishing.
  * oar-pdr-angular -- applications related to publishing digital, non-literature assets (namely,
    data and software).  This includes:
      * pdr-lps -- the Landing Page Service application that provides public publication landing
        pages
      * midas-author -- the application for creating a data or software publication

As software based on the the [Angular](https://angular.io/) application framework, the code is
written primarily in [Typescript](https://typescriptlang.org).

## Contents

```
libs/oarng --> Angular library containing re-usuable modules
demos/     --> Standalone applications that demonstrate some of the reusable modules
scripts/   --> Tools for running the demonstrations and running all tests
oar-build/ --> general oar build system support (do not customize)
docker/    --> Docker containers for building and running tests
.github/   --> GitHub repository configuration, including CI scripts for GitHub Actions
CODEOWNERS --> A listing of contacts, administrators, and contributors for this repository
LICENSE.md --> A statement of rights and responsibilities for use and copying of this software
```

## Prerequisites

Software in this repository is built using the [Angular](https://angular.io/) application framework
(v13), and, thus, is built and run using `nodejs` and `npm`.  Both become available to your
development environment when you install,

  * node 14.19.0 or higher

All prerequisite Javascript modules needed are provided via the `npm` build tool.  See
`package.json` for a listing of primary dependencies and `package-lock.json` for a
complete listing of all dependencies.

### Acquiring prerequisites via Docker

As an alternative to explicitly installing prerequisites to run the tests, the `docker` directory
contains scripts for building a Docker container with all prerequites installed in a properly
configured environment.  Running the `docker/run.sh` script will build the containers (caching them
locally), start the container, and put the user in a bash shell in the container.  From there, one
can run applications or tests.

The `scripts` directory also includes scripts that will launch Docker containers to build the
software (`makedist.docker`) and run tests (`testall.docker`).

To use these scripts and containers, Docker must be installed separately.  

## Building and Testing the software

As a standard OAR repository, it includes simple language-independent tools for building and testing
the software without special knowledge of Typescript or Angular (assuming all prerequisites have
been installed first); these are described in the section
["Simple Building and Testing with OAR Tools"](#simple-building-and-testing-with-oar-tools).

Developers, on the other hand, primarily use the native tools (`npm`) to build and test as described
in ["Building and Testing Using Native Tools"](#building-and-testing-using-native-tools).  

### Simple Building and Testing with OAR Tools

As a standard OAR repository, the software products can be built by simply via the `makedist`
script, assuming the prerequisites are installed:

```
  scripts/makedist
```

The built products will be written into the `dist` subdirectory (created by the `makedist`); each
will be written into a zip-formatted file with a name formed from the product name and a version
string.

The individual products can be built separately by specifying the product name as arguments, e.g:

```
  scripts/makedist oarng
```

Additional options are available; use the `-h` option to view the details:

```
  scripts/makedist -h
```

The `testall` script can be used to execute all unit and integration tests:

```
  scripts/testall
```

Like with `makedist`, you can run the tests for the different products separately by listing the
desired product names as arguments to `testall`.  Running `testall -h` will explain available
command-line options.


### Building and Testing Using Native Tools

The `npm` tool can be used in the standard way for [Angular projects](https://angular.io/docs) to
build and test this software.

To install the Typescript compiler and all required Javascript modules, type:
```
  npm install
```

This only needs to be done ncec, unless dependencies (as recorded in the `package.json` file) change.

To build the library, type:
```
  npm run build
```

The above command (which is a shortcut for `npm run build oarng`) just builds the library
and installs it into the `dist/oarng` directory.  To build one of the demo applications,
specify the demo app name on the build command line:
```
  npm run build wizard-demo
```

To run the unit tests for both the library and the demos, type:
```
  npm test
```

## Developing the Library

This repository was set as a [multi-project Angular
workspace](https://angular.io/guide/file-structure#multiple-projects) in order to host
multiple libraries and demo applications.  The OARng libary (under `libs/oarng`) was
[created as a library using the Angular CLI tool](https://angular.io/guide/creating-libraries).  
Developers should consult the [Angular documentation on libaries](https://angular.io/guide/libraries)
for more information on how libraries are different from applications.

To add a new module to the library:
  1.  Create a new module directory under `libs/oarng/src/lib`
  2.  Copy in Angular class files contianing reusable Components, Services, Directives and
      Interfaces.
  3.  Create a module file (e.g. `mymod.module.ts`) in that directory for importing the
      classes as a whole.
  4.  Expand and validate the unit tests
  5.  Add all exportable classes to the `libs/oarng/src/public-api.json`

## Using the Library

To use the OARng library, it must be built first:
```
  npm run build
```
which installs the library into `dists/oarng`.

This library can be used in another Angular project, by adding this directory as a
dependency in that other project's `package.json` file.  For example, the `package.json`
file in the [oar-pdr-angular](https://github.com/usnistgov/oar-pdr-angular), which
includes this repo as a submodule, includes the following in its `package.json` file:
```
  "dependencies": {
     ...
     "oarng": "../lib/dist/oarng",
     ...
  }
```

Running `npm install` in the importing project will install the library into its
`node_modules` cache.  

## Repository Administration

Please see [`LICENSE.md`](LICENSE.md) for the current licensing statements.  Software in this
repository is open-source and held in the public domain.

### Contacts

The administrators of this repository include:

  * Gretchen Greene (gretchen.greene@nist.gov)
  * Jon Zhang (.zhang@nist.gov)
  * Ray Plante (raymond.plante@nist.gov)
  * Christopher David (christopher.davis@nist.gov)

