## Evaluation: ISIC use case

This folder contains all files that are needed to replicate the ISIC use case as described in the paper. Before trying to replicate the use case, please setup your development environment (backend, frontend, etc.) as described in the Readme.md in the /src folder.

After your local Playground instance is running successfully, you can execute the following to replicate the use case:

## 1. Insert the schema data into Blazegraph

1. Navigate to http://localhost:9999 and switch to the 'Update' tab
2. In the 'Type' dropdown below choose "**RDF Data**" and in the 'Format' dropdown choose "**Turtle**"
3. Paste the contents from **./schema.ttl** and press "Update".
4. Now your blazegraph DB has all the data to execute this use case

## 2. Execute the use case

To execute the use case, do the following: 

1. Open your local Playground instance at http://localhost:4200. 
2. In the 'ISIC Orga', select both datasets from the 'ISIC Station'. 
3. Click on 'Select Route' in the lower right corner and confirm the route
4. Wait for the environment to be created
4. Upload the file **./isic.zip** into the playground via the upload button in the upper left corner. This file contains all the source code needed to execute the use case

Now you can already press **play** to execute the use case.

If you want, you can change the Hyperparameters by creating environment variables via the 'Environment variable' tab on the right (see code in main.py, line 59+ for the names of the variables) or in the code directly.
