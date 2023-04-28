import { AfterContentChecked, AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { EnvironmentVariable } from 'src/app/model/environment-variable';
import { Route } from 'src/app/model/route';
import { MatSort } from '@angular/material/sort';
import { Station } from 'src/app/model/station';
import { MatPaginator } from '@angular/material/paginator';
import { DatasetSelectorComponent } from '../dataset-selector/dataset-selector.component';
import { environment } from 'src/environments/environment';
import { EnvEditorDialogComponent } from './env-editor-dialog/env-editor-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { find, remove } from 'lodash';
import { EnvsDeleteDialogComponent } from './envs-delete-dialog/envs-delete-dialog.component';
import { PredefinedEnvironmentVariable } from 'src/app/model/session-station';

@Component({
  selector: 'app-envs-viewer',
  templateUrl: './envs-viewer.component.html',
  styleUrls: ['./envs-viewer.component.scss']
})
export class EnvsViewerComponent implements AfterViewInit {

  constructor(
    public dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) { }
  
  @Input()
  public route!: Route;

  @Input()
  public selectedStation!: Station;
  @Output() selectedStationChange = new EventEmitter<Station>();

  //Properties for the predefined (upper table)
  @ViewChild('predefinedTableContainer')
  predefinedTableContainer!: ElementRef;
  @ViewChild('predefinedSort', { read: MatSort, static: true })
  predefinedSort!: MatSort;
  @ViewChild('predefinedPaginator', { read: MatPaginator, static: true })
  predefinedPaginator!: MatPaginator;
  predefinedDataSource: MatTableDataSource<PredefinedEnvironmentVariable> = new MatTableDataSource<PredefinedEnvironmentVariable>([]);
  public predefinedDisplayColumns = ['name', 'value', 'description', 'buttons'];
  public predefinedPageSize = 4;

  //Properties for the own (lower table)
  @ViewChild('ownTableContainer')
  ownTableContainer!: ElementRef;
  @ViewChild('ownSort', { read: MatSort, static: true })
  ownSort!: MatSort;
  @ViewChild('ownPaginator', { read: MatPaginator, static: true })
  ownPaginator!: MatPaginator;
  ownDataSource: MatTableDataSource<EnvironmentVariable> = new MatTableDataSource<EnvironmentVariable>([]);
  public ownDisplayColumns = ['name', 'value', 'buttons'];
  public ownPageSize = 4;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedStation'] && this.selectedStation)
    {
      this.updateDateSources(this.selectedStation);
    } else if (changes['route'] && !this.selectedStation) {
      if (this.route && this.route.halts && this.route.halts.length > 0) {
        //update the data source
        this.selectedStation = this.route.halts[0].station;
        this.updateDateSources(this.selectedStation);
      }
    }
  }

  ngAfterViewInit(): void {
    this.updatePredefinedPaginationSize();
    this.updateOwnPaginationSize();
    //Otherwise angular will throw an error, read here: https://indepth.dev/posts/1001/everything-you-need-to-know-about-the-expressionchangedafterithasbeencheckederror-error
    //Although this is not a recommended solution, in my opinion this is fine here
    //since we really want the change here and we cannot perform it earlier
    //(the calculation depends on the view child, which is only available after View Init)
    //Therefore, no infinite loop possible here but the DOM tree stabilizes immediately.
    this.cd.detectChanges();
  }

  updateDateSources(station: Station)
  {
    this.updatePredefinedDataSources(station);
    this.updateOwnDataSources(station);
  }

  updatePredefinedDataSources(station: Station)
  {
    this.predefinedDataSource = new MatTableDataSource(station.envs);
    this.predefinedDataSource.sort = this.predefinedSort;
    this.predefinedDataSource.paginator = this.predefinedPaginator;
    this.updatePredefinedPaginationSize();
  }

  updateOwnDataSources(station: Station)
  {
    this.ownDataSource = new MatTableDataSource(station.ownEnvs);
    this.ownDataSource.sort = this.ownSort;
    this.ownDataSource.paginator = this.ownPaginator;
    this.updateOwnPaginationSize();
  }

  updatePredefinedPaginationSize()
  {
    this.updatePageSize(this.predefinedPaginator, this.predefinedTableContainer);
  }

  updateOwnPaginationSize()
  {
    this.updatePageSize(this.ownPaginator, this.ownTableContainer);
  }

  /**
   * Calculates the maximum possible page size and updates this on the provided elements
   * @param paginator 
   * @param container 
   */
  updatePageSize(paginator : MatPaginator, container: ElementRef)
  {
    if (paginator && container)
    {  
      //56 Pixel = height of head
      ///48 Pixel = height of row
      let size = Math.floor((container.nativeElement.offsetHeight - 56) / 48);
      //Unfortunately we call a 'private' method here but currently 
      //this seems to be the only way to get changing the page size working
      paginator._changePageSize(size);
    }
  }

  selectedStationChanged() {
    if (this.selectedStation) {
      this.updateDateSources(this.selectedStation);
    }

    //Update outside components that the selection has changed
    this.selectedStationChange.emit(this.selectedStation);
  }

  applyPredefinedFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.predefinedDataSource.filter = filterValue.trim().toLowerCase();
  }

  applyOwnFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.ownDataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * Creates a dialog to add an additional environment variable
   */
  addOwnVariable()
  {
    let dialogRef = this.dialog.open(EnvEditorDialogComponent,
    {
      data: {
        mode: 'Create',
        valueChangeable: true, 
        showMultiOption: this.route.halts.length > 1,
        existingEnvs: this.getAllStationEnvs(this.selectedStation)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result)
      {
        //Push to the selected station or to all if requested
        if (!result.multi) {
          let env = this.createNewEnvVariable(result.name, result.value);
          this.selectedStation.ownEnvs.push(env);
        } else {
          this.addOwnEnvToAllStations(result.name, result.value);
        }
        this.updateOwnDataSources(this.selectedStation);
      }
    });
  }

  /**
   * Creates a new Environment variable object with the given name and value
   * @param name 
   * @param value 
   * @returns 
   */
  createNewEnvVariable(name: string, value: string): EnvironmentVariable
  {
    return { id: "", name: name, value: value, description: "" } as EnvironmentVariable;
  }

  /**
   * Adds the provided environment variable to all stations that do not yet have it
   * @param env 
   */
  addOwnEnvToAllStations(name: string, value: string)
  {
    for (let halt of this.route.halts)
    {
      //Check if variable with this name already exists
      let found = find(this.getAllStationEnvs(halt.station), { name: name });
      if (!found)
      {
        let env = this.createNewEnvVariable(name, value);
        halt.station.ownEnvs.push(env);
      }
    }
  }

  /**
   * @returns A concatenated list of the pre- and own defined environment variables of the given station
   */
  getAllStationEnvs(station: Station)
  {
    return station.ownEnvs.concat(station.envs);
  }

  /**
   * Searches the env variables of the station of the one with the given name and updates the values
   * @param station 
   * @param oldName 
   * @param newName 
   * @param newValue 
   */
  updateExistingEnvVariable(station: Station, oldName: string, newName: string, newValue: string)
  {
    let envs = this.getAllStationEnvs(station); 
    let found = find(envs, { name: oldName })
    if (found)
    {
      found.name = newName; 
      found.value = newValue;
    }
  }

  /**
   * Resets the provided predefined variable to its default value
   * @param {PredefinedEnvironmentVariable} env the variable to reset
   */
  resetPredefinedVariable(env: PredefinedEnvironmentVariable)
  {
    env.value = env.initialValue;
  }

  /**
   * Calls a dialog to edit the name/value of the given variable
   * @param env The environment variable to edit
   * @param valueChangeable Whether the value can be changed
   */
  editVariable(env: EnvironmentVariable, valueChangeable: boolean)
  {
    //Because the result is passed as reference we don't need to explicitly update anything
    let dialogRef = this.dialog.open(EnvEditorDialogComponent,
    {
      data: {
        mode: 'Edit',
        env: env,
        valueChangeable: valueChangeable,
        showMultiOption: this.route.halts.length > 1, 
        existingEnvs: this.getAllStationEnvs(this.selectedStation)
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result)
      {
        if (result.multi) {
          //Update the name/value for each station
          this.route.halts.forEach(halt => {
            this.updateExistingEnvVariable(halt.station, env.name, result.name, result.value);
          });
        } else {
          env.name = result.name;
          env.value = result.value;
        }
      }
    });
  }

  /**
   * Deletes the variable with the given name from the station
   * @param station 
   * @param name 
   */
  deleteOwnVariableForStation(station: Station, name: string)
  {
    remove(station.ownEnvs, { name: name });
  }

  /**
   * Creates a dialog to delete the environment variable
   * @param env 
   */
  deleteVariable(env: EnvironmentVariable)
  {
    //Because the result is passed as reference we don't need to explicitly update anything
    let dialogRef = this.dialog.open(EnvsDeleteDialogComponent,
    {
      data: {
        name: env.name,
        showMultiOption: this.route.halts.length > 1
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.delete)
      {
        if (result.all) {
          //Delete the env for each station
          this.route.halts.forEach(halt => this.deleteOwnVariableForStation(halt.station, env.name));
        } else {
          this.deleteOwnVariableForStation(this.selectedStation, env.name);
        }
        this.updateOwnDataSources(this.selectedStation);
      }
    });
  }
}
