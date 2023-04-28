import { AfterViewChecked, AfterViewInit, Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { Node, Edge, GraphComponent, PanningAxis } from '@swimlane/ngx-graph';
import { ColumnSchema } from 'src/app/model/column-schema';
import { TableSchema } from 'src/app/model/table-schema';
import { DataTypeKind } from 'src/app/model/data-type-kind';
import { Dataset } from 'src/app/model/dataset';
import { ResizedEvent } from 'angular-resize-event';
import { DataType } from 'src/app/model/data-type';
import { SchemaViewerBase } from '../schema-viewer-base';
import { ListSchema } from 'src/app/model/list-schema';
import { DataTypeSchema } from 'src/app/model/datatype-schema';
import { lstat } from 'fs';
import { shuffle, sortBy } from 'lodash';
import { of } from 'rxjs';

@Component({
  selector: 'app-object-schema-viewer',
  templateUrl: './object-schema-viewer.component.html',
  styleUrls: ['./object-schema-viewer.component.scss']
})
export class ObjectSchemaViewerComponent extends SchemaViewerBase implements AfterViewInit {

  //The dataset that should be displayed
  @Input() dataset!: Dataset;

  //A lot of the available datasets
  @Input() datasets!: Dataset[];

  //Display mode that should be used
  @Input() mode: 'dark' | 'light' = "dark";

  @Input() colors!: string[];

  //Subject that triggers then the view should fit its zoom level
  @ViewChild('graph') graph!: GraphComponent;
  public nodes: Node[] = [];
  public links: Edge[] = [];

  public selectedTable!: TableSchema;
  public DataTypeKind = DataTypeKind;

  //Lookup for column colors
  private colorLookup: { [index: number]: string } = {};

  ngAfterViewInit(): void {
    //Same problem as with the changed dataset below
    let self = this;
    setTimeout(() => self.zoomToFit(),150);
  }

  /**
   * 
   * @returns Whether this component currently uses the dark mode
   */
  usesDarkMode() :boolean
  {
    return this.mode == 'dark';
  }
  
  /**
   * @returns Whether this component currently uses the light mode
   */
  usesLightMode(): boolean
  {
    return this.mode == 'light';
  }
  
  /**
   * Gets called whenever one of the inputs changes
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['colors'])
    {
      //Shuffle the available colors
      this.colors = shuffle(this.colors);
    }

    if (changes['dataset'])
    {
      this.selectedTable = this.dataset.tables[0];
      this.selectedTableChanged();
    }    
  }

  /**
   * @param id 
   * @param text 
   * @param datatype 
   * @param unique 
   * @param references 
   * @param level 
   * @returns an node instance that can be added to the graph
   */
  createNode(id: string, text: string, datatype: DataTypeKind | undefined,
             unique: boolean | undefined, references: boolean| undefined, level: number): Node
  {
    return {
      id: id, 
      label: id,
      dimension: { width: 200, height: 35 },
      data: {
        text: text,
        datatype: datatype,
        unique: unique,
        references: references,
        highlightColor: this.getColorForRecursionLevel(level)
      }
    }
  }

  createLink(source: string, target: string, label: string): Edge
  {
    return {
        //a prefix needed, see: https://github.com/swimlane/ngx-graph/issues/396 
        id: `a${this.links.length}`,
        source: source,
        target: target,
        label: label
    }
  }

  addNodeAndLink(parentId: string, nodeId: string | undefined, nodeLabel: string, datatype: DataTypeKind | undefined,
                 linkLabel: string, unique: boolean | undefined, references: boolean | undefined, level: number)
  {
    if (!nodeId)
    {
     nodeId = this.nodes.length.toString();      
    }

    this.nodes.push(this.createNode(nodeId, nodeLabel, datatype, unique, references, level));
    this.links.push(this.createLink(parentId, nodeId, linkLabel));
  }

  isInstanceOfColumn(elem: DataTypeSchema): elem is ColumnSchema
  {
    return 'key' in elem || 'value' in elem;
  }

  /**
   * Handles attributes as elements of a list
   * @param parentId 
   * @param elem 
   */
  handleAttribute(parentId: string, elem: ColumnSchema, level: number)
  { 
    //Due to the structure of the schema, attributes have a sub datatype
    //We therefore skip the attribute itself and only show its datatype
    //otherwise we get empty nodes
    this.addNodeAndLink(
      parentId,
      undefined,
      elem.value ? elem.value : elem.key,
      elem.dataTypeKind,
      "of", 
      elem.isUnique, 
      false,
      level
    );
  }

  /**
   * Adds a node and link for external references
   * @param elem 
   */
  handleExternalReference(elem: ColumnSchema, level: number)
  {
    if (elem.externalReference)
    {
      //Find the other dataset
      let dataset = this.datasets.find(set => set.id == elem.externalReference);
      let name = "Unknown dataset"
      if (dataset) {
        name = `dataset ${dataset.title}`;
      }
      this.addNodeAndLink(elem.id, undefined, name, elem.dataTypeKind, "references", false, true, ++level);
    }
  }

  /**
   * Builds a string that lets one recognize the path to the internal reference
   * @param referenceId 
   * @param table 
   */
  buildStringForInternalReference(referenceId: string, table: TableSchema) : string
  {
    for (let column of table.columns)
    {
      //Check if column was found, else continue recursively
      if (column.id == referenceId) {
        return column.key;
      } else if (column.dataTypeKind == DataTypeKind.Object) {
        let table = column.datatype as TableSchema;
        let recRes = this.buildStringForInternalReference(referenceId, table);
        if (recRes) {
          return `${column.key}.${recRes}`;
        }
      } else if (column.dataTypeKind == DataTypeKind.List) {
        let list = column.datatype as ListSchema;
        if (list.dataTypeKind == DataTypeKind.Object) {
          let table = list.datatype as TableSchema; 
          let recRes = this.buildStringForInternalReference(referenceId, table);
          if (recRes) {
            return `${column.key}[i].${recRes}`;
          }
        }
      }
    }
    return "";
  }

  /**
   * Adds a node and link for internal references (ones between resources)
   * @param elem 
   * @param level 
   */
  handleInternalReference(elem: ColumnSchema, level: number)
  {
    if(elem.referenceTo)
    {
      //build reference strings for all tables to see if one contains the reference
      let res = this.dataset.tables.map(table => {
        let ref = this.buildStringForInternalReference(elem.referenceTo!, table);
        if (ref)
        {
          return `${this.formatTableKey(table.key)}.${ref}`
        }
        return "";
      });
      let reference = res.find(res => res != "");
      let name = reference ? reference : "Unknown reference";
      this.addNodeAndLink(elem.id, undefined, name, elem.dataTypeKind, "references", false, true, ++level);
    } 
  }
   
  /**
   * Adds nodes and links for one element depending on its datatype
   * @param parentId 
   * @param elem 
   * @param parentIsList 
   * @param isUnique 
   * @param level 
   */
  handleElemWithDatatype(parentId: string, elem: DataTypeSchema, parentIsList: boolean, isUnique: boolean | undefined, level: number)
  {
    //increase recursion level
    level = level += 1;
    
    //Add node for column and link to parent
    this.addNodeAndLink(
      parentId,
      elem.id,
      this.isInstanceOfColumn(elem) ? elem.key : "",
      elem.dataTypeKind != DataTypeKind.Atomic ? elem.dataTypeKind : undefined,
      parentIsList ? "of" : "property",
      isUnique,
      false,
      level
    );

    //Handle the datatype of the element, if needed recursively
    if (elem.dataTypeKind == DataTypeKind.Object) {
      let table = elem.datatype as TableSchema;
      for (let child of sortBy(table.columns, x => x.key)) {
        this.handleElemWithDatatype(elem.id, child, false, child.isUnique, level)
      }
    } else if (elem.dataTypeKind == DataTypeKind.List) {
      //List can have attributes or recursive elements
      let list = elem.datatype as ListSchema;
      if (list.dataTypeKind == DataTypeKind.Attribute) {
        this.handleAttribute(elem.id, list.datatype as ColumnSchema, ++level);
      } else {
        this.handleElemWithDatatype(elem.id, list, true, false, level)
      }
    } else if (elem.dataTypeKind == DataTypeKind.Atomic) {
      let type = elem.datatype as DataType;
      this.addNodeAndLink(elem.id, undefined, type.name, elem.dataTypeKind, "has value", false, false, ++level);
    } else if (this.isInstanceOfColumn(elem)) {
      //Handle tree more cases for columns: value, references and external references
      if (elem.value) {
        this.addNodeAndLink(elem.id, undefined, elem.value, elem.dataTypeKind, "has value", false, false, ++level);
      } else if (elem.referenceTo) {
        this.handleInternalReference(elem, level);
      } else if (elem.externalReference) {
        this.handleExternalReference(elem, level);
      }
    }
  }

  /**
   * Computes the visualization
   */
  selectedTableChanged()
  {
    this.nodes = []; 
    this.links = [];
    let level = 0;
    this.resetRecursionColors();

    this.nodes.push(this.createNode(
      this.selectedTable.id,
      this.formatTableKey(this.selectedTable.key),
      DataTypeKind.Object,
      false,
      false,
      level
    ));

    //Start here, proceed recursively 
    //Sort columns alphabetically
    for (let column of sortBy(this.selectedTable.columns, x => x.key))
    {
      this.handleElemWithDatatype(this.selectedTable.id, column, false, column.isUnique, level);
    }

    let self = this;
    setTimeout(() => self.zoomToFit(), 10);
  }

  /**
   * Returns a color for the given recursion level
   * @param level 
   */
  getColorForRecursionLevel(level: number)
  { 
    if (!this.colorLookup[level])
    {
      this.colorLookup[level] = this.getNextColor(this.colors);
    }
    return this.colorLookup[level]; 
  } 

  /**
   * 
   */
  resetRecursionColors()
  {
    this.colorLookup = {}
  }

  /**
   * Formats the table key to visualize it
   * @param key 
   * @returns 
   */
  formatTableKey(key: string)
  {
    //Replaces the fhir url at the beginning
    return key.replace("http://hl7.org/fhir/", "");
  }
  
 /**
   * Called then the parent resizes (for what ever reason)
   * @param event 
   */
  override onResized(event: ResizedEvent) {
    super.onResized(event, this.graph);
  }
 
   /**
    * Fit the schema to the current available with and height
    */
   override zoomToFit(): void{
     super.zoomToFit(this.graph);
   } 
  
}
