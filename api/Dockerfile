# Check out https://hub.docker.com/_/node to select a new base image
FROM node:10-slim

# # Create app directory
RUN mkdir /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

# RUN apt-get update
# RUN apt-get install -y git openssh-client
RUN apt-get update
RUN apt-get install -y git openssh-client

USER node

COPY package.json ./

RUN npm install

ENV HOST=0.0.0.0 PORT=3000

EXPOSE ${PORT}

CMD [ "npm", "run", "start:docker" ]
