import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { find } from 'lodash';
import { catchError, Observable, of, concatMap, from, map } from 'rxjs';
import { EditorFile } from 'src/app/model/editor-file';
import { EditorFileType } from 'src/app/model/editor-file-type';
import { ApiClientService } from 'src/app/services/api-client/api-client';
import { ExecutionManagerService } from 'src/app/services/execution-manager';
import { FileDownloadService } from 'src/app/services/file-download';
import { environment } from 'src/environments/environment';
import { FileManager } from '../../../services/file-manager';
import { SessionTerminatedDialogComponent } from '../session-terminated-dialog/session-terminated-dialog.component';
import { DeleteFileDialogComponent } from './delete-file-dialog/delete-file-dialog.component';
import { NewFileDialogComponent } from './new-file-dialog/new-file-dialog.component';
import { OverwriteFileDialogComponent } from './overwrite-file-dialog/overwrite-file-dialog.component';
import { RenameFileDialogComponent } from './rename-file-dialog/rename-file-dialog.component';
import { TemplateDialogComponent } from './template-dialog/template-dialog.component';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';
import { UploadFileDialogComponent } from './upload-file-dialog/upload-file-dialog.component';
import { EditorFilePurpose } from 'src/app/model/editor-file-purpose';

@Component({
  selector: 'app-codeeditor',
  templateUrl: './codeeditor.component.html',
  styleUrls: ['./codeeditor.component.scss']
})
export class CodeeditorComponent implements OnInit {

  constructor(
    public dialog: MatDialog,
    public fileManager: FileManager, 
    public stateManager: StateManagerService,
    private snackBar: MatSnackBar, 
    private apiClient: ApiClientService,
    private executionManager: ExecutionManagerService, 
    private fileDownloader: FileDownloadService,
  ) {

    //Update the visualization if the execution finishes
    this.executionManager.executionStateChangedEvent.subscribe((state) => {
      if (!state) {
        this.executing = false;
      }
    });
   }

  //Current position of the context menu
  menuTopLeftPosition = { x: '0', y: '0' } 
  
  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger!: MatMenuTrigger; 
  
  @ViewChild('fileList') fileList!: MatSelectionList;

  private changedFiles: EditorFile[] = [];

  //This is updated with the index of the selectedFile
  public selectedOptions: number[] = [0];
  public selectedIndex?: number = 0;
  public unsupportedType = EditorFileType.unsupported;
  public executing = false;
  public canceled = false;
  // This is a rather hacky way to save the state of the selected file mode and should be replaced with file attributes


  ngOnInit(): void {}

  fileSelectionChanged() {
    //switch the viewed file
    this.selectedIndex = this.selectedOptions[0];
  }

  hasEqualPurpose(purpose: string) {
    if((this.stateManager.getCurrentPurpose() == EditorFilePurpose.execution && purpose == "execution") || (this.stateManager.getCurrentPurpose() == EditorFilePurpose.aggregation && purpose == "aggregation")) {
      return true;
    }
    return false;
  }

  setCurrentPurpose(purpose: string) {
    if(purpose == "execution") {
      this.stateManager.setCurrentPurpose(EditorFilePurpose.execution);
    } else if(purpose == "aggregation") {
      this.stateManager.setCurrentPurpose(EditorFilePurpose.aggregation);
    }
  }

