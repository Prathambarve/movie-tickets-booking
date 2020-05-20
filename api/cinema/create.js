'use strict';

module.exports = {
  name: 'cinema.create',
  type: 'method',
  handler: async (application, params) => {
    const { Validation, Field } = application.validation;
    const validationObj = new Validation(
      params,
      new Field('city').required().length({ min: 4, max: 32 }),
      new Field('address').required().length({ min: 4, max: 32 }),
      new Field('title').required().length({ min: 4, max: 32 }),
    );

    if (!validationObj.valid) throw validationObj.errors;

    const result = await application.db.query(
      'INSERT INTO cinema (city, address, title) VALUES ($1, $2, $3) RETURNING id;',
      [params.city, params.address, params.title],
    );

    return result.rows[0];
  },
};
