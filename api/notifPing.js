module.exports = {
  name: 'notif.ping',
  type: 'notification',
  handler: (application, body) => {
    application.logger.info('pinged notification\nmessage: ', body.params.message);
  },
};
