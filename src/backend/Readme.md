# Playground Backend

## Prerequisites

The backend relies on [Blazegraph](https://blazegraph.com/) as its graph database. Unfortunately, there is no official docker image available yet, which is why we build one locally. To do this, please execute the following steps (once) before starting the backend setup:

1. Navigate to the [blazegraph release page](https://github.com/blazegraph/database/releases/tag/BLAZEGRAPH_2_1_6_RC)
2. Download the latest released **'blazegraph.jar'** file. At the moment this is version 2.1.6 from February 2020.
3. Place the downloaded file into the ```/src/external/blazegraph``` folder

Now you can proceed with the setup.

## Setup

As stated in the Readme of the parent folder, this backend supports [VSC dev containers](https://code.visualstudio.com/docs/devcontainers/containers). After installing Docker, VCS, and the Remote Development plugin please open this repository in VSC. Afterward, please press F1 to open a menu at the top of VSC. In this menu, select 'Dev Containers: Rebuild Container Without Cache'. Then you will be asked if you want to setup the backend or frontend, please select **backend**. This selection will build and start all the required containers with the correct configuration. Consequently, it can take some time depending on your internet connection and the speed of your machine.

Once all containers have been built and VSV reopened successfully, do the following steps (1-3 need to be done once):

### 1. Initialize Blazegraph with example data

Initially, the Blazegraph database does not contain any data. Therefore, execute the following steps to insert some exemplary data sources and schemas:

1. Navigate to http://localhost:9999 to open the blazegraph UI. Then switch to the 'Update' tab
2. In the 'Type' dropdown at the bottom, choose "**RDF Data**" and in the 'Format' dropdown choose "**Turtle**"
3. Paste the contents from ```/src/backend/development/workingdata.ttl``` into the text field and press "Update".

This data provides example databases and stations that can be used for development and are helpful while testing the Playgrounds features. Additional schemas are available in the ```/evaluation/``` sub-folders. Please follow the Readme files in those folders to insert this data into blazegraph as well.

### 2. Create a client in the local Keycloak instance 

We use Keycloak for authentication. However, before Keycloak works, it has to be configured to accept the Playground as a client. For this, please follow the following steps:

1. Navigate to http://localhost:8080
2. Click on 'Administration console'
3. Login with the credentials 'admin' (user) and 'admin' (pass)
4. Navigate to 'Clients' on the left side and click 'Import client' next to the 'Create Client' button
5. Select 'Browse' and import the file from ```src/backend/development/playground.json```
6. Click Save

Now Keycloak should be working and you can log in to the app with the credentials admin (user) and admin (pass). You can also create other users if you like. 

**Important:** Please be aware that the backend does not access Keycloak directly but via a port forwarding inside the backend container that redirects a local port to keycloak. You can find more details in the docker-compose-dev.yml file. The reason for this step is that if you use e.g. http://keycloak-hostname:8080 as an address in the backend, we get name clashes when validating tokens that are provided by the frontend. This is because the token is generated by the frontend via the http://localhost:8080 address. If there is ever any problem with Keycloak communication, or the connection of the DEV container terminates all the time, please investigate if the issue is due to issues with the port forwarding and nc command.

### 3. Install dependencies

Lastly, please execute ```npm install``` in the ```/src/backend/src/```folder via a terminal in VSC. This command installs all the needed dependencies and libraries.

### 4. Start the backend

Now you can start the backend. This is possible by simply pressing F5 in the opened VSC instance or the play button located on the left of VSC. Everything should be running now and accessible on your host via port 1234.

You can now proceed with the frontend setup.

## Good to know

## Docker in docker

We currently use the base-image of docker-in-docker (dind). It could be the case, that this image runs out of virtual network addresses when you use too many parallel simulation instances. In this case, you might get the following error:
```
2023-04-29 15:25:33;sessionController;Error: (HTTP code 404) driver not found - could not find an available, non-overlapping IPv4 address pool among the defaults to assign to the network 
```
To solve this problem, configure the docker deamon of the dind container via a [deamon.json](https://docs.docker.com/config/daemon/) file to use a different address pool like so:

```
{
  "default-address-pools":[
    {"base":"172.16.0.0/12","size":24}
  ]
}
```

### Caveat when using VSC F5/Play for starting the backend

When debugging the backend there unfortunately is **one caveat** that you should be aware of:

When debugging and pressing the stop button, VS code always sends a SIGKILL signal. The app listens to SIGINT and SIGTERM to gracefully shutdown, which means the app will not gracefully shutdown when stopping via the vscode debug mode. However, this also means that cleanup tasks will not be performed at the end of the app runtime. Therefore: From time to time, clean the container, images, networks, etc. in the playground-dind container that are kept there from the debugging sessions. Alternatively, you can get rid of the playground-dind container completely (e.g. via Docker Desktop) and create a new one (e.g., by doing a rebuild of the devcontainer in VSC as described above).