
import { SqlDatabase } from 'sqlite3orm';

export const sqdb = new SqlDatabase();;
await sqdb.open(':memory:');
