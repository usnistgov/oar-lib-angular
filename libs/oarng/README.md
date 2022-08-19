# Oarng

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.0.

## Code scaffolding

Run `ng generate component component-name --project oarng` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project oarng`.
> Note: Don't forget to add `--project oarng` or else it will be added to the default project in your `angular.json` file. 

## Using header

Heaser takes three parameters: appVersion, headLn1 and headLn2.
``
appVersion - the version of the current application.
headLn1 - this is the first line of text right next to the NIST logo. Will be converted to upcase.
headLn2 - this is the second line of text right next to the NIST logo. Will be converted to upcase.
``

HTML code example:
``
<app-header [appVersion]="appVersion" titleLn1="MIDAS" titleLn2="DATA Publishing"></app-header>
``

This will display the version whose value stored in variable "appVersion".
The text next to the NIST logo will display like this:
``
MIDAS
DATA PUBLISHING
``

## Using footer

Footer does not take any parameter.

HTML code example:
``
<app-footer></app-footer>
``

## Build

Run `ng build oarng` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build oarng`, go to the dist folder `cd dist/oarng` and run `npm publish`.

## Running unit tests

Run `ng test oarng` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
