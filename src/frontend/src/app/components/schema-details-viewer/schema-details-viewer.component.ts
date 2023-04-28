import { Component, Input, OnInit } from '@angular/core';
import { Dataset } from 'src/app/model/dataset';
import { DatasetType } from 'src/app/model/dataset-type';

@Component({
  selector: 'app-schema-details-viewer',
  templateUrl: './schema-details-viewer.component.html',
  styleUrls: ['./schema-details-viewer.component.scss']
})
export class SchemaDetailsViewerComponent {

  @Input() dataset! : Dataset; 
  constructor() { }

  DatasetType = DatasetType;


  formatFormatType(formatType: string| undefined)
  {
    if (formatType)
    {
      return formatType.replace("https://playgroundapi.padme-analytics.de/datatype/", "");  
    }
    return "";
  }

}