import { GraphComponent } from "@swimlane/ngx-graph";
import { ResizedEvent } from "angular-resize-event";

/**
 * Base class that provides shared logic for both viewers
 */
export class SchemaViewerBase
{
  private colorIndex: number = 0;

  /**
  * Returns the next color that should be used to highlight the tables
  * @returns a hex string for the color
  */
  getNextColor(colors: string[]) : string
  {
    if (this.colorIndex >= colors.length)
    {
      this.colorIndex = 0;
    }

    let color = colors[this.colorIndex];
    this.colorIndex += 1;
    return color;
  }
  
  /**
   * Fit the schema to the current available with and height
   */
  zoomToFit(graph: GraphComponent): void{
    if (graph)
    {
      graph.updateGraphDims();
      graph.zoomToFit();
      graph.center();
    } 
  }
  
  onResized(event: ResizedEvent, graph: GraphComponent) {
    //Resize the graph canvas, recalculate the dimensions and 
    //Update the zoom level for the new dimensions
    if (graph)
    {
      graph.dims.height = event.newRect.height; 
      graph.dims.width = event.newRect.width; 
      graph.width = event.newRect.width; 
      graph.height = event.newRect.height;
      //Same problem as everywhere
      let self = this;
      setTimeout(() => self.zoomToFit(graph), 10);
    }
  }

  
}