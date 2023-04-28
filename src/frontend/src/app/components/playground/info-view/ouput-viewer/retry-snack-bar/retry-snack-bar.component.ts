import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-retry-snack-bar',
  templateUrl: './retry-snack-bar.component.html',
  styleUrls: ['./retry-snack-bar.component.scss']
})
export class RetrySnackBarComponent implements OnInit {

  constructor() { }

  @Input()
  text: string = "";
  
  ngOnInit(): void {
  }

}
