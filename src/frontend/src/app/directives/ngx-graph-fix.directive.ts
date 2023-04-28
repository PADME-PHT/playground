import { Directive, Host, Optional, Self } from '@angular/core';
import { GraphComponent } from '@swimlane/ngx-graph';

@Directive({
  selector: '[appNgxGraphFix]'
})
export class NgxGraphFixDirective {

  //Inherit the graph, overwrite the methods
  constructor(@Host() @Self() @Optional() public graph: GraphComponent) 
  {
    //Overwrite methods that in my view do not work correctly
    //see: https://github.com/swimlane/ngx-graph/issues/433#issuecomment-1163628005
   
    graph.updateGraphDims = () =>
    {
      let minX = +Infinity;
      let maxX = -Infinity;
      let minY = +Infinity;
      let maxY = -Infinity;
  
      for (let node of graph.graph.nodes) {
        if (node && node.position && node.dimension)
        {
          let halfWidth = node.dimension.width / 2; 
          let halfHeight = node.dimension.height / 2;
          minX = node.position.x - halfWidth < minX ? node.position.x - halfWidth : minX;
          minY = node.position.y - halfHeight < minY ? node.position.y - halfHeight : minY;
          maxX = node.position.x + halfWidth > maxX ? node.position.x + halfWidth : maxX;
          maxY = node.position.y + halfHeight > maxY ? node.position.y + halfHeight : maxY;  
        }
      }
      
      //+10 = padding to have a little space to the sides
      graph.graphDims.width = maxX - minX;
      graph.graphDims.height = maxY - minY;
      graph.minimapOffsetX = minX;
      graph.minimapOffsetY = minY;
    }

    graph.zoomToFit = () =>
    {
      // minus 40 to have some padding to the edges
      const heightZoom = (graph.dims.height - 40) / graph.graphDims.height;
      const widthZoom = (graph.dims.width - 40) / graph.graphDims.width;
      
      let zoomLevel = Math.min(heightZoom, widthZoom, 1);
  
      if (zoomLevel < graph.minZoomLevel) {
        zoomLevel = graph.minZoomLevel;
      }
  
      if (zoomLevel > graph.maxZoomLevel) {
        zoomLevel = graph.maxZoomLevel;
      }
  
      if (zoomLevel !== graph.zoomLevel) {
        graph.zoomLevel = zoomLevel;
        graph.updateTransform();
        graph.zoomChange.emit(graph.zoomLevel);
      }
    }
    
    graph.center = () => 
    {
      //Update dimensions
      graph.updateGraphDims();
      
      let width = graph.graphDims.width / 2; 
      let height = graph.graphDims.height / 2;
      graph.panTo( graph.minimapOffsetX + width, graph.minimapOffsetY + height);
    }

    

  } 

}
