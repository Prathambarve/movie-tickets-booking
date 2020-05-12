CREATE TABLE cinema (
  id SERIAL,
  city varchar(32) NOT NULL,
  address varchar(64) NOT NULL,
  title varchar(32) NOT NULL
);

ALTER TABLE cinema ADD CONSTRAINT cinema_pkey_id PRIMARY KEY (id);
ALTER TABLE cinema ADD CONSTRAINT cinema_unique_id UNIQUE (id);

