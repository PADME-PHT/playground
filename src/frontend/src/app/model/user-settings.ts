export class UserSettings
{
  /**
   * This sets the default values when none are specified
   * @param showWelcome 
   */
  constructor(
    public showWelcome: boolean = true,
    public showMainView: boolean = true
  ) { }
  
}