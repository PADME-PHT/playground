import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileManager } from '../../../../services/file-manager';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { EditorFileType } from 'src/app/model/editor-file-type';
import { EditorFile } from 'src/app/model/editor-file';

@Component({
  selector: 'app-new-file-dialog',
  templateUrl: './new-file-dialog.component.html',
  styleUrls: ['./new-file-dialog.component.scss']
})
export class NewFileDialogComponent implements OnInit {

  public fileName = new FormControl();
  constructor(
    public dialogRef: MatDialogRef<NewFileDialogComponent>,
    public fileManager: FileManager
  ) { }

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

  CreateFile(): void{
    if (!this.fileName.invalid)
    {
        //Get the correct extension, then close the dialog
      let type = this.fileManager.getFileType(this.fileName.value);
      this.dialogRef.close({name: this.fileName.value, content: "", type: type} as EditorFile);
    }
  }
}
