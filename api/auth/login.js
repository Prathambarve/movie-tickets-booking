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

    const result = await application.db.query('SELECT * FROM users WHERE email = $1;', [params.email]);
    const user = result.rows[0];
    const hash = await application.auth.hashPassword(params.password, user.salt);

    // TODO: Assign session to user
    if (user.hash === hash)
      return (({ id, email, first_name, last_name, confirmed_email }) => ({
        id,
        email,
        firstName: first_name,
        lastName: last_name,
        confirmed_email,
      }))(user);

    return { message: 'invalid login credentials' };
  },
};
