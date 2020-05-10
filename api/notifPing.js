module.exports = {
  name: 'notif.ping',
  type: 'notification',
  handler: (application, body) => {
    application.logger.info(`PING message: ${body.params.message}`);
  },
};
