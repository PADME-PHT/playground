## PADME DEATHSTAR

This repository contains supplementary material for the paper titled "Will it run? - A Playground for Testing and Monitoring Decentralized Data Analytics Experiments" by [Welten et al.](). The offered material includes the source code, evaluation materials, a video demonstration, and screenshots of the PADME Development Environment for AuTomated \& Holistic Smoke Testing of Analysis-Runs (DEATHSTAR).

## Source Code
The sub-folder **'src'** provides the source code for the presented PoC implementation of the Playground and the developed metadata schema. Moreover, you can find instructions on how the code can be setup locally for development in the folder's 'readme' file. Furthermore, all the developed plugins used in the presented use cases are also available.

## Evaluation material (User study and use cases)

The sub-folder **'evaluation'** provides supplementary material for the user study and ISIC use case. Moreover, we provide instructions on how the use cases can be replicated using the source code from the 'src' directory.

## Video demonstration

The following video demonstrates the usage of the Playground by conducting the analysis from the user evaluation.


[![Image](/img/thumbnail.png "PADME DEATHSTAR Demonstration")](https://youtu.be/jVFgNsx9bfk)
<p align="center">
(Click on the image to watch the video on YouTube)
</p>

## Screenshots

The following provides screenshots of the different aspects of the developed tool.

### Simulation setup

Before starting the simulation, one has to select the data sources and institutes that the simulation should use. For this, one can browse the available institutes and explore their data sources, which are displayed via a data schema visualization (1). Besides the schema information, the UI also offers further details for the available data sources like the type and version of the data source (e.g. PostgreSQL version 14.0), a description of the available data, and whether authentication is required for data access (2).

The screenshots below show two examples of data schema visualizations. For example, (1) shows the data model for one of the FHIR servers from the ISIC use case. On the other hand, (3) visualizes a relation PostgreSQL database.

FHIR database (1)            |  Data source details (2) | Relational database (3)
:-------------------------:|:-------------------------:|:-------------------------:
![Image](/img/setup/1.png "FHIR database visualization") |  ![Image](/img/setup/2.png "Data source details") | ![Image](/img/setup/3.png "Relational data source visualization")

After selecting the data source and institutes, one can configure the route in which the institutes should be visited (4). Once the user it satisfied with the selection, pressing '**Confirm**' will lead to the Playground setting up the simulation environment (5). This setup leverages the different Playground components and plugins as introduced in the paper. The duration of the setup depends on the type of data source that is used and how much time this source needs to become responsive. For the currently supported data sources (PostsgreSQL, MinIO, Blaze FHIR) this takes between 5-20 seconds. 

Route selection (4)            |  Simulation setup in progress (5)
:-------------------------:|:-------------------------:
![Image](/img/setup/4.png "Route selection") |  ![Image](/img/setup/5.png "Simulation setup in progress")

### Executing the simulation

Once the simulation setup is finished, the user is greeted with the main screen of the playground (6). This screen is split into two parts: The **code editor** on the left and **simulation configuration/details** on the right side.

#### Code editor

In the code editor, the user can choose a template as a starting point (7) or start with an empty file. Moreover, the editor allows one to download the all the files from the current analysis, create new files, upload existing files or previously downloaded analysis, and start the simulation via the 'play' button (8).

Main screen (6)            | Code templates (7) | Code editor options (8)
:-------------------------:|:-------------------------:|:-------------------------:
![Image](/img/execution/1.png "Main screen") |  ![Image](/img/execution/2.png "Available analysis templates") | ![Image](/img/execution/3.png "Code editor options")

### Simulation details

The right-hand side of the main screen offers a total of six different screens which provide additional simulation details or allow developers to adjust simulation settings.

The first screen ('Schema') offers the data schema visualization as provided during the simulation setup (9 & 1). This visualization is interactive and allows one to zoom and move elements to a preferred position (see the video above). Moreover, the second screen ('Schema Details') provides the database details that were already mentioned above and could be seen in the setup screen as well (10). If needed, the third screen ('Route') allows developers to change the order in which the data providers will be visited during the simulation (11).

Data schema visualization (9)            | Database details (10) | Route settings (11)
:-------------------------:|:-------------------------:|:-------------------------:
![Image](/img/execution/4.png "Data schema visualization") |  ![Image](/img/execution/5.png "Database details") | ![Image](/img/execution/6.png "Route settings")

The Screen 'Log Output' allows developers to monitor the execution of their simulation. For example, (12) shows the output of an ML learning algorithm that is executed on the simulated data. If needed, this screen also allows one to show detailed build outputs for the Docker image. Moreover, it provides options to filter execution logs according to the visited data providers. After the execution of an algorithm is finished, the screen 'Filesystem Changes' allows developers to see which files in the container were modified, added, or deleted (13). Moreover, users can download the modified or changed files and view text-based files directly in the Playground (14).


Execution logs (12)            | Filesystem changes (13) | Example content of a modified file (14)
:-------------------------:|:-------------------------:|:-------------------------:
![Image](/img/execution/7.png "Execution logs") |  ![Image](/img/execution/8.png "Filesystem changes") | ![Image](/img/execution/9.png "Example file output")

Lastly, the screen 'Environment Variables' can be used to inject run-time configuration, such as Hyperparameters, into the analysis code via so-called [environment variables](https://en.wikipedia.org/wiki/Environment_variable) (15). Moreover, this screen also shows the configuration parameters that are provided by the DB plugins after the data source initialization (15).


Run-time configuration (15)            |
:-------------------------:|
![Image](/img/execution/10.png "Runtime configuration") |
