# PADME Playground

Welcome to the codebase of the PADME Playground. The playground consists of **two** main components: A **backend** written in [Node.js](www.nodejs.org/en/) and a **frontend** written with [Typescript](www.typescriptlang.org) using [Angular](www.angular.io) and [Material](https://material.angular.io/). 

The backend uses the library [Express](www.expressjs.com) to provide functionalities such as RESTful interfaces. Moreover, its designed as a monolithic application that separates the sub-components mentioned in the paper (Query Engine, Source Provisioner, ...) via libraries. 

The Metadata Store is realized by a [Blazegraph](https://blazegraph.com/) database and accessed by the backend via [SPARQL](www.w3.org/TR/sparql11-query), the standard query language for RDF based data[^1].

In the following and the corresponding readme files of the relevant sub-folders you can find instructions on how to setup a playground instance yourself.

## Setting up a local instance

Both the backend and frontend are provided via [Visual Studio Code (VSC) development containers](https://code.visualstudio.com/docs/devcontainers/containers) to allow an easy setup. Therefore, the setup  requires a local [Docker](https://www.docker.com/) and VSC installation on your machine. If you do not have Docker installed, you can find instructions [here](https://docs.docker.com/get-docker/). Instructions for VCS are provided [here](https://code.visualstudio.com/download).


After installing Docker and VSC, we require you to install the [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) extension in VSC in order to start the dev containers. Afterward, please follow the instructions in the **'backend'** sub-folder first to start an backend instance. Afterward, you can start the frontend by following the instructions provided in the **'frontend'** folder.

### Disclaimer

The configuration files provided in this repository are **only meant for local development**. Please **do not setup a production instance without adjusting the configurations first**. For example, you will need to replace default user names and passwords with appropriate values!

[^1]: Pérez, Jorge, Marcelo Arenas, and Claudio Gutierrez. "Semantics and complexity of SPARQL." ACM Transactions on Database Systems (TODS) 34.3 (2009): 1-45.
