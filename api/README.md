# Boom Platform API

The API is utilized for the Boom web, mobile, POS tablet, and admin portal projects.

This project is split into two folders:

`functions` = The Firebase cloud functions project. Mainly used for managing user account roles and setting roles as custom claims for their web tokens.

`api` = The main API folder. This is where our Loopback project is located.

The production environment is currently set to run in Node version `10.16.0`.

# How to set up the project

## Pre-requisites

- Install Node version manager. This allows you to switch Node versions as needed. MacOS/Linux version is [here](https://github.com/nvm-sh/nvm). Windows version is [here](https://github.com/coreybutler/nvm-windows)
- Install the [Loopback CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html). This gives you convenience commands for performing certain tasks in the Loopback project.

## Setup for the API project

### Step 1: Make sure you are on the correct branch!

You should always branch off the `develop` branch. As this is the branch that has the most current work.

### Step 2: Get the .env file

You'll need the `.env` file for this project to get our local configuration keys/settings. This file must be placed inside the `api` directory.

### Step 3: Get the firebase service account files

You'll need these to allow our project to make Firebase calls. These are also placed inside the `api` directory.

- `service-account-file--dev.json`
- `service-account-file--qa.json`
- `service-account-file--migration-source.json`

### Step 4: Configure your database

There's several options for connecting the project to a MongoDB database, by editing the .env file's `DB_ENV` variable to one of the following:

#### Database Connection Configurations for Development

`local` = This points you to a dev database running on our AWS environment. Your ip address must be whitelisted to get access to this database.

`docker` = This points you to the database that has been locally provisioned to you via Docker, if you choose to run the Docker scripts that come with the project (more on that below).

### Step 5: Configure your Redis

To enable redis editing the .env file's `REDIS_ENABLED` set it to true (by default it is set to `false`)

#### Redis Connection Configurations for Development

`REDIS_HOST` default one is `127.0.0.1` for Docker change it to `redis` (more on that below).
`REDIS_PORT` default one is `6379`

#### Database Connection Configurations for Production

`live` = This is the live production database config. Due to security restrictions, this configuration will not be able to connect to the database except within an AWS environment that is a member of the virtual private cloud running the database servers. So this is not an option for local development.

`local-prod` = This configuration can connect to the live production database. This requires that your local computer can ssh into the bastion host server, that will allow you to connect via port forwarding, into the database.

See documentation on how to connect for [Windows](https://boomcarding.atlassian.net/wiki/spaces/BW/pages/598605825/How+to+connect+to+production+MongoDB+with+a+Windows+PC) and [Mac](https://boomcarding.atlassian.net/wiki/spaces/BW/pages/912850965/How+to+connect+to+production+MongoDB+with+Mac)

This option is only to be done when you must gain access to the production database, but in most cases you should not do this.

By default, our `.env` file will connect you to the remote dev database, by setting the `DB_ENV` variable to `local`.

### Step 6: Install dependencies

In the `app` directory, install the node dependencies by issuing the `npm install` command.

### Step 6: Run the project

Issue `npm start` command to run the project. Or if you'd like to restart the server when making an update to a file in the project, run the `npm run start:watch` command.

Application will be available in http://localhost:3000

### Optional step to replace steps 5 and 6 (Docker)

If you'd like to use Docker to provision a database for you. You can run these build commands below. (Some Environment variables are changed internally check below)

`npm run docker:up` = This will build the Docker containers necessary to run the API via Docker.

`npm run docker:db:seed` = Run this only the first time you are building the docker container.

The container will remain running even if you close your project. If you'd like to stop the container you can issue this command:

`npm run docker:down`

If you have added new dependencies to the project, or you want to stop and delete the container you created, you can run this command:

`npm run docker:down:clean`

You can then re-build the containers with the up command mentioned earlier.

Application will be available in http://localhost:3000

## api\docker-compose.yml sets some env variables as default :

`DB_ENV` is set to `docker` as explained earlier
`REDIS_HOST` is set to `redis`
`REDIS_ENABLED` is set to `true` (remember to add it to to the .env file)

To use the .env files remove these values from docker-compose.yml and the ones set on .env file will be used

# Notes for devs

### NODE_ENV environment variable

The .env file sets `NODE_ENV` = 'live'. This is because in the AWS environment, we can't use 'production' as usual, because this prevents the server from installing devDependencies in package.json which are needed for our project

### PORT environment variable

The Elastic Beanstalk environments requires that we set the `PORT` environment variable to `8081`

View API explorer: `http://localhost:3000`

### Deploying Application to Elastic Beanstalk for Production

This app is configured for deployment to an Elastic Beanstalk environment. To set up this project to deploy to Elastic Beanstalk on your machine:

1. Install [Elastic Beanstalk CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)
1. Initialize your project to use Elastic Beanstalk `eb init`
1. Select `us-west-2` region
1. You will be prompted to add necessary IAM access id and secret key
1. Select the `Boom Platform` application
1. Select the `BoomPlatformAPI--staging` environment

You should now be able to deploy the application to staging with:

`npm run deploy`

This deployment uploads the source files, and will build the project on the remote server using the build scripts in package.json.

When running deploy, we check the typescript fields for errors using tsc and eslint, if all goes ok we update the package version and upload the changes of version to bitbucket. To avoid updating the version run `npm run deploy:noUpdateVersion`



in order to run 
: npm run start:docker
