if (process.env.NODE_ENV == 'live' || process.env.NODE_ENV == 'production') {
  //Skip
  process.exit(0);
} else {
  process.exit(1);
}
