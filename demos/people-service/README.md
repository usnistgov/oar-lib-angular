# Demonstration: Provide User with Suggestions using the `StaffDirectoryService`

This demonstration application illustrates how to use a `StaffDirectoryService` to provide a
user with completion suggestions as they type into a text input box.  It leverages the
PrimeNG component, `AutoComplete`, which was designed expressly for this behavior.  The
`StaffDirectoryService` connects to a back-end service providing metadata descriptions of
people and organizations in the local enterprise org-chart; it is the service that provides
the suggestions to the `AutoComplete` component.

#### Table of Contents

- [Running the Demo Application](#running-the-demo-application)
  - [Running a Back-end Directory Service](#running-a-back-end-directory-service)
  - [Building and Starting the Application](#building-and-starting-the-application)
- [Troubleshooting](#troubleshooting)

## Running the Demo Application

### Running a Back-end Directory Service

To run this demo, you must run a back-end OAR staff directory service.  Two versions of a
stand-alone service are available in the
[`oar-pdr-py` repository](https://github.com/usnistgov/oar-pdr-py) repository:
`peopleserver`, which runs a directory service only, and `midasserver`, which runs the
entire MIDAS DBIO back-end including a directory service.  See the README documents in the
[`docker/peopleserver`](https://github.com/usnistgov/oar-pdr-py/blob/feature/people-service/docker/peopleserver)
and [`docker/midasserver`](https://github.com/usnistgov/oar-pdr-py/blob/feature/people-service/docker/midasserver)
directories, respectively, for further details in running the server.

You will need to adjust the demo app's configuration depending on which server your run.  The
configuration is set in the demo's [`src/assets/config.json`](src/assets/config.json) file.
If you run the `peopleserver`, the contents of this file should look like this:

```javascript
{
    "staffdir": {
        "serviceEndpoint": "http://localhost:9092/oar1"
    }
}
```

If you run the `midasserver`, set the contents to this:

```javascript
{
    "staffdir": {
        "serviceEndpoint": "http://localhost:9091/midas/nsd/oar1"
    }
}
```

### Building and Starting the Application

The application can be built using the `npm` tool by first building the `oarng` library:

```bash
npm install
npm run build oarng
npm run build-ps-demo
```

Next, after starting the staff directory service (described above), start the demo app:


```bash
npm run start-ps-demo
```

Finally after you see the "Compiles successfully" message, load the app into your browser by
visiting http://localhost:4200. 

## Troubleshooting

When you start to type characters into one of the input fields, you will first see a spinning
"working" icon appear and then suggestions will pop up.  If after two characters, the
suggestions do not come up but you only see the spinning icon, then there may be a problem
with the connection to the people server.  Check the browser's developer console for any
error messages.

You can use curl to test that your backend is working.  If are using the `peopleserver` as
your backend, try this command to see if the service is working properly:

```bash
curl -v http://localhost:9091/oar1
```

Note that this URL must correspond with what is set in the `config.json` file (see ["Running
a Back-end Directory Service"](#running-a-back-end-directory-service) above).  The result 
should be a JSON object and an HTTP status of 200; if not, consider these failure modes: 

  *  if the curl hangs, or the response returns a 404 or "Connection refused" error, the
     [service endpoint URL may not be correct](#running-a-back-end-directory-service).
     When you determine the correct URL that should be used, make sure the `config.json`
     file is set accordingly.

  *  if a JSON object is returned but the message indicates an error (like there are 0
     records loaded), there may have been an error loading the service database (such as
     specifying the wrong data directory or having a missing data file).  Check the server
     log by running `docker logs peopleserver` (or `docker logs midasserver` if your are
     running the `midasserver`) and look for error messages.