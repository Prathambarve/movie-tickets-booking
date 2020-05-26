'use strict';

module.exports = {
  name: 'auth.signup',
  type: 'method',
  handler: async (application, params) => {
    const { Validation, Field } = application.validation;
    const validationObj = new Validation(
      params,
      new Field('email').required().email(),
      new Field('password').required().length({ min: 8, max: 32 }),
      new Field('confirmPassword').required().equalsTo(params.password),
    );

    if (!validationObj.valid) throw validationObj.errors;

    const salt = application.auth.genSalt();
    const hash = await application.auth.hashPassword(params.password, salt);

    // return [params.email, salt, hash];
    const result = await application.db.query(
      'INSERT INTO users (email, salt, hash) VALUES ($1, $2, $3) RETURNING id;',
      [params.email, salt, hash],
    );

    return result.rows[0];
  },
};
