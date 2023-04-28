import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Route } from 'src/app/model/route';

@Component({
  selector: 'app-route-selector',
  templateUrl: './route-selector.component.html',
  styleUrls: ['./route-selector.component.scss']
})
export class RouteSelectorComponent implements OnInit {

  @Input()
  public disabled: boolean = false;
  @Input()
  public route!: Route;
  @Output() routeChange = new EventEmitter<Route>();
  
  constructor() { }

  ngOnInit(): void { }
  
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.route.halts, event.previousIndex, event.currentIndex);

    //emit change event
    this.routeChange.emit(this.route);
  }
}
