module.exports = {
  name: 'ping',
  type: 'method',
  handler: (_, body) => {
    return { jsonrpc: '2.0', result: 'pong', id: body.id };
  },
};
