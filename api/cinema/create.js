'use strict';

module.exports = {
  name: 'cinema.create',
  type: 'method',
  handler: async (application, params) => {
    // TODO: Validation
    // This is temporary
    if (Array.isArray(params))
      throw {
        code: '-32602',
        data: { message: 'expected to get an object with city, address and title, got an array' },
      };

    const result = await application.db.query(
      'INSERT INTO cinema (city, address, title) VALUES ($1, $2, $3) RETURNING id;',
      [params.city, params.address, params.title],
    );

    return result.rows[0];
  },
};
