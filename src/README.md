# PADME DEATHSTAR

Welcome to the codebase of the Federated Learning (FL) variant of the PADME Development Environment for AuTomated \& Holistic Smoke Testing of Analysis-Runs (DEATHSTAR). This variant works in the same way as the incremental version. Therefore, the following instructions are also them same. However, **the FL implementation is considered experimental, not all features of the incremental variant will work here**.

## Setting up a local instance

Both the backend and frontend are provided via [Visual Studio Code (VSC) development containers](https://code.visualstudio.com/docs/devcontainers/containers) to allow an easy setup. Therefore, the setup  requires a local [Docker](https://www.docker.com/) and VSC installation on your machine. If you do not have Docker installed, you can find instructions [here](https://docs.docker.com/get-docker/). Instructions for VCS are provided [here](https://code.visualstudio.com/download).


After installing Docker and VSC, we require you to install the [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) extension in VSC in order to start the dev containers. Afterward, please follow the instructions in the **'backend'** sub-folder first to start an backend instance. Afterward, you can start the frontend by following the instructions provided in the **'frontend'** folder.

### Disclaimer

The configuration files provided in this repository are **only meant for local development**. Please **do not setup a production instance without adjusting the configurations first**. For example, you will need to replace default user names and passwords with appropriate values!

[^1]: [Pérez, Jorge, Marcelo Arenas, and Claudio Gutierrez. "Semantics and complexity of SPARQL." ACM Transactions on Database Systems (TODS) 34.3 (2009): 1-45.](https://dl.acm.org/doi/abs/10.1145/1567274.1567278?casa_token=3Gul8MaNwBUAAAAA:ECzvKb6zd5cOCAW63zCAd8RmNcSaIbNLoOOhG5kyYnQsl_zOnGffHZ3X3bp9xWrWRLf7g67IyXoG)
