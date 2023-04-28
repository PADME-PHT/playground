import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-overwrite-file-dialog',
  templateUrl: './overwrite-file-dialog.component.html',
  styleUrls: ['./overwrite-file-dialog.component.scss']
})
export class OverwriteFileDialogComponent implements OnInit {

  public fileName: string;

  constructor(
    public dialogRef: MatDialogRef<OverwriteFileDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {
    this.fileName = data.name;
  }

  ngOnInit(): void {
  }

  Cancel(): void {
    this.dialogRef.close(false);
  }

  Overwrite(): void {
    this.dialogRef.close(true)
  }
}
