FROM node:18-alpine
WORKDIR /usr/src/app

#Copy package and package-lock.json
#Install packages
COPY package*.json ./
RUN npm install

#Copy content
COPY . .
EXPOSE 80
ENTRYPOINT [ "npm", "run" , "start" ]