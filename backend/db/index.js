import {Pool } from 'pg';

export const pool = new Pool({
  host:process.env.host,
port:5432,
database:process.env.database,
user:process.env.user,
password:process.env.password
});

