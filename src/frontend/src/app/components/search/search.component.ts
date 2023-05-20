import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Dataset } from 'src/app/model/dataset';
import { Organization } from 'src/app/model/organization';
import { DatasetDetailsChanged, DataSourceSelection, DataSourceSelectorComponent } from './data-source-selector/data-source-selector.component';
import { find, clone, remove, findIndex, sortBy} from 'lodash';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SelectRouteDialogComponent } from './select-route-dialog/select-route-dialog.component';
import { SelectFLDialogComponent } from './select-fl-dialog/select-fl-dialog.component';
import { Route } from 'src/app/model/route';
import { WelcomeDialogComponent } from './welcome-dialog/welcome-dialog.component';
import { UserSettingsManager } from 'src/app/services/user-settings-manager';
import { UserSettings } from 'src/app/model/user-settings';
import { ApiClientService } from 'src/app/services/api-client/api-client';
import { catchError,forkJoin,  of, map} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingDialogComponent } from './loading-dialog/loading-dialog.component';
import { Router } from '@angular/router';
import { disableDebugTools } from '@angular/platform-browser';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';
import { Session } from 'src/app/model/session';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements AfterViewInit {

  public organizations!: Organization[];
  public datasets!: Dataset[];
  public selectedOrganizations: Organization[] = [];
  public selectedDataset!: Dataset;
  public datasetLoading: boolean = false;
  public loading: boolean = true;
  private settings!: UserSettings;

  @ViewChild('availableDatasets') availableDatasets!: DataSourceSelectorComponent;
  @ViewChild('selectedDatasets') selectedDatasets!: DataSourceSelectorComponent;

  constructor(
    public dialog: MatDialog,
    private settingsManager: UserSettingsManager,
    private apiClient: ApiClientService,
    private _snackBar: MatSnackBar,
    private router: Router, 
    private stateManager: StateManagerService
    ) { }

  /**
   * Gets called when the view has been initialized
   */
  ngAfterViewInit(): void {  
    this.settings = this.settingsManager.getUserSettings(); 
    if (this.settings.showWelcome) {
      this.openWelcomeDialog();
    }

    //Load the data
    this.loadOrganizations();
  }

  /**
   * Loads the data of the organizations, stations and datasets
   */
  loadOrganizations()
  {
    this.apiClient.getOrganizations().pipe(catchError(e =>
    {
      console.log(e);
      this.openErrorLoadingSnackBar();
      //return observable
      return of(undefined);
    })).subscribe(organizations =>
    {
      if (organizations)
      {
        this.datasets = [];
        this.organizations = sortBy(organizations, x => x.name);
        //Sort the stations of each organization
        for (let orga of organizations)
        {
          orga.stations = sortBy(orga.stations, x => x.name);
          //Also sort the datasets by title
          for (let station of orga.stations)
          {
            station.datasets = sortBy(station.datasets, x => x.title);
            //Store all available dataset in a variable, needed by the object-schema-viewer
            //to display references between datasets
            this.datasets = this.datasets.concat(station.datasets);
          }
        }
      }
      this.loading = false;
    });
  }

  /**
   * 
   * @param message The message that should be shown on the snack bar
   */
  openSnackBar(message: string, classes: string[]) {
    this._snackBar.open(message, "Okay", {
      verticalPosition: 'bottom', 
      panelClass: classes
    });
  }

  /**
   * Opens a snackbar that displays an error message for loading the data
   */
  openErrorLoadingSnackBar()
  {
    this.openSnackBar("Something went wrong while loading your data, please try again", ['error-snackbar']);
  }

  /**
   * Loads the dataset details from the backend when the selection changes
   * @param selection 
   */
  loadDatasetForSelection(selection: DatasetDetailsChanged)
  {
    this.apiClient.getDataset(selection.organization.id, selection.station.id, selection.dataset.id
      ).pipe(catchError(e => {
        console.log(e);
        this.openErrorLoadingSnackBar();
        return of(undefined);
      })).subscribe(dataset => {
        if (dataset) {
          this.selectedDataset = dataset;
        }
        this.datasetLoading = false;
      });
  }

  /**
   * Called when a new dataset should be viewed in the details screen
   * @param dataset 
   */
  datasetSelectedForDetails(caller : DataSourceSelectorComponent, selection: DatasetDetailsChanged)
  {
    this.datasetLoading = true; 

    //Load the dataset
    this.loadDatasetForSelection(selection); 

    //Deselect in the other component
    if (caller == this.availableDatasets)
    {
      this.selectedDatasets.deselectAllDetails();
    } else {
      this.availableDatasets.deselectAllDetails();
    }
  }

  /**
   * Gets called whenever a new dataset is selected in the available datasets
   * @param event 
   */
  newDatasetSelected(event: DataSourceSelection)
  {
    //Check if the organization exists, else add
    let orga = find(this.selectedOrganizations, { id: event.organization.id }); 
    if (!orga)
    {
      orga = clone(event.organization);
      orga.stations = [];
      this.selectedOrganizations.push(orga);
    }

    //Check if station exists, else add
    let station = find(orga.stations, { id: event.station.id }); 
    if (!station)
    {
      station = clone(event.station);
      station.datasets = [];
      orga.stations.push(station);
    }

    //Add the dataset
    station.datasets.push(event.dataset);
  }

  /**
   * Gets called whenever a dataset get deselected by either of the components
   * @param event 
   */
  datasetDeselected(event: DataSourceSelection)
  {
    let orga = find(this.selectedOrganizations, { id: event.organization.id });
    let station = find(orga?.stations, { id: event.station.id });
    if (station && orga)
    {
      //Remove the dataset
      remove(station.datasets, { id: event.dataset.id });

      //Check if the station has datasets left
      if (station.datasets.length == 0)
      {
        remove(orga.stations, {id: station.id});  
      }

      //Check if the organization has stations left
      if (orga.stations.length == 0)
      {
        remove(this.selectedOrganizations, { id: orga.id });  
      }
    }

    //Uncheck the dataset in the available datasets
    this.availableDatasets.uncheckDatasetWithId(event.dataset.id);
  }

  /**
   * Called whenever a new dataset is checked or unchecked
   * @param event 
   */
  datasetCheckedChanged(caller: DataSourceSelectorComponent, event: DataSourceSelection)
  {
    if (caller == this.availableDatasets && event.selected)
    {
      this.newDatasetSelected(event);  
    } else
    {
      this.datasetDeselected(event);
    }
  }

  /**
   * Creates a default route from the current selected organizations and stations
   */
  getDefaultRoute(): Route {

    let route: Route = {
      halts: []
    }

    //Create one halt for each Station and Organization
    this.selectedOrganizations.forEach((orga) => orga.stations.forEach((station) => {
      route.halts.push({
        station: station,
        organization: orga
      })
    })); 

    return route;
  }

  /**
   * Show the welcome dialog
   */
  openWelcomeDialog()
  {
    let dialogRef = this.dialog.open(WelcomeDialogComponent);
    dialogRef.afterClosed().subscribe(doNotShowMessage => {
      //Update the user preferences
      this.settings.showWelcome = !doNotShowMessage;
      this.settingsManager.updateUserSettings(this.settings);
    });
  }

  /**
   * @param e Error object (from API)
   * @returns  the error message from e if any and a default error otherwise
   */
  tryGetErrorMessage(e: any)
  {
    console.log(e);
    if (e.error && e.error.message)
    {
      return e.error.message;
    } else {
      return "Unexpected error, please contact your administrator";
    }
  }

  /**
   * Updates the route's stations with the fetched dataset details
   * @param route 
   * @param update 
   */
  updateRouteDatasets(route: Route, update: { stationId: string, dataset: Dataset }[])
  {
    //update the route objects
    let stations = route.halts.map(halt => halt.station);
    for (let ds of update)
    {
      //Find the related station and index of the dataset
      let station = find(stations, { id: ds.stationId })
      let index = findIndex(station?.datasets, { id: ds.dataset.id });
      if (station == undefined || index == undefined) continue;

      //Update the dataset
      station.datasets[index] = ds.dataset;
    }
  }

  /**
   * Update the stations environment vars for the stations included in the route
   * @param route 
   * @param session 
   */
  updateRouteEnvironmentVars(route: Route, session: Session)
  {
    let stations = route.halts.map(halt => halt.station);
    for (let station of session.stations)
    {
      let foundStation = find(stations, { id: station.id });
      if (foundStation)
      {
        foundStation.envs = station.envs;
        //Initialize these as empty (property that is only used in the UI)
        foundStation.ownEnvs = [];
      }
    }
  }

  /**
   * Creates a session and then redirects to the playground
   * @param route 
   * @param dialogRef 
   */
  createSession(route: Route, dialogRef: MatDialogRef<LoadingDialogComponent>)
  {
    //Return if dialog is closed
    if (dialogRef.componentInstance.closed) return;

    //Generate a session at the API
    this.apiClient.generateSession(this.selectedOrganizations).pipe(catchError(e => {
      dialogRef.componentInstance.showError(this.tryGetErrorMessage(e));
      return of(undefined);
    })).subscribe(session => {
      if (session && !dialogRef.componentInstance.closed) {
        //Close the dialog and navigate to the playground
        dialogRef.close();
        this.updateRouteEnvironmentVars(route, session);
        this.stateManager.setSessionId(session.id); 
        this.stateManager.setRoute(route); 
        this.router.navigate(['/playground']);
      }
    }); 
  }

  /**
   * Fetches all the needed data, creates a session and then directs to the playground
   */
  switchToPlayground(route: Route) {
    let dialogRef = this.dialog.open(LoadingDialogComponent,
      {
        disableClose: true
      });
    
    //Fetch the details for all selected datasets
    forkJoin(
      route.halts.map(halt =>
        halt.station.datasets.map(ds =>
          this.apiClient.getDataset(halt.organization.id, halt.station.id, ds.id).pipe(map(ds => ({ stationId: halt.station.id, dataset: ds })))
        )
      ).flat()
    ).pipe(catchError(e => {
      dialogRef.componentInstance.showError(this.tryGetErrorMessage(e));
      return of(undefined);
    })).subscribe(datasets => {
      if (!datasets || dialogRef.componentInstance.closed) return;
      
      //Apply the updates
      this.updateRouteDatasets(route, datasets);
     
      //Create the Session!
      dialogRef.componentInstance.changeToEnvSetup();
      dialogRef.componentInstance.displayInfoForRoute(route);
      
      this.createSession(route, dialogRef);
    });
  }
  
  /**
   * Displays the Dialog to specify the route
   */
  openSelectRouteDialog() {
    let dialogRef = this.dialog.open(SelectRouteDialogComponent, 
    {
      data: this.getDefaultRoute()
    });
    dialogRef.afterClosed().subscribe(result => {

      //If defined, dialog was successful
      if (result)
      {
        this.switchToPlayground(result);
      }
    });
  }


  /**
   * Displays the Dialog to specify FL settings
   * TODO: Properly split from CIIL functionality.
   */
  openSelectFLDialog() {
    let dialogRef = this.dialog.open(SelectFLDialogComponent,
    {
      data: this.getDefaultRoute()
    });
    
    dialogRef.afterClosed().subscribe(result => {

      //If defined, dialog was successful
      if (result)
      {
        this.switchToPlayground(result);
      }
    });
  }
}
