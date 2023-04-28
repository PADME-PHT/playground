import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { strictEqual } from 'assert';
import { Dataset } from 'src/app/model/dataset';
import { ExecutionEvent } from 'src/app/model/ExecutionEvent';
import { Route } from 'src/app/model/route';
import { Station } from 'src/app/model/station';
import { ApiClientService } from 'src/app/services/api-client/api-client';
import { ExecutionManagerService } from 'src/app/services/execution-manager';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';

@Component({
  selector: 'app-info-view',
  templateUrl: './info-view.component.html',
  styleUrls: ['./info-view.component.scss']
})
export class InfoViewComponent {

  constructor(executionManager: ExecutionManagerService, stateManager : StateManagerService) {

    //Get the route and set the selected station, etc
    this.route = stateManager.getRoute();
    this.selectedStation = this.route.halts[0].station;
    this.selectedDataset = this.selectedStation.datasets[0];

    //fill the list of datasets
    this.availableDatasets = this.route.halts.flatMap(halt => halt.station.datasets);

    //Then a new execution starts, switch to the log output
    executionManager.executionStateChangedEvent.subscribe((executing) => 
    {
      if (executing)
      {
        //Select the output view
        this.selectedIndex = 3;
      }
    })
  }

  public route: Route;

  @Output()
  routeChange = new EventEmitter<Route>();
  
  //Selectable options
  @Output()
  hasSelectionChanged = new EventEmitter<boolean>();

  public options = ["Schema", "Schema Details", "Route", "Log Output", "Filesystem Changes", "Environment Variables"]

  public selectedIndex = 0;

  //Updated by the subComponent selector
  public selectedDataset!: Dataset;
  public selectedStation!: Station;
  public availableDatasets!: Dataset[];

  selectionChanged(index: number): void {
    //-> Click on the same option twice leads to deselect
    if (this.selectedIndex == index)
    {
      this.selectedIndex = -1;
      //Update that there is a selection
      this.hasSelectionChanged.emit(false);
    } else {
      let old = this.selectedIndex; 

      this.selectedIndex = index;
      if (old == -1)
      {
        //Update that there is now a selection
        this.hasSelectionChanged.emit(true);
      }
    }
  }

  updateStationAndResetDataset(station: Station)
  {
    this.selectedStation = station; 
    this.selectedDataset = station.datasets[0];
  }

  schemaSelected(): boolean {
    return this.selectedIndex == 0;
  }

  schemaDetailsSelected(): boolean {
    return this.selectedIndex == 1;
  }

  routeSelected(): boolean {
    return this.selectedIndex == 2;
  }

  outputSelected(): boolean {
    return this.selectedIndex == 3;
  }

  resultSelected(): boolean {
    return this.selectedIndex == 4;
  }

  envsSelected(): boolean {
    return this.selectedIndex == 5;
  }
}
