import { NestedTreeControl } from '@angular/cdk/tree';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Session } from 'inspector';
import { catchError, of } from 'rxjs';
import { ExecutionResult } from 'src/app/model/execution-result';
import { ApiClientService } from 'src/app/services/api-client/api-client';
import { ExecutionManagerService } from 'src/app/services/execution-manager';
import { saveAs } from 'file-saver';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileVisualizerComponent } from './file-visualizer/file-visualizer.component';
import { FileManager } from 'src/app/services/file-manager';
import { EditorFileType } from 'src/app/model/editor-file-type';

@Component({
  selector: 'app-results-viewer',
  templateUrl: './results-viewer.component.html',
  styleUrls: ['./results-viewer.component.scss']
})
export class ResultsViewerComponent implements OnInit {

  constructor(
    private apiClient: ApiClientService,
    private snackBar: MatSnackBar,
    public executionManager: ExecutionManagerService, 
    private fileManager: FileManager
  ) { }

  results: ExecutionResult[] = [];
  resultLoading = new Map<ExecutionResult, boolean>();
  resultVisualizable = new Map<ExecutionResult, boolean>();
  hasError = false;
  loading = false;
  visualizing: ExecutionResult | undefined;
  visualizeType: EditorFileType | undefined; 
  visualizeBlob: Blob | undefined;

  treeControl = new NestedTreeControl<ExecutionResult>(node => node.children);
  dataSource = new MatTreeNestedDataSource<ExecutionResult>();

  ngOnInit(): void {
    if (!this.executionManager.isExecuting)
    {
      this.loadResults(); 
    }
    this.executionManager.executionStateChangedEvent.subscribe((executing) => 
    {
      if (!executing)
      {
        this.loadResults();  
      }
    })
  }

  /**
   * Returns whether it can visualize the given fileType
   * @param result 
   * @returns 
   */
  canVisualize(result: ExecutionResult)
  {
    if (result.children && result.children.length > 0)
    {
      return false;  
    }
    let ext = result.name.split('.').pop();
    if (ext == result.name)
    {
      return false;  
    }
    return this.fileManager.getFileType(result.name) != EditorFileType.unsupported;
  }

  /**
   * Flattens the given execution result
   * @param result 
   * @returns 
   */
  flatten(result: ExecutionResult)
  {
    let res : ExecutionResult[] = [];
    this.flattenRecursive(result, res);
    return res;
  }

  /**
   * Flattens the given execution result recursively
   * @param result 
   * @param current 
   * @returns 
   */
  flattenRecursive(result: ExecutionResult, current: ExecutionResult[]) : ExecutionResult[]
  {
    current.push(result); 
    result.children.forEach(child => this.flattenRecursive(child, current));
    return current;
  }
  
  /**
   * @param cache Whether to use cached data (default = true)
   */
  loadResults(cache: boolean = true)
  {
    this.hasError = false;
    this.loading = true;
    //Load the results
    this.executionManager.getExecutionResults(cache).pipe(catchError(e => {
      console.log(e);
      this.hasError = true;
      return of(undefined);
    })).subscribe((result) => {
      this.loading = false;
      if (result)
      {
        this.results = result;
        let flattenResults = this.results.flatMap(res => this.flatten(res));
        flattenResults.forEach(elem => this.resultLoading.set(elem, false));
        flattenResults.forEach(elem => this.resultVisualizable.set(elem, this.canVisualize(elem)))
        this.dataSource.data = result;
        this.treeControl.dataNodes = this.dataSource.data;
        this.treeControl.expandAll();
      }
    });
  }
  

  /**
   * 
   * @param message The message that should be shown on the snack bar
   */
  openSnackBar(message: string, classes: string[]) {
    this.snackBar.open(message, "Okay", {
      verticalPosition: 'bottom', 
      panelClass: classes
    });
  }

  /**
   * Opens a snackbar that shows an indicator, that a file could not be downloaded
   */
  openFileDownloadErrorSnackBar()
  {
    this.openSnackBar("Something went wrong while downloading the file, please try again", ["error-snackbar"])
  }
  
  /**
   * Triggers the download for the file with the given path
   * @param path 
   */
  downloadFile(elem: ExecutionResult)
  {
    this.resultLoading.set(elem, true);
    this.apiClient.downloadExecutionResult(elem.path).pipe(catchError(e => {
      console.log(e);
      this.openFileDownloadErrorSnackBar();
      this.resultLoading.set(elem, false);
      return of(undefined);
    })).subscribe((blob) => {
      this.resultLoading.set(elem, false);
      if (blob) {
        let name = elem.name.split('.').pop() == elem.name ? `${elem.name}.tar` : elem.name;
        saveAs(blob, name);
      }
    });
  }

  /**
   * Views a files content
   * @param elem 
   */
  viewFile(elem: ExecutionResult)
  {
    this.resultLoading.set(elem, true);
    this.apiClient.downloadExecutionResult(elem.path).pipe(catchError(e => {
      console.log(e);
      this.openFileDownloadErrorSnackBar();
      this.resultLoading.set(elem, false);
      return of(undefined);
    })).subscribe((blob) => {
      this.resultLoading.set(elem, false);
      this.visualizing = elem;
      this.visualizeBlob = blob;
      this.visualizeType = this.fileManager.getFileType(elem.name);
    });
  }

  /**
   * Is called when someone goes back from the file visualizer
   */
  visualizingBack()
  {
    this.visualizing = undefined;
    this.visualizeType = undefined; 
    this.visualizeBlob = undefined;
  }

  /**
   * Retry to load results on error
   */
  retry()
  {
    this.loadResults(false);
  }

  hasChild = (_: number, node: ExecutionResult) => !!node.children && node.children.length > 0;

}
