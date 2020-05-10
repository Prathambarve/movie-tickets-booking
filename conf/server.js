let port = parseInt(process.env.PORT, 10);
if (isNaN(port)) port = 9000;

const host = process.env.HOSTNAME || '127.0.0.1';

module.exports = {
  host,
  port,
};
