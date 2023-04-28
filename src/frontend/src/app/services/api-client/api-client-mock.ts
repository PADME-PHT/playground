import { HttpClient } from '@angular/common/http';
import { Statement } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { Observable, of, delay, from, concatMap} from 'rxjs';
import { EditorFile } from 'src/app/model/editor-file';
import { ExecutionEvent } from 'src/app/model/ExecutionEvent';
import { ExecutionResult } from 'src/app/model/execution-result';
import { environment } from 'src/environments/environment';
import { StateManagerService } from '../state-manager/state-manager';
import { ApiClientService } from './api-client';

@Injectable({
  providedIn: 'root'
})
export class ApiClientServiceMock extends ApiClientService {

  private eventObserver!: Observable<ExecutionEvent>;

  constructor(httpClient: HttpClient, stateManager: StateManagerService)
  {
    super(httpClient, stateManager)
  }

  /**
 * Triggers a new execution with the given route and files
 * @param files The files that should be executed
 * @returns 
 */
  public override startExecution(files: EditorFile[]): Observable<Response>
  {
    if (this.stateManager.getSessionId() != environment.defaultSessionId)
    {
      return super.startExecution(files);
    }
    return of(new Response());
  }
  
  /**
   * Simulates an execution
   * @returns 
   */
  public override listeningForExecutionEvents(): Observable<ExecutionEvent>
  {
    if (this.stateManager.getSessionId() != environment.defaultSessionId)
    {
      return super.listeningForExecutionEvents();
    }

    let events = [
      {
        "id": 0,
        "type": "BuildStart",
        "message": "",
        "station": ""
      },
      {
        "id": 1,
        "type": "Build",
        "message": "Step 1/5 : FROM python:3.8",
        "station": ""
      },
      {
        "id": 2,
        "type": "Build",
        "message": "---> 4544558e07c5",
        "station": ""
      },
      {
        "id": 3,
        "type": "BuildEnd",
        "message": "",
        "station": ""
      },
      {
        "id": 4,
        "type": "ExecutionStart",
        "message": "",
        "station": "5bce186a-5005-4ca8-878e-9d8d4e0747c0"
      },
      {
        "id": 5,
        "type": "Execution",
        "message": "Welcome to the PADME Playground!",
        "station": "5bce186a-5005-4ca8-878e-9d8d4e0747c0"
      },
      {
        "id": 6,
        "type": "ExecutionEnd",
        "message": "",
        "station": "5bce186a-5005-4ca8-878e-9d8d4e0747c0"
      },
      {
        "id": 7,
        "type": "ExecutionStart",
        "message": "",
        "station": "d7b0a9a7-07fd-4a31-b93a-3c946dc82667"
      },
      {
        "id": 8,
        "type": "Error",
        "message": "Something went wrong",
        "station": "d7b0a9a7-07fd-4a31-b93a-3c946dc82667"
      },
      {
        "id": 9,
        "type": "ExecutionFailed",
        "message": "",
        "station": ""
      }
    ] as ExecutionEvent[];

    //Emit each item separately with 1 sek delay
    this.eventObserver =  from(events).pipe(
      concatMap(item => of(item).pipe(
        delay(400)
      ))
    );
    return this.eventObserver;
  }

  /**
   * Cancels a current execution
   * @returns 
   */
   public override cancelExecution(): Observable<Response>
   {
    if (this.stateManager.getSessionId() != environment.defaultSessionId)
    {
      return super.cancelExecution();
    }
    return of(new Response());
   }
  
