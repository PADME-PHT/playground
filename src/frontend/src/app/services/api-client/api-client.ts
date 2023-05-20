import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, concatMap, from, Observable, of, shareReplay, Subject, Subscriber, delay, map} from 'rxjs';
import { environment } from '../../../environments/environment';
import { Organization } from '../../model/organization';
import { Dataset } from '../../model/dataset';
import { Session } from '../../model/session';
import { EditorFile } from '../../model/editor-file';
import { StateManagerService } from '../state-manager/state-manager';
import { ExecutionEvent, LISTENING_FAILED } from 'src/app/model/ExecutionEvent';
import { ExecutionResult } from 'src/app/model/execution-result';
import { range } from 'lodash';
import { EditorFilePurpose } from 'src/app/model/editor-file-purpose';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {

  //Caches the dataset details
  private datasetCache: Map<string, Observable<Dataset>>;
  private listeningForEvents: boolean = false;
  private currentRetries = 1;
  private maxRetries = 5; 
  private isFailed = false;
  private defaultTimeout = 2;
  private currentTimeout = this.defaultTimeout;

  constructor(protected httpClient: HttpClient, protected stateManager: StateManagerService) {
    this.datasetCache = new Map<string, Observable<Dataset>>();
  }

  //------------------ private Methods ------------------
  /**
   * Returns the api endpoint
   * @param endpoint 
   * @returns 
   */
  private getEndpoint(endpoint : string) : string {
    return `${environment.apiUrl}/${endpoint}`;
  }

  /**
   * Returns the key that should be used for the cache
   * @param orgaId 
   * @param stationId 
   * @param id 
   */
  private getCacheKey(orgaId: string, stationId: string, id: string)
  {
    return `${orgaId}-${stationId}-${id}`;
  }

  /**
   * Recursively queries for new execution events
   * @param subscriber 
   * @param since 
   */
  private getExecutionEventsRecursively(subscriber : Subscriber<ExecutionEvent>, since : number)
  {
    //get the next events
    this.httpClient.get<ExecutionEvent[]>(this.getEndpoint(`sessions/${this.stateManager.getSessionId()}/execution/events?since=${since}`))
      .pipe(catchError(e => {
      //Errors get handled with retires below
      console.log(e);
      return of(undefined)
    })).subscribe((events) => {
      if (events) {
        //If failed before, update
        if (this.isFailed) {
          this.isFailed = false;
          this.currentRetries = 1;
          this.currentTimeout = this.defaultTimeout;
          console.log(`Got connection again, continue to listen for events.`);
          this.executionEventUpdateFailure.next([`Successfully reconnected to backend.`, true]);
        }
        
        //Map the received events
        events.map(event => subscriber.next(event));
        since = events.length > 0 ? events[events.length - 1].id : since
      }
      
      //If we should continue to listen for events
      if (this.listeningForEvents)
      {
        //Check if last call was successful
        if (events)
        {
          //Recursive call with new since value
          this.getExecutionEventsRecursively(subscriber, since);
        } else if (this.currentRetries <= this.maxRetries) {
          //Retry on failed request
          let self = this;
          this.isFailed = true;
          console.log(`Getting events failed. Retry ${this.currentRetries} of ${this.maxRetries} with timeout ${this.currentTimeout} sek.`);
          
          //Fire event every second, notify user and then 0 retry
          let retryAtTry = this.currentRetries;
          from(range(this.currentTimeout, -1, -1)).pipe(
            concatMap(item => of(item).pipe(
              delay(1000)
            ))
          ).subscribe((number) => {
            this.executionEventUpdateFailure.next([`Failed to communicate with backend, retry ${retryAtTry} of ${this.maxRetries} in ${number} sek.`, false]);
            if (number == 0) {
              self.getExecutionEventsRecursively(subscriber, since);
            }
          }); 

          //Update values
          this.currentTimeout *= 2; 
          this.currentRetries += 1;

        } else {
          //Max retries failed
          console.log(`Getting events failed permanently. Stopped listening.`);
          subscriber.next(LISTENING_FAILED);
          subscriber.complete();
        }
      } else {
        subscriber.complete();
      }
    })
  }

  /**
   * Transfers the given array buffer to base64
   * @param arrayBuffer 
   * @returns 
   */
  private base64ArrayBuffer(arrayBuffer: ArrayBuffer) {
    //source: https://gist.github.com/jonleighton/958841 
    var base64    = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  
    var bytes         = new Uint8Array(arrayBuffer)
    var byteLength    = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength    = byteLength - byteRemainder
  
    var a, b, c, d
    var chunk
  
    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
  
      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63               // 63       = 2^6 - 1
  
      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }
  
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]
  
      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
  
      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4 // 3   = 2^2 - 1
  
      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
  
      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
  
      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
  
      base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }
    
    return base64
  }

  //------------------ public Methods ------------------

  /**
   * @returns An observable for the current available organizations including their stations and datasets
   */
  public getOrganizations(): Observable<Organization[]> {
    let param = { 'includeStations': true, 'includeDatasets': true }; 
    return this.httpClient.get<Organization[]>(this.getEndpoint('organizations'), { params: param });
  }

  /**
   * @returns An observable to a single dataset instance 
   */
  public getDataset(orgaId: string, stationId: string, id: string): Observable<Dataset> {

    let key = this.getCacheKey(orgaId, stationId, id);
    let cache = this.datasetCache.get(key);
    if (!cache)
    {
      //Create new observable that caches the last result
      cache = this.httpClient.get<Dataset>(this.getEndpoint(`organizations/${orgaId}/stations/${stationId}/datasets/${id}`)).pipe(
        shareReplay(1)
      );
      this.datasetCache.set(key, cache);
    } 
    return cache;
  }

  /**
   * Generates a session from the selected organizations, stations and data sources
   * @param organizations 
   */
  public generateSession(organizations: Organization[]): Observable<Session>
  {
    //Strip everything from the objects except the ids
    let content = organizations.map((orga) => {
      return {
        id: orga.id,
        stations: orga.stations.map((station) => {
          return {
            id: station.id,
            datasets: station.datasets.map((ds) => {
              return { 
                id: ds.id
              }
            })
          }
        })
      };
    });
    return this.httpClient.post<Session>(this.getEndpoint('sessions'), content).pipe(
      //Map the environment variables to have the same initial value as value
      map((session) => {
        return {
          ...session,
          stations: session.stations.map((station) => {
            return {
              ...station,
              envs: station.envs.map((env) => {
                return {
                  ...env,
                  initialValue: env.value
                }
              })
            }
          })
        }
      })
    )
  }

  /**
   * Triggers a new execution with the given route and files
   * @param files The files that should be executed
   * @returns 
   */
  public startExecution(files: EditorFile[]): Observable<Response>
  {
    let routes = this.stateManager.getRoute().halts.map((halt) => {
      return {
        id: halt.station.id, 
        name: halt.station.name,
        envs: halt.station.envs.map((env) => 
        {
          return {
            id: env.id, 
            name: env.name,
            //If the value was not updated, we don't provide one
            value: env.value !== env.initialValue ? env.value : undefined
          }
        }), 
        ownEnvs: halt.station.ownEnvs?.map((env) => {
          return {
            name: env.name, 
            value: env.value
          }
        })
      }
    }); 

    let content = files.map((file) => {
      return {
        name: file.name,
        contentType: file.content instanceof ArrayBuffer ? 'binary' : 'plain',
        content: file.content instanceof ArrayBuffer ? this.base64ArrayBuffer(file.content) : file.content,
        purpose: file.purpose == EditorFilePurpose.aggregation ? 'aggregation' : 'execution' 
      }
    });
    return this.httpClient.post<Response>(this.getEndpoint(`sessions/${this.stateManager.getSessionId()}/execution`), {
      route: routes,
      content: content
    });
  }

  /**
   * Cancels a current execution
   * @returns 
   */
  public cancelExecution(): Observable<Response>
  {
    return this.httpClient.post<Response>(this.getEndpoint(`sessions/${this.stateManager.getSessionId()}/execution/cancel`), {});
  }

  /**
   * Uses long polling to monitor execution events
   * @returns Observable of the execution events that ocurred, the observable fires LISTENING_FAILED when something goes wrong
   */
  public listeningForExecutionEvents(): Observable<ExecutionEvent>
  {
    console.log("Starting to listen for events");
    this.listeningForEvents = true;
    return new Observable<ExecutionEvent>(subscriber => {
      this.getExecutionEventsRecursively(subscriber, -1);      
    });
  }
  
  /**
   * Subject is fired when there is an error while updating the executionState
   * first parameter is a error message and the second whether the error has been resolved
   */
  public executionEventUpdateFailure = new Subject<[string, boolean]>(); 

  /**
   * Stops the current long polling
   */
  public stopListeningForExecutionEvents()
  {
    console.log("Stop listening for events");
    this.listeningForEvents = false;
  }

  /**
   * @returns An observable to a single dataset instance 
   */
  public getExecutionResults(): Observable<ExecutionResult[]> {
    return this.httpClient.get<ExecutionResult[]>(this.getEndpoint(`sessions/${this.stateManager.getSessionId()}/results`));
  }

  /**
   * Resolves the endpoint to download the given target
   * @param target 
   * @returns 
   */
  public downloadExecutionResult(target: string) : Observable<Blob>
  {
    return this.httpClient.get(this.getEndpoint(`sessions/${this.stateManager.getSessionId()}/results/download?path=${target}`),
    {
      responseType: 'blob'
    }); 
  }
}