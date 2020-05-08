const { Application } = require('./engine/application');

const main = async () => {
  const app = new Application(9000);
  app.start();
}

main();

