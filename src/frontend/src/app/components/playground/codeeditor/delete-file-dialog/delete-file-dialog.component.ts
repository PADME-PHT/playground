import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-file-dialog',
  templateUrl: './delete-file-dialog.component.html',
  styleUrls: ['./delete-file-dialog.component.scss']
})
export class DeleteFileDialogComponent implements OnInit {
  
  public fileName: string;

  constructor(
    public dialogRef: MatDialogRef<DeleteFileDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {
    this.fileName = data.name;
  }

  ngOnInit(): void {
  }

  Cancel(): void {
    this.dialogRef.close(false);
  }

  Confirm(): void {
    this.dialogRef.close(true)
  }
}
