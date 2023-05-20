import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Route } from 'src/app/model/route';
import { Session } from 'src/app/model/session';
import { EditorFilePurpose } from 'src/app/model/editor-file-purpose';

@Injectable({
  providedIn: 'root'
})

export class StateManagerService  {

  private sessionId: string = "";

  private route!: Route;

  private currentPurpose: EditorFilePurpose = EditorFilePurpose.execution;

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

  /**
   * @returns the current purpose of the editor
    */
  getCurrentPurpose(): EditorFilePurpose
  {
    return this.currentPurpose;
  }

  /**
   * Sets the current purpose of the editor
   * @param purpose
    */
  setCurrentPurpose(purpose: EditorFilePurpose)
  {
    this.currentPurpose = purpose;
  }
}