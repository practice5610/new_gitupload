# Boom Platform Firebase

This project requires node `8.15.0`. It's recommended to install a tool like [nvm](https://github.com/nvm-sh/nvm) to let you switch between versions of Node as needed.

## Switching to production environment

`firebase use production`

## Switching to staging environment

`firebase use staging`

## Firestore Deployment

1. `cd functions`
2. `npm run deploy`

## Firestore Rules Deployment

In root folder run `firebase deploy --only firestore:rules`

## Get env variables (prints to console)

`firebase functions:config:get`

## Set env variables

`firebase functions:config:set someservice.key="THE API KEY"`
