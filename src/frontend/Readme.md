# Playground Frontend

As stated in the Readme of the parent folder, this frontend supports [VSC dev containers](https://code.visualstudio.com/docs/devcontainers/containers). After installing Docker, VCS, and the Remote Development plugin please open this repository in VSC (in a new instance, not the one already running the backend). Afterward, please press F1 to open a menu at the top of VSC. In this menu, select 'Dev Containers: Rebuild Container Without Cache'. Then you will be asked if you want to setup the backend or frontend, please select **frontend**. This selection will build and start the frontend container with the correct configuration. Consequently, it can take some time depending on your internet connection and the speed of your machine. Once the container has been built and VSC reopened successfully, do the following:

1. If not already done, start the backend first (contains Keycloak which is needed for the frontend)
2. In VSC, navigate to ```src/frontend```
3. execute `npm install` via the Terminal to install all dependencies
4. execute `ng serve` via the Terminal to build the current app and serve a development server
5. open http://localhost:4200 to access the instance

## Other things to consider

When using the frontend in the development mode, you can navigate to http://localhost:4200/playground without setting up a session first (=navigating through the first screen).
In this case, the frontend will use mocked data and does not communicate with the backend. For details, please take a look at the dev/prod environment configuration files.