# Playground Frontend

As stated in the Readme of the parent folder, this frontend supports [VSC dev containers](https://code.visualstudio.com/docs/devcontainers/containers). After installing Docker and the mentioned plugin, open a new VSC instance (different from the backend one). Then press F1 and select 'Dev Containers: Rebuild Container Without Cache'. In the selection afterward, select the frontend. Once the container has been build and VSV reopened successfully, do the following:


1. If not already done, start the backend first (contains keycloak which is needed for the frontend)
2. Navigate to ```src/frontend```
3. execute `npm install` to install all dependencies
4. execute `ng serve` to build the current app and serve a development server
5. open http://localhost:4200 to access the instance

## Other things to consider

When using the frontend in the development mode, you can navigate to http://localhost:4200/playground without setting up a session first.
In this case, the frontend will used mocked data and does not communicate with the backend. For details, please take a look at the dev/prod environment configuration files.