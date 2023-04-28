import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors } from '@angular/forms';
import { FileManager } from '../services/file-manager';

@Directive({
  selector: '[appFileValidator]', 
  providers: [{
    provide: NG_VALIDATORS, 
    useExisting: FileValidatorDirective,
    multi: true
}]
})
export class FileValidatorDirective {

  @Input('ignoreFile') ignoreFile!: string;

  constructor(public fileManager : FileManager) { }

  validate(control: AbstractControl): ValidationErrors | null
  {
    let name = control.value;

    //Check if the check for this file should be ignored (useful for renaming files)
    if (this.ignoreFile && name == this.ignoreFile)
    { 
      return null;   
    }

    //Otherwise: check if file exists
    if (this.fileManager.fileExists(name))
    {
      return { fileExists: {} };
    }
    return null;
  }

}
