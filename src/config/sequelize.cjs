require("dotenv").config();

module.exports = {
  development: {
    username: process.env.PG_USER || "root",
    password: process.env.PG_PASSWORD || null,
    database: process.env.PG_DATABASE || "database_development",
    host: process.env.PG_HOST || "127.0.0.1",
    dialect: "postgres",
  },
  test: {
    username: process.env.PG_USER || "root",
    password: process.env.PG_PASSWORD || null,
    database: process.env.PG_DATABASE || "database_test",
    host: process.env.PG_HOST || "127.0.0.1",
    dialect: "postgres",
  },
  production: {
    username: process.env.PG_USER || "root",
    password: process.env.PG_PASSWORD || null,
    database: process.env.PG_DATABASE || "database_production",
    host: process.env.PG_HOST || "127.0.0.1",
    dialect: "postgres",
  },
};
