CREATE TABLE migrations (
  id varchar(3) NOT NULL,
  name varchar(64) NOT NULL,
  created_at DATE NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE migrations ADD CONSTRAINT pkey_id PRIMARY KEY (id);
ALTER TABLE migrations ADD CONSTRAINT unique_id UNIQUE (id);

