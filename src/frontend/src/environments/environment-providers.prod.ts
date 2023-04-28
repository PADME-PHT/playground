import { APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'XXXX',
        realm: 'pht',
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
    provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService]
  }, 
  { provide: LOCALE_ID, useValue: 'de-DE'},
]