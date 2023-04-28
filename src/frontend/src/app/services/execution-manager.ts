import { Injectable} from '@angular/core';
import { shareReplay, Observable, of, Subject } from 'rxjs';
import { ExecutionEvent } from '../model/ExecutionEvent';
import { ExecutionResult } from '../model/execution-result';
import { ApiClientService } from './api-client/api-client';

@Injectable({
  providedIn: 'root'
})
export class ExecutionManagerService {

  private events: ExecutionEvent[] = [];
  private resultsCache: Observable<ExecutionResult[]> = of([]);
  private resultsValid: boolean = true;

  constructor(private apiClient: ApiClientService) {
    //Subscribe to updates about errors when fetching the execution events
    this.apiClient.executionEventUpdateFailure.subscribe((update) => {
      this.executionEventUpdateFailure.next(update);
    });
  }
  
  //------------------ private Methods ------------------
  /**
   * Handles the start of a new execution
   */
  handleNewExecution()
  {
    this.events = []

    //start long polling and add events
    this.apiClient.listeningForExecutionEvents().subscribe((event) => {
      this.events.push(event);
      this.newExecutionEvent.next(event);
    });
  }

  /**
   * Handles the stop of a execution
   */
  handleExecutionStop()
  {
    this.apiClient.stopListeningForExecutionEvents();
  }

  //------------------ public Methods ------------------
  /**
   * Subject is fired whenever a new execution starts or ends
   * the boolean indicates whether the execution started or ended
   * true = started, false = ended
  */
  public executionStateChangedEvent = new Subject<boolean>();
  
  /**
   * Subject is fired whenever there is a new execution Event available
   */
  public newExecutionEvent = new Subject<ExecutionEvent>();

  /**
   * Subject is fired when there is an error while updating the executionState
   * first parameter is a error message and the second whether the error has been resolved
   */
  public executionEventUpdateFailure = new Subject<[string, boolean]>(); 

  /**
   * Returns all events of the current execution
   */
  public get executionEvents(): ExecutionEvent[]
  {
    return this.events;
  }

 /**
  * @param cache Whether to use cached results
  * @returns the current execution results
  */
  public getExecutionResults(cache: boolean = true): Observable<ExecutionResult[]>
  {
    if (this.resultsValid && cache)
    {
      return this.resultsCache;
    }

    //Update the cache
    this.resultsCache = this.apiClient.getExecutionResults().pipe(
      shareReplay(1)
    );
    return this.resultsCache;
  }

  /**
   * Whether there is currently an execution running
   */
  public isExecuting: boolean = false;

  /**
   * Whether there has already been an execution
   */
  public hasExecuted: boolean = false;

  /**
   * Notifies everyone that is interested that a new execution has started
   */
   notifyExecutionStarted() : void
   {
    this.hasExecuted = true;
    this.isExecuting = true; 
    this.handleNewExecution(); 
    this.executionStateChangedEvent.next(true);
   }
 
   /**
    * Notifies everyone that is interested that the last execution has ended
    */
  notifyExecutionEnded(): void{
    this.isExecuting = false;
    this.resultsValid = false;
    this.handleExecutionStop(); 
    this.executionStateChangedEvent.next(false);
   }
}
