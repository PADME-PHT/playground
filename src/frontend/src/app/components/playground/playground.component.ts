import { AfterViewInit, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserSettings } from 'src/app/model/user-settings';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';
import { UserSettingsManager } from 'src/app/services/user-settings-manager';
import { environment } from 'src/environments/environment';
import { CodeeditorComponent } from './codeeditor/codeeditor.component';
import { MainWelcomeDialogComponent } from './main-welcome-dialog/main-welcome-dialog.component';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit, AfterViewInit {

  private settings!: UserSettings;
  
  constructor(
    private stateManager: StateManagerService,
    private settingsManager: UserSettingsManager,
    private dialog: MatDialog,
    private router: Router) {
    //Get the info from the current navigation
    console.log(`Starting playground in session ${stateManager.getSessionId()}`);
  }
  
  @ViewChild('editor') editor!: CodeeditorComponent;

  //Event that is fired when users try to leave the app
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.hasChanges()) {
      //Chromium based, firefox etc. show their own message, this message will only be shown in IE and Edge
      $event.returnValue = "There are still changed you have not downloaded, are you sure you want to leave?";
    }
  }

  /**
   * Gets called when the view has been initialized
   */
  ngAfterViewInit(): void {  
    this.settings = this.settingsManager.getUserSettings(); 
    if (this.settings.showMainView) {
      this.openWelcomeDialog();
    }
  }
  
  /**
   * Show the welcome dialog
   */
  openWelcomeDialog()
  {
    let dialogRef = this.dialog.open(MainWelcomeDialogComponent);
    dialogRef.afterClosed().subscribe(doNotShowMessage => {
      //Update the user preferences
      this.settings.showMainView = !doNotShowMessage;
      this.settingsManager.updateUserSettings(this.settings);
    });
  }
  
  /**
   * Checks if there are unsaved changes
   * @returns 
   */
  hasChanges() : boolean
  {
    if (this.editor)
    {
      return this.editor.hasChanges();
    }
    return false;
  }

  public infoSelected: boolean = true;

  ngOnInit(): void {

    //If production: route back if not redirected
    if (environment.production && this.stateManager.getSessionId() == "")
    {
      this.router.navigate(['/']);
    }
  }

  infoViewHasSelectionChanged(value: boolean)
  { 
    this.infoSelected = value;
  }
}
