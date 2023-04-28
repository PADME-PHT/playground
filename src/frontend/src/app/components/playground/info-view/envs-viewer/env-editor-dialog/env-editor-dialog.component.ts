import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EnvironmentVariable } from 'src/app/model/environment-variable';
import { find } from 'lodash';
import { ifStmt } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-env-editor-dialog',
  templateUrl: './env-editor-dialog.component.html',
  styleUrls: ['./env-editor-dialog.component.scss']
})
export class EnvEditorDialogComponent {

  public mode: "Edit" | "Create";
  public value = new FormControl();
  public name = new FormControl();
  public initialValue: string; 
  public initialName: string;
  public existingEnvs: EnvironmentVariable[];
  public showMultiOption: boolean; 
  public multipleSelected: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EnvEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data:
      {
        mode: "Edit" | "Create",
        env: EnvironmentVariable,
        existingEnvs: EnvironmentVariable[],
        valueChangeable: boolean, 
        showMultiOption: boolean
      }
  ) {
    //Options
    this.mode = data.mode;
    this.showMultiOption = data.showMultiOption;
    this.existingEnvs = data.existingEnvs; 
    
    //Environment Variable Info
    if (data.env)
    {
      this.value.setValue(data.env.value); 
      this.name.setValue(data.env.name);
    } else {
      this.value.setValue(""); 
      this.name.setValue("");
    }

    //Set initial values (needed to detect changes and make proper validation)
    this.initialName = this.name.value; 
    this.initialValue = this.value.value

    //Setup name validators
    this.name.setValidators([
      Validators.required,
      Validators.pattern(/^[A-Za-z0-9\_]*$/), 
      this.createValidateEnvDoesNotExist(this.initialName, this.existingEnvs)
    ])

    //Disable edit when requested, otherwise setup validators
    if (!data.valueChangeable)
    {
      this.value.disable();
    } else {
      this.value.setValidators(Validators.required);
    }
  }

  /**
   * Validates if a variable with a given name already exists
   * @param control 
   * @returns 
   */
  createValidateEnvDoesNotExist(initialName: string, existing: EnvironmentVariable[]): ValidatorFn
  {
    return (control: AbstractControl) => 
    {
      let name = control.value;
      //If the name did not change of course a variable with that name exists (the variable itself)
      if (name != initialName && find(existing, { name: control.value }))
      {
        return { variableExists: {} };  
      }
  
      return null;   
    }
  }

  getNameErrorMessage() : string
  {
    if (this.name.hasError('required')) {
      return 'Please enter a variable name';
    } else if (this.name.hasError('pattern'))
    {
      return 'Only the following characters are allowed: a-z, A-Z, 0-9, and _'  
    }
    
    return 'An environment variable with this name already exists'
  }

  Cancel(): void {
    this.dialogRef.close();
  }
  
  Success(): void {
    this.dialogRef.close({ name: this.name.value, value: this.value.value, multi: this.multipleSelected });
  }
}
