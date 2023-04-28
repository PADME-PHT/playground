import { AfterViewInit, Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Node, Edge, GraphComponent } from '@swimlane/ngx-graph';
import { ResizedEvent } from 'angular-resize-event';
import { filter, find, keys, shuffle } from 'lodash';
import { basename } from 'path';
import { ColumnSchema } from 'src/app/model/column-schema';
import { Dataset } from 'src/app/model/dataset';
import { TableSchema } from 'src/app/model/table-schema';
import { SchemaViewerBase } from '../schema-viewer-base';

export interface ColumnLookup
{
  [index: string]:
  {
    column: ColumnSchema,
    table: TableSchema
  };
}

@Component({
  selector: 'app-relational-schema-viewer',
  templateUrl: './relational-schema-viewer.component.html',
  styleUrls: ['./relational-schema-viewer.component.scss']
})
export class RelationalSchemaViewerComponent extends SchemaViewerBase implements AfterViewInit  {

  //The dataset that should be displayed
  @Input() dataset!: Dataset;
  //Display mode that should be used
  @Input() mode: 'dark' | 'light' = "dark";
 
  @Input() colors!: string[];
  
   //Subject that triggers then the view should fit its zoom level
  @ViewChild('graph') graph!: GraphComponent;
  public nodes: Node[] = [];
  public links: Edge[] = [];
 
  private columnLookup: ColumnLookup = {};

  ngAfterViewInit(): void {
    //Same problem as with the changed dataset below
    let self = this;
    setTimeout(() => self.zoomToFit(), 20);
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
       this.datasetChanged();
     }
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
    * Calculates which edges should exist between the tables of the provided dataset
    * @param dataset The dataset that should be used
    * @returns an array of edges
    */
   calculateLinks(columnLookup: ColumnLookup, dataset: Dataset): Edge[]
   {
     let edges: Edge[] = [];
 
     //Filter the columns with references
     let references = filter(keys(columnLookup), (key) => columnLookup[key].column.referenceTo != undefined)
 
     //Now, for each reference, add a Edge in the graph
     for (let key of references)
     {
       let lookup = columnLookup[key]; 
       if (!lookup.column.referenceTo) continue; 
 
       //find opposite column
       let partner = columnLookup[lookup.column.referenceTo]; 
       if (!partner) continue; 
       
       //See if a edge between these two tables already exists      
       if (find(edges, (edge) => edge.source == lookup.table.id && edge.target == partner.table.id))
       {
         continue;
       }   
 
       //Add edge
       edges.push(
         {
         //a prefix needed, see: https://github.com/swimlane/ngx-graph/issues/396 
         id: `a${edges.length}`,
         source: lookup.table.id, 
         target: partner.table.id,
         label: 'uses'
         }
       )       
     }
     return edges;
   } 
 
 /**
  * @param columnId The id of the column that should be used
  * @returns the name of the column and associated table in the format 'table.column'
  */
   getTableAndColumnName(columnId: string) : string
   {
     let lookup = this.columnLookup[columnId]; 
 
     if (lookup)
     {
       return `${lookup.table.key}.${lookup.column.key}`;
     }
 
     return "";
   }
 
   /**
    * Computes the tables and links for the dataset
    */
   datasetChanged()
   {
     this.nodes = []; 
     this.columnLookup = {};
 
     //Get the nodes for the tables
     for (let table of this.dataset.tables)
     {
       this.nodes.push({
         id: table.id,
         label: table.id,
         dimension: { width: 200, height: this.getHeightForTableViewer(table) },
         data: { table: table, highlightColor: this.getNextColor(this.colors) }
       }); 
 
       //Add this to the column lookup
       //This indexing structure is used to build the links and lookup names
       table.columns.forEach((column) => {
         this.columnLookup[column.id] = {
           column: column,
           table: table
         }
       });
     }
 
     //Calculate the links
     this.links = this.calculateLinks(this.columnLookup, this.dataset);
 
     //Binding needs time to be processed...
     //I know, not the best solution, however: the alternative is calling the method on the
     //graph viewChild directly to add nodes/links.
     //This however might not be possible at this point because we cannot be sure the object is actually 
     //already initialized because this method might as well be called way before the ngAfterInit lifecycle hook
     let self = this;
     setTimeout(() => self.zoomToFit(), 10);
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
 
   /**
    * @returns the height that the table viewer component will need for this table
    */
   getHeightForTableViewer(table : TableSchema) : number
   {
     //CAUTION, this function depends on the values set in the frontend
     //If these values change (like the height of certain elements), 
     //this formula needs to be adjusted as well
     return (table.columns.length * 30) + 50;
   }
}
