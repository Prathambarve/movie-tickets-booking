'use strict';

module.exports = {
  name: 'cinema.getAll',
  type: 'method',
  handler: async application => {
    const result = await application.db.query('SELECT * FROM cinema');
    return result.rows;
  },
};
