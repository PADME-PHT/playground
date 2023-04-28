import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FileDownloadService } from 'src/app/services/file-download';

@Component({
  selector: 'app-session-terminated-dialog',
  templateUrl: './session-terminated-dialog.component.html',
  styleUrls: ['./session-terminated-dialog.component.scss']
})
export class SessionTerminatedDialogComponent {

  constructor(
    private router: Router,
    public dialogRef: MatDialogRef<SessionTerminatedDialogComponent>,
    private fileDownloader: FileDownloadService
  ) { }

  goBackWithout = false;
  filesDownloaded = false;

  downloadFiles()
  {
    this.fileDownloader.downloadAllFilesFromFileManager(); 
    this.filesDownloaded = true;
  }

  goBack()
  {
    //Bit dirty, but: If we got back with angular routing, 
    //you still have the whole app state
    let link = document.createElement("a"); 
    link.href = "/"
    link.click(); 
    link.remove();
  }

  goBackWithoutChanged(value: boolean)
  { 
    this.goBackWithout = value;
  }
}
