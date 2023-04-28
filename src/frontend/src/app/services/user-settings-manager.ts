import { Injectable } from '@angular/core';
import { UserSettings } from '../model/user-settings';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsManager {

  private cookieName = "userSettings"; 
  private cookieExpireDays = 180 // 6 month

  constructor() { }

  /**
   * @returns the current set user settings or the default if none have been set
   */
  public getUserSettings() : UserSettings
  {
    let storedSettings = this.getCookie(); 
    return storedSettings ? storedSettings : new UserSettings();
  }

  /**
   * Updates the user settings to the new provided object
   * @param newSettings 
   */
  public updateUserSettings(newSettings: UserSettings)
  {
    this.setCookie(newSettings);
  }

  /**
   * Sets the cookie with the updated settings
   * @param settings The settings that should be updated
   */
  private setCookie(settings: UserSettings) {
    
    //Stolen from: https://www.w3schools.com/js/js_cookies.asp
    const d = new Date();
    d.setTime(d.getTime() + (this.cookieExpireDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = this.cookieName + "=" + JSON.stringify(settings) + ";" + expires + ";path=/";
  }

  /**
   * Tries to read the user settings cookie
   * @returns an UserSettings object if the cookie was previously set, undefined otherwise
   */
  private getCookie() : UserSettings | undefined
  {
    //Stolen from: https://www.w3schools.com/js/js_cookies.asp

    let name = `${this.cookieName}=`;
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return JSON.parse(c.substring(name.length, c.length));
      }
    }
    return undefined;
  }
}
