const http = require('http');

const server = http.createServer((req, res) => {
  console.log('request received...');

  res.write('Hello, world!');
  res.end();
});

server.listen(9000);
console.log('Server on :9000');

