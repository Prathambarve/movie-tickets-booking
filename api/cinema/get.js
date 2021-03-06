'use strict';

module.exports = {
  name: 'cinema.get',
  type: 'method',
  handler: async (application, params) => {
    if (Array.isArray(params) || typeof params.id !== 'number')
      throw {
        code: '-32602',
        data: { message: 'expected to get an object with id field as int' },
      };

    const result = await application.db.query('SELECT * FROM cinema WHERE id=$1', [params.id]);
    return result.rows[0] || {};
  },
};
