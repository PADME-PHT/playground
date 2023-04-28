import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Route } from 'src/app/model/route';
import { Session } from 'src/app/model/session';

@Injectable({
  providedIn: 'root'
})

export class StateManagerService  {

  private sessionId: string = "";

  private route!: Route;

  /**
   * Updates the stored Session object
   * @param session 
   */
  setSessionId(sessionId: string) : void
  {
    this.sessionId = sessionId;
  }

  /**
   * Updates the stored route Object
   * @param route 
   */
  setRoute(route: Route)
  {
    this.route = route;
  }

  /**
   * @returns the last stored session object
   */
  getSessionId(): string
  {
    return this.sessionId;
  }

  /**
   * @returns the last stored route object
   */
  getRoute(): Route{
    return this.route;
  }
}