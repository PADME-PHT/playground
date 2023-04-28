// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false, 
  //Prevent in dev because this interrupts the reload on changes from ng and therefore makes development harder
  preventLeaveOnFileChanges: false,
  apiUrl: "http://localhost:1234", 
  defaultSessionId: "4154ec4c-a93e-4fd0-b47f-1671ae94c25d",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
