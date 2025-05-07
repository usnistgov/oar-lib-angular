# Oarng

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.0.

## Code scaffolding

Run `ng generate component component-name --project oarng` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project oarng`.
> Note: Don't forget to add `--project oarng` or else it will be added to the default project in your `angular.json` file. 

## Using header

There are two type of headers: one for public side and one for MIDAS side. Public side header does not handle user info while MIDAS side does.

Public side header uses selector `<app-header-pub>` and takes four parameters: appVersion, headLn1, headLn2 and homeButtonLink.

MIDAS side header uses selector `<app-header>` and takes five parameters: appVersion, headLn1, headLn2, showUserIcon and homeButtonLink.

```
appVersion - the version of the current application.
headLn1 - this is the first line of text right next to the NIST logo. Will be converted to upcase.
headLn2 - this is the second line of text right next to the NIST logo. Will be converted to upcase.
showUserIcon (MIDAS side only) - this is the switch that allow user to turn on/off the user icon. By default it's on (true).
homeButtonLink - this is the URL of the home hutton. If provided, the home hutton will show up to the left side of the top-right menu. Otherwise the home button will be hidden.
```
Both headers allow the calling component to add a custom menu next to the home nutton. The menu content must use class name "custom-navbar".

HTML code example:
```
<app-header-pub 
    [appVersion]="appVersion" 
    titleLn1="MIDAS" 
    titleLn2="DATA Publishing"
    [homeButtonLink]="homeButtonLink">

    <div class="custom-navbar">
        <a href="/pdr/about" target="_blank"><b style="color: white !important;">About</b></a> |
        <a href="" target="_blank" style="color: white !important;"><b>Help</b></a> |
        <a href="" target="_blank" style="color: white !important;"><b>Search</b></a> |
        <a href="/datacart/global_datacart" target="_blank" style="color: white !important;"><b>Cart</b><i
            class="faa faa-shopping-cart faa-1x"></i><span
            class="w3-badge badge-notify">{{cartLength}}</span></a>
    </div>
</app-header-pub>
```

```
<app-header 
    [appVersion]="appVersion" 
    titleLn1="MIDAS" 
    titleLn2="DATA Publishing"
    [showUserIcon]="showUserIcon"
    [homeButtonLink]="homeButtonLink">
    
    <div class="custom-navbar">
        <a href="/pdr/about" target="_blank"><b style="color: white !important;">About</b></a> |
        <a href="" target="_blank" style="color: white !important;"><b>Help</b></a> |
        <a href="" target="_blank" style="color: white !important;"><b>Search</b></a> |
        <a href="/datacart/global_datacart" target="_blank" style="color: white !important;"><b>Cart</b><i
            class="faa faa-shopping-cart faa-1x"></i><span
            class="w3-badge badge-notify">{{cartLength}}</span></a>
    </div>
</app-header>
```

This will display the version whose value stored in variable "appVersion".
The text next to the NIST logo will display like this:
```
MIDAS
DATA PUBLISHING
```
The right side of the top bar will display like this:
🏠  About | Help | Search | Cart 🛒 | 👤[last name], [first name]


## Using footer

Footer does not take any parameter.

HTML code example:
```
<app-footer></app-footer>
```

## Build

Run `ng build oarng` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build oarng`, go to the dist folder `cd dist/oarng` and run `npm publish`.

## Running unit tests

Run `ng test oarng` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
