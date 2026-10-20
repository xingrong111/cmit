// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const appState=sqliteTable('app_state',{key:text('key').primaryKey(),value:text('value').notNull(),version:integer('version').notNull().default(1)});