   /**
   * @returns An observable to a single dataset instance 
   */
  public override getExecutionResults(): Observable<ExecutionResult[]> {
    if (this.stateManager.getSessionId() != environment.defaultSessionId)
    {
      return super.getExecutionResults();
    }

    let sessionResults = [
      {
        name: "usr",
        path: "/usr",
        changeType: 0,
        children: [
          {
            name: "src",
            path: "/usr/src",
            changeType: 0,
            children: [
              {
                name: "app",
                path: "/usr/src/app",
                changeType: 0,
                children: [
                  {
                    name: "demofile2.txt",
                    path: "/usr/src/app/demofile2.txt",
                    changeType: 1,
                    children: []
                  },
                  {
                    name: "demo.json",
                    path: "/usr/src/app/demo.json",
                    changeType: 1,
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }, 
      {
        name: "test",
        path: "/test",
        changeType: 0,
        children: [
          {
            name: "deleted",
            path: "/test/deleted",
            changeType: 2,
            children: []
          }, 
          {
            name: "added",
            path: "/test/added",
            changeType: 1,
            children: []
          }, 
          {
            name: "modified",
            path: "/test/modified",
            changeType: 0,
            children: []
          }, 
        ]
      }, 
      {
        name: "filetest",
        path: "/filetest",
        changeType: 0,
        children: []
      }, 
      {
        name: "scrollbartest",
        path: "/scrollbartest",
        changeType: 0,
        children: [
          {
            name: "test1",
            path: "/scrollbartest/test1",
            changeType: 0,
            children: []
          }, 
          {
            name: "test2",
            path: "/scrollbartest/test2",
            changeType: 0,
            children: []
          }, 
          {
            name: "test3",
            path: "/scrollbartest/test3",
            changeType: 0,
            children: []
          }, 
          {
            name: "test4",
            path: "/scrollbartest/test4",
            changeType: 0,
            children: []
          },
          {
            name: "test5",
            path: "/scrollbartest/test5",
            changeType: 0,
            children: []
          },
          {
            name: "test6",
            path: "/scrollbartest/test6",
            changeType: 0,
            children: []
          },
          {
            name: "test7",
            path: "/scrollbartest/test7",
            changeType: 0,
            children: []
          },
          {
            name: "test8",
            path: "/scrollbartest/test8",
            changeType: 0,
            children: []
          },
          {
            name: "test9",
            path: "/scrollbartest/test9",
            changeType: 0,
            children: []
          },
          {
            name: "test10",
            path: "/scrollbartest/test10",
            changeType: 0,
            children: []
          },
          {
            name: "test11",
            path: "/scrollbartest/test11",
            changeType: 0,
            children: []
          },
          {
            name: "test12",
            path: "/scrollbartest/test12",
            changeType: 0,
            children: []
          },
          {
            name: "test13",
            path: "/scrollbartest/test13",
            changeType: 0,
            children: []
          },
          {
            name: "test14",
            path: "/scrollbartest/test14",
            changeType: 0,
            children: []
          },
        ]
      }
    ];
    return of(sessionResults).pipe(
      delay(500) //Simulate latency
    );
  }

  public override downloadExecutionResult(target: string) : Observable<Blob>
  {
    if (this.stateManager.getSessionId() != environment.defaultSessionId)
    {
      return super.downloadExecutionResult(target);
    }

    if (target == "/usr/src/app/demofile2.txt")
    {
      return of(new Blob(["Some test content"])).pipe(
        delay(200) //Simulate latency
      );
    } else if (target == "/usr/src/app/demo.json")
    {
      let content = {
        firstName: "John",
        lastName: "Smith",
        isAlive: true,
        age: 27,
        address: {
          "streetAddress": "21 2nd Street",
          "city": "New York",
          "state": "NY",
          "postalCode": "10021-3100"
        },
        phoneNumbers: [
          {
            type: "home",
            number: "212 555-1234"
          },
          {
            type: "office",
            number: "646 555-4567"
          }
        ],
        children: [
            "Catherine",
            "Thomas",
            "Trevor"
        ],
        spouse: null
      }
      return of(new Blob([JSON.stringify(content, null, '\t')])).pipe(
        delay(200) //Simulate latency
      );
    }
    return of(new Blob([""]));
  }
}