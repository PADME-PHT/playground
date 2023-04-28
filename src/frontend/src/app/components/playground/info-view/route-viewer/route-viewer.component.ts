import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Route } from 'src/app/model/route';

@Component({
  selector: 'app-route-viewer',
  templateUrl: './route-viewer.component.html',
  styleUrls: ['./route-viewer.component.scss']
})
export class RouteViewerComponent {

  constructor() { }

  @Input()
  public route!: Route;
  @Output() routeChange = new EventEmitter<Route>();

  routeChanged(route: Route)
  {
    this.route = route; 
    this.routeChange.emit(route);
  }
}
