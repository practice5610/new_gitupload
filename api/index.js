const application = require('./dist/src');

module.exports = application;

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT || 3000),
      host: process.env.HOST,
      basePath: '/v1',
      openApiSpec: {
        // useful when used with OASGraph to locate your application
        setServersFromRequest: true,
      },
      cors: {
        origin: '*',
        methods: 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        maxAge: 86400,
        credentials: true,
        allowedHeaders: ['Accept', 'Content-Type', 'Authorization'],
      },
      // Use the LB4 application as a route. It should not be listening.
      listenOnStart: false,
    },
  };
  console.log('check', config);
  application.main(config).catch((err) => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
