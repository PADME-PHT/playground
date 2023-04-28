import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { find } from 'lodash';
import { Route } from 'src/app/model/route';

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.scss']
})
export class LoadingDialogComponent implements OnInit {

  public errorMessage: string = "";
  public fetchingInfo: boolean = true; 
  public closed: boolean = false; 
  public showBlazeMessage: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<LoadingDialogComponent>,
  ) { }

  ngOnInit(): void {
  }

  Cancel(): void {
    this.closed = true;
    this.dialogRef.close(false);
  }

  /**
   * Changes the display to setting up the environment
   */
  changeToEnvSetup(): void
  {
    this.fetchingInfo = false;
  }

  /**
   * Shows specifics about the route while loading if applicable
   * @param route 
   */
  displayInfoForRoute(route: Route): void
  {
    //Determine if blazegraph if in the route
    //-> If so, display special text that loading will take longer
    let datasets = route.halts.flatMap(halt => halt.station.datasets);
    if (find(datasets, dataset => dataset.sourceType == "Blaze"))
    {
      this.showBlazeMessage = true;
    }
  }

  /**
   * Displays an error message with the provided text
   * @param message 
   */
  showError(message: string): void {
    this.errorMessage = message;
  }
}
