CREATE TABLE users (
  id SERIAL,
  first_name VARCHAR(32),
  last_name VARCHAR(32),
  email VARCHAR(64) NOT NULL,
  confirmed_email BOOLEAN DEFAULT FALSE,
  hash VARCHAR(128) NOT NULL,
  salt VARCHAR(32) NOT NULL,
  created_at DATE NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE users ADD CONSTRAINT users_pkey_id PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_unique_id UNIQUE (id);

ALTER TABLE users ADD CONSTRAINT users_unique_email UNIQUE (email);
