# Movie tickets booking application

A place where you can easily buy movie tickets.

## Running the project

### Docker way

- Rename `.env.example` to `.env`
  **If you change the port in `.env`, be sure to change it in `docker-compose.yml`**
- Run `docker-compose up`
- Visit [localhost:9000](http://localhost:9000) (or the port you used in `.env` file)

### Without docker

To run the application without docker you should have postgres client installed and available for connections.

- Rename `.env.example` to `.env`.
- Set `PG_CONN` to your postgres connection string
- Run `npm install`
- To start the application with development server run `npm run dev`
- Visit [localhost:9000](http://localhost:9000) (or the port you used in `.env` file)

## About

This is a pet project of mine, mimicking website for a cinema, where you can buy tickets for movie screenings.

Project is built using Node.js and PostgreSQL.

The project has minimal amount of dependencies needed for the project.
I wanted to build something all by myself, starting from basic http router, to logs management, migrations, etc.

Although I still use some dependencies:

- prettier - for easy and consistent code formatting ([website](https://prettier.io/))
- eslint - for linting javascript code ([website](https://eslint.org/))
- pg - postgresql drivers for node.js ([website](https://node-postgres.com/))

## API

API written using [json-rpc 2.0 specification](https://www.jsonrpc.org/specification).

## Migrations

Migrations are located in `sql` directory.
Migration name should be `000-migration-name.sql`, where 000 is migration id, which should be 3 characters long.

To apply migrations run:

```shell script
npm run migrate
```

Migrations will be run in alphabetical order.

After running `npm run migrate` all of migrations are put in a single transaction.
If there are any syntax or logical errors, the whole transaction will be rolled back.

The script will run only migrations that weren't already run in that database.
Migrations that were already ran in the database are saved in `migrations` table.

## Development Server

Running `npm run dev` will start the server using `runner` utility.

`Runner` is a very basic version of [nodemon](https://nodemon.io/).

It runs `run.js` as a child process using [fork](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options) function.

Pressing `r` will kill the process with `SIGTERM`, and restart it again.

Pressing `q` or `Ctrl+C` will just terminate the process using `SIGTERM`.

## License

If you want to contact me, all my available platforms can be found on my [website](https://habiiev.wtf/)

License: [MIT](LICENSE)
