'use strict';

const crypto = require('crypto');

const redis = require('redis');

const SESSION_EXPIRATION_TIME = 60 * 60 * 24 * 14;

class Session {
  constructor(connectionString, application) {
    this.application = application;

    // Add rejson commands
    for (const cmd of ['json.get', 'json.set']) redis.addCommand(cmd);
    this.redis = redis.createClient(connectionString);
  }

  parseCookies(request) {
    request.cookies = {};

    if (request.headers.cookie === undefined || request.headers.cookie === null || request.headers.cookie.length === 0)
      return;

    for (const cookie of request.headers.cookie.split(';')) {
      // Only parse and save cookie if it is a valid cookie
      // e.g. name=value;name2=value2;
      if (/.*=.*/.test(cookie)) {
        const [name, value] = cookie.trim().split('=');
        request.cookies[name] = value;
      }
    }
  }

  startSession(response) {
    const sessionId = crypto.randomBytes(48).toString('base64');
    response.setHeader('Set-Cookie', `sid=${sessionId}`);
    this.redis.multi().json_set(sessionId, '.', '{}').expire(sessionId, SESSION_EXPIRATION_TIME).exec();
  }

  get(...options) {
    return this.redis.json_get(...options);
  }

  set(...options) {
    return this.redis.json_set(...options);
  }
}

module.exports = Session;
