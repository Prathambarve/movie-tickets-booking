module.exports = {
  name: 'ping',
  method: body => {
    return { jsonrpc: '2.0', result: 'pong', id: body.id };
  },
};
