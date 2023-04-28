import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-main-welcome-dialog',
  templateUrl: './main-welcome-dialog.component.html',
  styleUrls: ['./main-welcome-dialog.component.scss']
})
export class MainWelcomeDialogComponent {

  private doNotShowMessage = false;

  constructor(public dialogRef: MatDialogRef<MainWelcomeDialogComponent>) { }

  Start(): void {
    this.dialogRef.close(this.doNotShowMessage);
  } 

  showMessageChanged(doNotShow: boolean)
  {
    this.doNotShowMessage = doNotShow; 
  }
}
