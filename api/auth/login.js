'use strict';

module.exports = {
  name: 'auth.login',
  type: 'method',
  handler: async (application, params) => {
    const { Validation, Field } = application.validation;
    const validationObj = new Validation(
      params,
      new Field('email').required().email(),
      new Field('password').required(),
    );

    if (!validationObj.valid) throw validationObj.errors;

    // Get user and create new hash with the salt from db
    const result = await application.db.query('SELECT * FROM users WHERE email = $1;', [params.email]);
    const user = result.rows[0];
    const hash = await application.auth.hashPassword(params.password, user.salt);

    if (user.hash === hash) {
      // Add userId key to user's session in redis
      application.sessions.set(params._sid, '.userId', user.id);
      return { message: 'login successful' };
    } else {
      return { message: 'invalid login credentials' };
    }
  },
};
