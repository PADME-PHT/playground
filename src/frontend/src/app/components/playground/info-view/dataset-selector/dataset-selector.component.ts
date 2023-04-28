import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { Dataset } from 'src/app/model/dataset';
import { Route } from 'src/app/model/route';
import { Station } from 'src/app/model/station';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';

@Component({
  selector: 'app-dataset-selector',
  templateUrl: './dataset-selector.component.html',
  styleUrls: ['./dataset-selector.component.scss']
})
export class DatasetSelectorComponent {

  @Input()
  public route!: Route;

  @Input()
  public selectedStation!: Station;
  @Output() selectedStationChange = new EventEmitter<Station>();

  @Input()
  public selectedDataset!: Dataset;
  @Output() selectedDatasetChange = new EventEmitter<Dataset>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedStation'] && this.selectedStation && !this.selectedDataset)
    {
      console.log("Station changed");
      this.selectedDataset = this.selectedStation.datasets[0];
      this.selectedDatasetChange.emit(this.selectedDataset);
    }
  }

  selectedDatasetChanged() {
    //Update outside components that the selection has changed
    this.selectedDatasetChange.emit(this.selectedDataset);
  }

  selectedStationChanged() {
    if (this.selectedStation.datasets.length > 0) {
      this.selectedDataset = this.selectedStation.datasets[0];
      this.selectedDatasetChange.emit(this.selectedDataset);
    }

    //Update outside components that the selection has changed
    this.selectedStationChange.emit(this.selectedStation);
  }
}
