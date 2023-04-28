import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss']
})
export class WelcomeDialogComponent {

  private doNotShowMessage = false;

  constructor(public dialogRef: MatDialogRef<WelcomeDialogComponent>) { }

  Start(): void {
    this.dialogRef.close(this.doNotShowMessage);
  } 

  showMessageChanged(doNotShow: boolean)
  {
    this.doNotShowMessage = doNotShow; 
  }

}
