import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { Dataset } from 'src/app/model/dataset';
import { Organization } from 'src/app/model/organization';
import { Station } from 'src/app/model/station';
import { find } from 'lodash';
import { MatCheckbox } from '@angular/material/checkbox';

export interface DataSourceSelection
{
  selected: boolean, 
  organization: Organization, 
  station: Station, 
  dataset: Dataset
}

export interface DatasetDetailsChanged
{
  dataset: Dataset, 
  station: Station, 
  organization: Organization
}

@Component({
  selector: 'app-data-source-selector',
  templateUrl: './data-source-selector.component.html',
  styleUrls: ['./data-source-selector.component.scss']
})
export class DataSourceSelectorComponent implements OnInit {

  @Input()
  public organizations!: Organization[];
  @Input()
  public mode: 'selection' | 'deselection' = 'selection';

  //Called whenever a new dataset is checked/unchecked for simulation
  @Output()
  public datasetSelectionChanged = new EventEmitter<DataSourceSelection>();
  
  //Called whenever a new data set is selected to view details
  @Output()
  public datasetSelectedForDetails = new EventEmitter<DatasetDetailsChanged>();


  @ViewChildren('selection')
  public selectionLists!: QueryList<MatSelectionList>;

  @ViewChildren('checkbox')
  public checkboxes!: QueryList<MatCheckbox>;

  constructor() { }

  ngOnInit(): void { }
  
  /**
   * Called whenever a data source is checked/unchecked
   * @param checked 
   * @param orga 
   * @param station 
   * @param dataset 
   */
  checkboxClicked(checked : boolean, orga : Organization, station: Station, dataset: Dataset)
  {
    this.datasetSelectionChanged.emit(
      {
        selected: checked,
        organization: orga,
        station: station,
        dataset: dataset
      });
  }

  /**
   * Called whenever a dataset is selected to view further details
   * @param selectionChange 
   */
  datasetSelected(orga : Organization, station: Station, selectionChange: MatSelectionListChange)
  {
    //Deselect all other selections (only one dataset can be selected)
    for (let list of this.selectionLists)
    {
      if (list != selectionChange.source)
      {
        list.deselectAll();
      }  
    }

    this.datasetSelectedForDetails.emit({
      dataset: selectionChange.options[0].value, 
      station: station, 
      organization: orga
    });
  }

  /**
   * Deselects all list elements for the current details view
   */
  public deselectAllDetails()
  {
    this.selectionLists.forEach((list) => list.deselectAll());
  }

  /**
   * Unchecks the dataset with the given id from being used for the simulation 
   * @param id 
   */
  public uncheckDatasetWithId(id: string)
  {
    for (let checkbox of this.checkboxes)
    {
      if (checkbox.id == id)
      {
        checkbox.checked = false;
      }  
    }
  }
  
}
