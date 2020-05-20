'use strict';

class Validation {
  constructor(objectToValidate, ...fields) {
    this.objectToValidate = objectToValidate;
    this._fields = fields;
    this._errors = {};

    for (const field of this._fields) {
      for (const filter of field._filters) {
        try {
          filter(this.objectToValidate[field._fieldName]);
        } catch (e) {
          this._errors[field._fieldName] = e;
          break;
        }
      }
    }
  }

  get valid() {
    return Object.keys(this._errors).length === 0;
  }

  get errors() {
    return this._errors;
  }
}

class Field {
  constructor(fieldName) {
    this._fieldName = fieldName;
    this._filters = [];
  }

  // Validators
  required() {
    this._filters.push(input => {
      if (input === undefined || input === null || input === '') throw `${this._fieldName} cannot be empty`;
    });

    return this;
  }

  length({ min = 0, max = Infinity }) {
    this._filters.push(input => {
      if (min !== 0 && max !== Infinity) {
        if (input.length < min || input.length > max)
          throw `${this._fieldName}'s length should be between ${min} and ${max} characters`;
      } else {
        if (min !== 0) {
          if (input.length < min) throw `${this._fieldName} should be at least ${min} characters long`;
        } else if (max !== Infinity) {
          if (input.length > max) throw `${this._fieldName} should be maximum ${max} characters long`;
        }
      }
    });

    return this;
  }
}

module.exports = { Validation, Field };