  openNewFileDialog() {
    let dialogRef = this.dialog.open(NewFileDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      //Dialog was successful
      if (result)
      {
        //Check if this is the first file
        let first = !this.fileManager.hasFiles();
        this.fileManager.addFile(result); 
        this.changedFiles.push(result);
        if (first)
        {
          this.selectedIndex = 0;  
        }
      }
    });
  }

  /**
   * Shows a dialog that asks the user whether a already existing file should be overwritten
   * @param file 
   */
  showOverwriteFileDialog(file: EditorFile) : Observable<boolean>
  {
    let dialogRef = this.dialog.open(OverwriteFileDialogComponent,
    {
      data: {name: file.name}
    })
    
    return dialogRef.afterClosed();
  }
  
  /**
   * Checks if there are files that match the selected mode
   * @returns true if there are files that match the selected mode
   */
  hasFiles() {
    let found = false;
    this.fileManager.files.forEach((file) => {
      if(file.purpose == this.stateManager.getCurrentPurpose()) {
        found = true;
      }
    });
    return found;
  }

  /**
   * Adds multiple files to the editor
   * @param files 
   */
  addMultipleFiles(files: EditorFile[])
  {
    //Check if this is the first file
    let first = !this.fileManager.hasFiles();   
   
    this.fileManager.addFiles(files);
    this.changedFiles = this.changedFiles.concat(files);
    if (first)
    {
      this.selectedIndex = 0;  
    }
  }

  /**
   * Opens the dialog that lets users select files from a template
   */
  openTemplateDialog() {
    let dialogRef = this.dialog.open(TemplateDialogComponent);
    
    dialogRef.afterClosed().subscribe(result => {
      //Dialog was successful
      if (result)
      {
        this.addMultipleFiles(result);
      }
    });
  }

  openContextMenu(event: MouseEvent, fileIndex: number)
  {
     event.preventDefault();

     // we record the mouse position in our object 
     this.menuTopLeftPosition.x = event.clientX + 'px'; 
     this.menuTopLeftPosition.y = event.clientY + 'px'; 

     // we open the menu 
     // we pass to the menu the information about our object
     this.matMenuTrigger.menuData = {index: fileIndex} 

     // we open the menu 
     this.matMenuTrigger.openMenu(); 
  }

  /**
   * Opens a dialog that lets the user rename a certain file
   * @param index 
   */
  renameFile(index: number)
  {
    let file = this.fileManager.files[index];
    let dialogRef = this.dialog.open(RenameFileDialogComponent, {
      data: {name: file.name}
    });

    dialogRef.afterClosed().subscribe(result => {
      //Dialog was successful
      if (result)
      {
        file.name = result;
      }
    });
  }

  /**
   * Opens a dialog that asks of people really want to delete the file
   * @param index 
   */
  deleteFile(index: number)
  {
    let dialogRef = this.dialog.open(DeleteFileDialogComponent, {
      data: {name: this.fileManager.files[index].name}
    });

    dialogRef.afterClosed().subscribe(result => {
      //Dialog was successful
      if (result)
      {
        //Delete the file
        let removed = this.fileManager.removeFileAtIndex(index);
        this.changedFiles = this.changedFiles.filter(x => x != removed);

        //Reset selected file to undefined
        this.selectedIndex = undefined;
      }
    });
  }
  
  /**
   * Downloads all files
   */
  downloadAllFiles()
  {
    this.changedFiles = [];
    this.fileDownloader.downloadAllFilesFromFileManager();
  }

  /**
   * Downloads a specific file by the given index
   * @param index 
   */
  downloadFile(index: number)
  {
    let downloaded = this.fileDownloader.downloadFileByIndex(index);
    this.changedFiles = this.changedFiles.filter(x => x != downloaded);
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
   * Adds the file as changed if it does not already exist
   * @param file 
   */
  addChangedFile(file: EditorFile)
  {
    //Check if the file is already in the changed files
    if (!this.changedFiles.includes(file))
    {
      this.changedFiles.push(file);  
    }
  }

  /**
   * The content of a file has been updated
   * @param index 
   * @param content 
   */
  fileUpdated(index: number, content: string)
  {
    let file = this.fileManager.files[index]; 
    file.content = content;
    this.addChangedFile(file);
  }

  /**
   * Checks if we have the needed files
   */
  checkIfExecutionPossible(): boolean
  {
    if (!this.fileManager.hasOneDockerfile())
    {
      this.openSnackBar("Failed to execute: Please provide exactly one Dockerfile.", ['error-snackbar']);
      return false;
    }
    return true;
  }

  /**
   * Opens a snackbar that displays an error message for starting a execution
   */
  openErrorExecutionSnackbar()
  {
    this.openSnackBar("Execution could not be started, please try again.", ['error-snackbar']);
  }

  /**
   * Opens a snackbar that displays an error message for canceling the execution
   */
  openErrorCancelSnackbar()
  {
    this.openSnackBar("Execution could not be canceled, please try again.", ['error-snackbar']);
  }

  /**
   * Opens a snackbar that informs the user that a cancelation request was send
   */
  showExecutionRequestSendSnackbar()
  {
    this.openSnackBar("Send request to cancel current execution.", []);
  }

  /**
   * 
   */
  showSessionTerminatedPopup()
  {
    //Dialog not closeable, navigates back to main page
    this.dialog.open(SessionTerminatedDialogComponent, {disableClose: true});
  }

  /**
   * @returns whether there are unsaved changes
   */
  hasChanges() : boolean
  {
    if (environment.preventLeaveOnFileChanges)
    {
      return this.changedFiles.length > 0;
    }
    return false;
  }

  /**
   * overwrites the contents of provided file with the provided contents
   * @param file 
   */
  overwriteFile(file: EditorFile)
  { 
    let targetFile = find(this.fileManager.files, { name: file.name });
    if (targetFile)
    {
      targetFile.content = file.content;
      this.addChangedFile(targetFile);
    }
  }

  /**
   * Shows a dialog that allows the user to upload files
   */
  uploadFile() : void
  {
    let dialogRef = this.dialog.open(UploadFileDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      //Dialog was successful
      if (result)
      {
        let files = result as EditorFile[];
        let overwrite = files.filter((file) => this.fileManager.fileExists(file.name,this.stateManager.getCurrentPurpose()));
        let add = files.filter((file) => !this.fileManager.fileExists(file.name,this.stateManager.getCurrentPurpose()))
        this.addMultipleFiles(add);

        //Ask user for each overwrite file whether this should be overwritten
        from(overwrite).pipe(
          concatMap((file) => this.showOverwriteFileDialog(file).pipe(
            map(res => (
              {
                overwrite: res,
                file: file
              }
            ))
          ))
        ).subscribe((res) => {
          if (res.overwrite)
          {
            this.overwriteFile(res.file);
          }
        });
      }
    });
  }

  /**
   * Executes the code in the playground
   */
  execute() : void
  {
    this.executing = true;
    this.canceled = false;

    if (!this.checkIfExecutionPossible())
    {
      this.executing = false;
      return;
    }

    //Can execute, lets go
    this.apiClient.startExecution(this.fileManager.files).pipe(catchError(e => {
      console.log(e);
      if (e.status && e.status == 404)
      {
        //Session has been terminated because of inactivity, show banner
        this.showSessionTerminatedPopup();
      } else
      {
        this.openErrorExecutionSnackbar();     
      }
      this.executing = false;
      return of(undefined);
    })).subscribe(result => 
    {
      if (result !== undefined)
      {
        //Execution has successfully started
        this.executionManager.notifyExecutionStarted();
      }
    });
  }

   /**
   * Executes the code in the playground
   */
  cancelExecution() : void
  {
    this.canceled = true;
    this.apiClient.cancelExecution().pipe(catchError(e => {
      console.log(e);
      if (e.status && e.status == 404)
      {
        //Session has been terminated because of inactivity, show banner
        this.showSessionTerminatedPopup();
      } else
      {
        this.openErrorCancelSnackbar();     
      }
      this.canceled = false;
      return of(undefined);
    })).subscribe(result => 
    {
      if (result !== undefined)
      {
        //Execution has successfully started
        this.showExecutionRequestSendSnackbar();
      }
    });
  }
}
