import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as JSZip from 'jszip';
import { file } from 'jszip';
import { keys } from 'lodash';
import { EditorFile } from 'src/app/model/editor-file';
import { EditorFileType } from 'src/app/model/editor-file-type';
import { FileManager } from 'src/app/services/file-manager';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';

@Component({
  selector: 'app-upload-file-dialog',
  templateUrl: './upload-file-dialog.component.html',
  styleUrls: ['./upload-file-dialog.component.scss']
})
export class UploadFileDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<UploadFileDialogComponent>,
    private fileManager: FileManager,
    private stateManager: StateManagerService,
    private snackBar: MatSnackBar) { }

  
  @ViewChild('browseFiles', { read: ElementRef })
  browseFilesInput!: ElementRef;

  uploading = false;
  files: File[] = [];
  fileProgress: number[] = [];
  unzip = true;

  private zipMimeType = "application/zip";
  private finished: number = 0;
  private results: EditorFile[] = [];
  
  /**
   * Increases the counter that one file was finished and checks
   * whether all files finished
   */
  increaseFinishedCounter()
  {
    //Increase finished counter
    this.finished++;
    if (this.finished == this.files.length)
    {
      this.successCallback(this.results);
    }
  }

  /**
   * @param file The file to read
   * @param fileReader The reader to use for reading the file
   */
  loadTextFile(file: File, fileReader: FileReader)
  {
    let self = this;

    fileReader.readAsText(file);
    fileReader.onload = function () {
      //Save the results
      if (typeof fileReader.result == 'string')
      {
        self.results.push({
          name: file.name,
          content: fileReader.result,
          type: self.fileManager.getFileType(file.name),
          purpose: self.stateManager.getCurrentPurpose()
        });
      }
      self.increaseFinishedCounter();
    }
  }

  /**
   * Extracts the given contents as the result files
   * @param content 
   */
  extractZipFile(content: ArrayBuffer)
  {
    let self = this;
    let extract = new JSZip();
    extract.loadAsync(content).then(async (zip) =>  {
      let hasDirs = false;
      //Extract all files, show error when dir is contained
      for (let key of keys(zip.files))
      {
        let file = zip.files[key];
        if (file.dir)
        {
          hasDirs = true;
        } else if (file.name.indexOf('/') == -1)
        {
          let type = self.fileManager.getFileType(file.name);
          //Load content
          let content = await file.async(type == EditorFileType.unsupported ?  'arraybuffer' : 'string');
          self.results.push({
              name: file.name,
              content: content,
              type: type,
              purpose: self.stateManager.getCurrentPurpose()
          });
        }
      }
      if (hasDirs)
      {
        self.showDirSnackbar();
      }
      self.increaseFinishedCounter();
    });
  }

  /**
   * Shows a snackbar pointing out that the uploaded zip contained folders
   */
   showDirSnackbar() {
    this.snackBar.open("Because folders are not yet supported, subfolders of the zip have been ignored.", "Okay", {
      verticalPosition: 'bottom', 
      panelClass: ['error-snackbar']
    });
  }

  /**
   * @param file The file to read
   * @param fileReader The reader to use for reading the file
   */
  loadBinaryFile(file: File, fileReader: FileReader)
  {
    let self = this;

    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function () {
      //Save the results
      if (fileReader.result instanceof ArrayBuffer && file.type == self.zipMimeType && self.unzip)
      {
        //Zip file uploaded, extract
        self.extractZipFile(fileReader.result);
        return;
      }
      if (fileReader.result instanceof ArrayBuffer && (file.type != self.zipMimeType || !self.unzip))
      {
        self.results.push({
          name: file.name,
          content: fileReader.result,
          type: self.fileManager.getFileType(file.name),
          purpose: self.stateManager.getCurrentPurpose()
        });
      }
      self.increaseFinishedCounter();
    }
  }

  /**
   * 
   * @param files 
   */
  newFilesUploaded(files: File[])
  {
    this.uploading = true;
    this.files = files;
    this.fileProgress = new Array<number>(files.length);

    let self = this;

    //Load all files
    for (let fileIndex in files) {
      //Check the type, load data accordingly
      let type = self.fileManager.getFileType(files[fileIndex].name);
      
      //Create reader and track progress
      let fileReader = new FileReader();
      fileReader.onprogress = function (data) {
        if (data.lengthComputable) {
          self.fileProgress[fileIndex] = ((data.loaded / data.total) * 100)
        }
      }

      //Load the correct type of data
      if (type == EditorFileType.unsupported) {
        //Load as binary
        this.loadBinaryFile(files[fileIndex], fileReader);
      } else {
        //Load as text file
        this.loadTextFile(files[fileIndex], fileReader);
      }
    }
  }

  /**
   * Terminates the dialog with success
   * @param files 
   */
  successCallback(files: EditorFile[])
  {
    this.dialogRef.close(files);
  }

  /**
   * Triggers the file input
   */
  triggerBrowseFiles() : void 
  {
    this.browseFilesInput.nativeElement.click()
  }

  /**
   * Handles when the user browses a file
   * @param event 
   */
  handleFileBrowse(event: any)
  {
    if(event.target.files.length > 0) 
    {
      this.newFilesUploaded(Array.from(event.target.files));
    }
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes : number, decimals = 2) {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const dm = decimals <= 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
   
  /**
   * Cancels the upload
   */
  cancel()
  {
    this.dialogRef.close(false);
  }
}
