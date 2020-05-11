'use strict';

module.exports = {
  name: 'notif.ping',
  type: 'notification',
  handler: (application, params) => {
    application.logger.info(`PING message: ${params.message}`);
  },
};
