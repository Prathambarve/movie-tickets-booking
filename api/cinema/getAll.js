'use strict';

module.exports = {
  name: 'cinema.getAll',
  type: 'method',
  handler: async (application, _) => {
    const result = await application.db.query('SELECT id, city, address, title FROM cinema');
    return result.rows;
  },
};
