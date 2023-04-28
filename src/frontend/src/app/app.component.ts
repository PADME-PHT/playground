import { Component, ViewChild } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { CodeeditorComponent } from './components/playground/codeeditor/codeeditor.component';
import { KeycloakProfile } from 'keycloak-js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private keycloak: KeycloakService) { }

  async ngOnInit() {
  }  

  logout()
  {
    this.keycloak.logout();
  }
}
