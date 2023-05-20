import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Route } from 'src/app/model/route';

@Component({
  selector: 'app-select-fl-dialog',
  templateUrl: './select-fl-dialog.component.html',
  styleUrls: ['./select-fl-dialog.component.scss']
})
export class SelectFLDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<SelectFLDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public route: Route
  ) { }

  ngOnInit(): void {
  }

  Cancel(): void {
    this.dialogRef.close(false);
  }

  Confirm(): void {
    this.dialogRef.close(this.route);
  }
}
