import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import * as CodeMirror from 'codemirror';
import { find } from 'lodash';
import { ExecutionEvent, LISTENING_FAILED } from 'src/app/model/ExecutionEvent';
import { Route } from 'src/app/model/route';
import { ExecutionManagerService } from 'src/app/services/execution-manager';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';
import { RetrySnackBarComponent } from './retry-snack-bar/retry-snack-bar.component';

@Component({
  selector: 'app-ouput-viewer',
  templateUrl: './ouput-viewer.component.html',
  styleUrls: ['./ouput-viewer.component.scss']
})
export class OuputViewerComponent implements OnInit {

  sliderColor: ThemePalette = 'accent';
  events: ExecutionEvent[] = [];
  selectedStation: FormControl;
  route: Route;
  public showBuildDetails = true;

  private retrySnackBar: MatSnackBarRef <RetrySnackBarComponent> | undefined;
    
  @ViewChild('editor') editor!: CodemirrorComponent; 

  constructor(
    private executionManager: ExecutionManagerService,
    private snackBar: MatSnackBar,
    private stateManager: StateManagerService)
  { 
    this.route = stateManager.getRoute();
    this.selectedStation = new FormControl(this.route.halts.map(halt => halt.station.id));
    this.selectedStation.valueChanges.subscribe(() => {
      this.refilterContent();
    });
  }
  ngOnInit(): void {
    //Show the correct snackbars while reconnecting to backend
    this.executionManager.executionEventUpdateFailure.subscribe((update) => {
      console.log(update);
      if (update[1])
      {
        this.retrySnackBar = undefined;
        this.showReconnectedSnackbar(update[0]); 
      } else {
        this.showRetrySnackBar(update[0]);  
      }
    });
  }

  ngAfterViewInit()
  {
    //Unfortunately, codemirror is initialized asynchronously. 
    //This means, that there is no way for us to know, when the internal
    //initialization of the codemirror object in the editor view child is completed
    //However: we need this object in order to display the events
    //Therefore: We do the only thing that is possible: Wait for completion and retry till completed.
    this.executeWhenCodeMirrorIsInitialized(() => 
    {
      //Initialized, now we can proceed
      this.handleNewEvents(this.executionManager.executionEvents);
      //Apply any updates
      this.executionManager.newExecutionEvent.subscribe((event) => {
        this.handleNewEvents([event]);
      });

      //Reset when new execution starts
      this.executionManager.executionStateChangedEvent.subscribe((executing) => {
        if (executing) {
          this.resetContent();
          this.resetEvents();
          this.handleNewEvents(this.executionManager.executionEvents);
        }
      });
    });
  }

  /**
   * Recursively calls it self and waits for codeMirror to initialize
   * @param callback Callback that should be executed when codemirror is initialized
   */
  executeWhenCodeMirrorIsInitialized(callback: Function)
  {
    setTimeout(() => {
      if (this.editor?.codeMirror)
      {
        callback(); 
      } else {
        this.executeWhenCodeMirrorIsInitialized(callback);
      }
    }, 10);
    //it seems the initialization is pretty fast but not immediate,
    //therefore, 10 ms should be enough
  }

  /**
   * Clears all current content
   */
  resetContent()
  {
    this.editor.codeMirror?.setValue("");
  }

  /**
   * Clears the current events
   */
  resetEvents()
  {
    this.events = [];
  }

  /**
   * Applies the currently activated filters to the given events
   * @param events 
   */
  applyFilter(events: ExecutionEvent[])
  {
    return events.filter((event) => {
      //Build filter
      return this.showBuildDetails ? event : event.type != "Build"
    }).filter((event) => {
      //Station filter
      if (event.station != "" && (event.type == "Execution" || event.type == "Error"))
      {
        if (this.selectedStation.value.includes(event.station)) {
          return event;
        } else {
          return false;
        }
      }
      return event;
    });
  }

  /**
   * Creates a formatted message that identifies 'special' points in the execution
   * @param text 
   */
  createInfoMessage(text: string)
  {
    let textLength = text.length + 2;
    let separators = 60;
    let leftSeparators = Math.floor((separators - textLength) / 2);
    let rightSeparators = Math.ceil((separators - textLength) / 2);
    return `${'='.repeat(leftSeparators)} ${text} ${'='.repeat(rightSeparators)}`;
  }

  /**
   * Returns the name of the station with the given id
   * @param id 
   */
  getStationNameFromId(id: string)
  {
    let route = this.stateManager.getRoute();
    let halt = find(route.halts, (halt) => halt.station.id == id);
    if (halt)
    {
      return halt.station.name;  
    }
    return '';
  }

  /**
   * Highlights the given line with the given length in red
   * @param line 
   * @param lineLength 
   */
  highlightErrorLine(line: number, lineLength: number)
  {
    this.editor.codeMirror?.markText({ line: line, ch: 0 }, { line: line, ch: lineLength }, {
      css: "color: #ff1f0f"
    });
  }

