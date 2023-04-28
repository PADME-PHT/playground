# Playground Evaluation task

This directory contains all the needed information to replicate the user-study as described in our paper. 

## Directory content

This directory contains the following files:

- schema.ttl -> A Turtle (RDF) file with the evaluation database schemas. The file contents should be stored into the playgrounds blazegraph instance (instructions below)
- example_solution_eval.zip -> A working solution that fulfills the evaluation task.

Moreover, we provide some files to replicate the simulated setting in a real environment:

- docker-compose.yml -> A compose file that can be used to setup the required PostgreSQL database at each institution (Hospital A & B)
- a.sql -> SQL script for initializing the real Postgres DB in Hospital A with 1000 entries per table, contains 497 patients >= 50
- b.sql -> Same as a.sql but for Hospital B, contains 503 patients >= 50

Both provided SQL files contain randomized example data that has been generated with the plugins of the playground.

## Execute use case

To execute the use case yourself, please setup your development environment (backend, frontend, etc.) as described in the Readme.md in the /src folder first. Afterward, do the following:

## 1. Insert the schema data into Blazegraph

1. Navigate to http://localhost:9999 and switch to the 'Update' tab
2. In the 'Type' dropdown below choose "**RDF Data**" and in the 'Format' dropdown choose "**Turtle**"
3. Paste the contents from **./schema.ttl** and press "Update".
4. Now your blazegraph DB has all the data to execute this use case

## 2. Execute the use case

To execute the use case, do the following: 

1. Open your local Playground instance at http://localhost:4200. 
2. In the 'Eval Orga', select the eval data set for both Hospitals
3. Click on 'Select Route' in the lower right corner and confirm the route
4. Wait for the environment to be created
4. Upload the file **./example_solution_eval.zip** into the playground via the upload button in the upper left corner. This file contains all the source code needed to execute the use case

Now you can already press **play** to execute the use case.