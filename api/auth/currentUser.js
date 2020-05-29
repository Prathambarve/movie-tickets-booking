'use strict';

module.exports = {
  name: 'auth.currentUser',
  type: 'method',
  handler: async (_, params) => {
    return params._user || {};
  },
};
