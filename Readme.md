## PADME Playground

This repository contains supplementary material for the paper titled "Will it run? - A Playground for Testing and Monitoring Decentralized Data Analytics Experiments" by [Welten et al](). The offered material includes the source code, the evaluation material, and screenshots as well as a video demonstrating the use of the PADME Playground.

## Source Code
The sub-folder **'src'** provides the source code for the presented PoC implementation of the Playground. Moreover, you can find instructions on how the code can be set up locally for development in the folder's 'readme' file. Furthermore, all the developed plugins used in the presented use cases are also available.

## Evaluation material (Use cases)

The sub-folder **'evaluation'** provides supplementary material for the user study and ISIC use case. Moreover, we provide instructions on how the use cases can be replicated using the source code from the 'src' directory.

## Examples

The following video demonstrates the usage of the playground by conducting the analysis from the user evaluation. Moreover, we provide supplementary screenshots of the different features of the developed tool.

VIDEO HERE!

### Simulation setup

Before starting the simulation, one has to select the data sources and institutes that the simulation should use. For this, one can browse the available institutes and explore their data sources, which are displayed via a data schema visualization (1. screenshot). Besides the schema information, the UI also offers further details for the available data sources like the type and version of the data source (e.g. PostgreSQL version 14.0), a description of the available data, and whether authentication is required for data access (2. screenshot).

The screenshots below show two examples of data schema visualizations. For example, screenshot 1 shows the data model for one of the FHIR servers from the ISIC use case. The third screenshot, on the other hand, visualized a relation PostgreSQL database.

FHIR database (1)            |  Data source details (2) | Relational database (3)
:-------------------------:|:-------------------------:|:-------------------------:
![Image](/img/setup.png "Simulation setup") |  ![Image](/img/setup2.png "Data source details") | ![Image](/img/setup3.png "PostgreSQL")



