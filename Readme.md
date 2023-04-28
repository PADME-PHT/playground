## PADME Playground

This repository contains supplementary material for the paper titled "Will it run? - A Playground for Testing and Monitoring Decentralized Data Analytics Experiments" by [Welten et al](). The offered material includes the source code, the evaluation material, and screenshots as well as a video demonstrating the use of the PADME Playground.

## Source Code
The sub-folder **'src'** provides the source code for the presented PoC implementation of the Playground. Moreover, you can find instructions how the code can be set-up locally for development in the folders 'readme' file. Furthermore, all the developed plugins used in the presented use cases are also available.

## Evaluation material (Use cases)

The sub-folder **'evaluation'** provides supplementary material for the user study and ISIC use case. Moreover, we provide instructions how the use cases can be replicated using the source code from the 'src' directory.

## Examples

The following video demonstrates the usage of the playground by conducting the analysis from the user evaluation. Moreover, we provide sumplementary screenshots of the different features of the developed tool. 

VIDEO HERE!

### Simulation setup

Before starting the simulation, one has to select the data sources and institutes that the simulation should use. For this, one can browse the available institues and explore their data sources via a schema visualization (1. screenshot). Morover, the UI offers further details like the version and type of the provided data source, a description, and whether authentication is required to access the data (2. screenshot). The first screenshots shots the data model for the FHIR server from the ISIC usecase. The third screenshots shows a relational model from PostgreSQL database.

![Image](/img/setup.png "Simulation setup")
![Image](/img/setup2.png "Data source details")
![Image](/img/setup3.png "PostgreSQL")