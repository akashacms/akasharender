
/**
 * SQL Database support using SQLITE3.
 * 
 * What's supported is SQLITE3ORM - a lightweight
 * ORM that runs on top of SQLITE3.
 */

import { SqlDatabase } from 'sqlite3orm';

export const sqdb = new SqlDatabase();;
await sqdb.open(':memory:');
