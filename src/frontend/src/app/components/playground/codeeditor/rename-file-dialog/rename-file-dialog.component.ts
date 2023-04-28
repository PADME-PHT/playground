import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditorFile } from 'src/app/model/editor-file';
import { FileManager } from 'src/app/services/file-manager';

@Component({
  selector: 'app-rename-file-dialog',
  templateUrl: './rename-file-dialog.component.html',
  styleUrls: ['./rename-file-dialog.component.scss']
})
export class RenameFileDialogComponent implements OnInit {

  public fileName: FormControl;
  public initialFileName: string;

  constructor(
    public dialogRef: MatDialogRef<RenameFileDialogComponent>,
    public fileManager: FileManager, 
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  )
  {
    this.initialFileName = data.name;
    this.fileName = new FormControl(data.name);
  }

  ngOnInit(): void {
  }

  getErrorMessage() {
    if (this.fileName.hasError('required')) {
      return 'Please enter a file name';
    }

    return 'File already exists'
  }

  Cancel(): void {
    this.dialogRef.close();
  }

  Rename(): void{
    if (!this.fileName.invalid)
    {
      this.dialogRef.close(this.fileName.value);
    }
  }

}