  /**
   * Highlights a system line in darker grey
   * @param line 
   * @param lineLength 
   */
  highlightSystemLine(line: number, lineLength: number)
  {
    this.editor.codeMirror?.markText({ line: line, ch: 0 }, { line: line, ch: lineLength }, {
      css: "color: gray"
    });
  }

  /**
   * Returns the message that should be shown for the event
   * @param event 
   */
  getMessageForEvent(event: ExecutionEvent)
  {
    switch (event.type)
    {
      case "Build": 
      case "Execution":
      case "Error":
        return event.message;
      case "BuildStart":
        return this.createInfoMessage('Building image');
      case "BuildEnd":
        return this.createInfoMessage('Image build');
      case "ExecutionStart":
        return this.createInfoMessage(`Executing at station ${this.getStationNameFromId(event.station)}`);
      case "ExecutionEnd":
        return this.createInfoMessage(`Execution finished at station ${this.getStationNameFromId(event.station)}`);
      case "AggregationStart":
        return this.createInfoMessage(`Aggregating results`);
      case "AggregationEnd":
        return this.createInfoMessage(`Aggregation finished`);
      case "ExecutionFinished":
        return this.createInfoMessage('Execution finished successfully');
      case "ExecutionCanceled":
        return this.createInfoMessage('Cancelling current execution');
      case "ExecutionFailed": 
        return this.createInfoMessage('Execution failed');
    }
  }

  /**
   * Handles the display of new events
   * @param events 
   */
  handleNewEvents(newEvents: ExecutionEvent[]) {
    if (newEvents && newEvents.length > 0) {
      if (newEvents[0] == LISTENING_FAILED)
      {
        this.handleListenFailure();
      } else {
        this.events = this.events.concat(newEvents);
        this.checkForExecutionEnd(newEvents);
        this.applyFilter(newEvents).forEach((event) => this.appendToContent(event));
      }
    }
  }
  
  /**
   * Opens a snackbar
   * @param message The message that should be shown on the snack bar
   */
  openSnackBar(message: string, action: string, classes: string[]) : MatSnackBarRef<TextOnlySnackBar>
  {
    return this.snackBar.open(message, action, {
      verticalPosition: 'bottom', 
      panelClass: classes
    });
  }

  /**
   * Snackbar shown during retries
   * @param text 
   */
  showReconnectedSnackbar(text: string)
  {
    this.openSnackBar(text, "Okay", ["success-snackbar"]);
  }

  /**
   * Snackbar shown during retries
   * @param text 
   */
  showRetrySnackBar(text: string)
  {
    //Open new snackbar if non already exists
    if (!this.retrySnackBar)
    {
      this.retrySnackBar = this.snackBar.openFromComponent(RetrySnackBarComponent); 
    }
    this.retrySnackBar.instance.text = text;
  }

  /**
   * Shows a snackbar with a warning that listening for updated failed
   */
  showListeningFailedSnackbar()
  {
    this.openSnackBar("Something went wrong while checking for execution updates, please try again or contact your administrator", "Okay", ["error-snackbar"]);
  }

  /**
   * Handles the case that listening for the events failed
   */
  handleListenFailure()
  {
    this.showListeningFailedSnackbar();
    //Notify others that the listening failed
    this.executionManager.notifyExecutionEnded();  
  }

  /**
   * Checks if the execution is finished and notifies the ExecutionManager in case
   */
  checkForExecutionEnd(events: ExecutionEvent[])
  {
    let finished = find(events, { type: "ExecutionFinished" })
    let failed = find(events, { type: "ExecutionFailed" })
    if (finished || failed)
    {
      this.executionManager.notifyExecutionEnded();  
    }
  }

  /**
   * Reapplies the filter when the filter value changes
   */
  refilterContent()
  {
    this.resetContent();
    let filtered = this.applyFilter(this.events);
    filtered.forEach((event) => this.appendToContent(event));
  }

  /**
   * 
   * @param checked 
   */
  buildDetailsChanged(checked: boolean)
  {
    this.showBuildDetails = checked;
    this.refilterContent();
  }

  /**
   * Checks whether the given execution event is a system message
   * @param event 
   * @returns 
   */
  isSystemMessage(event: ExecutionEvent)
  {
    return event.type == "BuildStart" || event.type == "BuildEnd" || event.type == "ExecutionStart"
           || event.type == "ExecutionEnd" || event.type == "ExecutionFinished";
  }

  /**
   * Appends the given events to the currently visible content
   * @param events 
   */
  appendToContent(event: ExecutionEvent)
  {
    //Check if the event is filtered
    if (this.editor.codeMirror)
    {
      let update = this.getMessageForEvent(event) + '\n';
      this.editor.codeMirror.replaceRange(update, CodeMirror.Pos(this.editor.codeMirror.lastLine()));
      let line = this.editor.codeMirror.lastLine() - 1;
      if (event.type == "Error" || event.type == "ExecutionFailed" || event.type == "ExecutionCanceled")
      {
        this.highlightErrorLine(line, update.length -1);
      }
      if (this.isSystemMessage(event)) {
        console.log(`${event.type}: ${new Date().toTimeString()}`);
        this.highlightSystemLine(line, update.length - 1);
      }
    }
  }
}
