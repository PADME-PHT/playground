#First, build the app
FROM node:18-alpine as build
WORKDIR /workdir

COPY . .
RUN ls
RUN npm install
RUN npm run-script build

#Then copy the results as prod
FROM nginx:alpine as prod
COPY --from=build /workdir/dist/playground-frontend /usr/share/nginx/html

#Custom nginx conf with proper redirects
COPY /conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80