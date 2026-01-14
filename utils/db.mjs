import * as pg from "pg" ;
const { Pool } = pg.default;

export const pool = new Pool ({
    connectionString:
    'postgresql://postgres:Post028688992@localhost:5432/CRUD-Mattayom-Test'
})