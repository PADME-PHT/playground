// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
import { APP_INITIALIZER, LOCALE_ID} from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { ApiClientService } from "src/app/services/api-client/api-client";
import { ApiClientServiceMock } from "src/app/services/api-client/api-client-mock";
import { StateManagerService } from "src/app/services/state-manager/state-manager";
import { StateManagerServiceMock } from "src/app/services/state-manager/state-manager-mock";

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8080',
        realm: 'master',
        clientId: 'playground'
      },
      initOptions: {
        onLoad: 'check-sso', 
        //Read more on silent sso here: https://www.npmjs.com/package/keycloak-angular 
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html'
      }
    });
}

export const providers = [
  {
    provide: StateManagerService, useClass: StateManagerServiceMock
  },
  {
    provide: ApiClientService, useClass: ApiClientServiceMock,
  },
  {
    provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService]
  }, 
  { provide: LOCALE_ID, useValue: 'de-DE'},
]