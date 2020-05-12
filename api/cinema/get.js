'use strict';

module.exports = {
  name: 'cinema.get',
  type: 'method',
  handler: async (application, params) => {
    // TODO: Validation
    if (!Array.isArray(params) || typeof params[0] !== 'number')
      throw {
        code: '-32602',
        data: { message: 'expected to get an array with 1 positional parameter (cinema id) as int' },
      };

    const result = await application.db.query('SELECT id, city, address, title FROM cinema WHERE id=$1', [params[0]]);
    return result.rows[0] || {};
  },
};
