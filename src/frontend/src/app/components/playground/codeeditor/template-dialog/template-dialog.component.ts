import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { catchError, throwError } from 'rxjs';
import { EditorFile } from 'src/app/model/editor-file';
import { EditorFileType } from 'src/app/model/editor-file-type';
import { StateManagerService } from 'src/app/services/state-manager/state-manager';

export interface Template
{
  name: string; 
  image: string;
  text: string;
  checked: boolean;
}

@Component({
  selector: 'app-template-dialog',
  templateUrl: './template-dialog.component.html',
  styleUrls: ['./template-dialog.component.scss']
})
export class TemplateDialogComponent implements OnInit {

  public templates: Template[] =
    [
      {
        name: "Python", image: "assets/img/python-logo.svg",
        text: "Template using Python 3.8. The template provides a Dockerfile and a requirements file for installing dependencies.", checked: false
      },
      {
        name: "R", image: "assets/img/R-logo.svg", text: "R template based on rocker/r-base providing a Dockerfile and a R script for installing dependencies.", checked: false
      },
      {
        name: "PADME-Conductor", image: "assets/img/PADMEConductor-logo.svg",
        text: "Template using Python 3.8. It provides a Dockerfile,a requirements file for installing dependencies and the main file including a basic skeleton with the PADME Conductor Library.", checked: false
      },
    ];
  
  public canCreate = false;
  public loading = false;

  constructor(
    public dialogRef: MatDialogRef<TemplateDialogComponent>,
    public httpClient: HttpClient,
    public stateManager: StateManagerService
  ) { }

  ngOnInit(): void {
  }

  Cancel(): void {
    this.dialogRef.close();
  }

  async CreateTemplate()
  {
    this.loading = true; 
    //Get the current selected template (ui only allows one)
    for (let template of this.templates) {
      if (template.checked) {
        let createdTemplate;
        
        //Load the specific template
        switch (template.name) {
          case "Python":
            createdTemplate = await this.CreatePythonTemplate();
            break;
          case "R":
            createdTemplate = await this.CreateRTemplate();
            break;
          case "PADME-Conductor":
            createdTemplate = await this.CreatePADMEConductorTemplate();
            break;
        }
        this.loading = false;
        this.dialogRef.close(createdTemplate);
      }
    }
  }

  /**
   * Fetches the template files for python
   * @returns 
   */
  private async CreatePythonTemplate() : Promise <EditorFile[]>
  {
    let prefix = "/assets/templates/python";
    let mainContent = await this.getResource(`${prefix}/main.py`);
    let dockerContent = await this.getResource(`${prefix}/Dockerfile`);
    let requirementsContent = await this.getResource(`${prefix}/requirements.txt`);
    let purpose = this.stateManager.getCurrentPurpose();

    return [
      { name: "main.py", content: mainContent, type: EditorFileType.python, purpose: purpose },
      { name: "Dockerfile", content: dockerContent, type: EditorFileType.dockerfile, purpose: purpose  },
      { name: "requirements.txt", content: requirementsContent, type: EditorFileType.plain, purpose: purpose  },
    ] 
  }

  /**
   * Fetches the template files for PADMEConductor template
   * @returns 
   */
  private async CreatePADMEConductorTemplate() : Promise <EditorFile[]>
  {
    let prefix = "/assets/templates/PADMEConductor";
    let mainContent = await this.getResource(`${prefix}/main.py`);
    let dockerContent = await this.getResource(`${prefix}/Dockerfile`);
    let requirementsContent = await this.getResource(`${prefix}/requirements.txt`);
    let purpose = this.stateManager.getCurrentPurpose();

    return [
      { name: "main.py", content: mainContent, type: EditorFileType.python, purpose: purpose  },
      { name: "Dockerfile", content: dockerContent, type: EditorFileType.dockerfile, purpose: purpose  },
      { name: "requirements.txt", content: requirementsContent, type: EditorFileType.plain, purpose: purpose  },
    ] 
  }
  
  /**
   * Fetches the template files for R
   * @returns 
   */
  private async CreateRTemplate(): Promise<EditorFile[]>
  {
    let prefix = "/assets/templates/R";
    let mainContent = await this.getResource(`${prefix}/main.R`);
    let dockerContent = await this.getResource(`${prefix}/Dockerfile`);
    let requirementsContent = await this.getResource(`${prefix}/install_packages.R`);
    let purpose = this.stateManager.getCurrentPurpose();
    return [
      { name: "main.R", content: mainContent, type: EditorFileType.R, purpose: purpose  },
      { name: "Dockerfile", content: dockerContent, type: EditorFileType.dockerfile, purpose: purpose  },
      { name: "install_packages.R", content: requirementsContent, type: EditorFileType.R, purpose: purpose  },
    ] 
  }

  /**
   * Promisified http get call
   * @param path 
   * @returns 
   */
  private async getResource(path: string): Promise<string>
  {
    return new Promise((resolve, reject) => 
    {
      this.httpClient.get(path, { responseType: 'text' }).pipe(catchError((err) => {
        reject(err); 
        return throwError(() => new Error(err));
      })).subscribe(result => {
        resolve(result);
      });
    })
  }

  ItemSelected(index : number) : void
  {
    this.templates[index].checked = !this.templates[index].checked; 
    //No true -> item was checked, disable the rest
    if (this.templates[index].checked)
    {
      this.canCreate = true;
      for (let i = 0; i < this.templates.length; i++)
      {
        if (i != index)
        {
          this.templates[i].checked = false;
        }
      }
    } else
    {
      this.canCreate = false;  
    }
  }

}
