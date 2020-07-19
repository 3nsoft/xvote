/*
 Copyright(c) 2018 3NSoft Inc.
 
 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.
 
 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>. */


import * as pg from 'pg';
import * as sql from 'sql';
import { copy as copyJSON } from '../../lib-common/json-utils';

export function isLikeConnectConfig(conf: pg.ClientConfig): boolean {
	return (('object' === typeof conf) && !!conf &&
		('string' === typeof conf.database) && !!conf.database &&
		('string' === typeof conf.host) && !!conf.host &&
		('number' === typeof conf.port) && (conf.port > 0) &&
		('string' === typeof conf.user) && !!conf.user &&
		('string' === typeof conf.password) && !!conf.password);
}

export async function pgConnect(conf: pg.ClientConfig): Promise<pg.Client> {
	const client = new pg.Client(conf);
	await client.connect();
	return client;
}

export function fullQuotedNameOf<N extends string, T>(t: sql.Table<N, T>):
		string {
	const schema = t.getSchema();
	return (schema ? `"${schema}"."${t.getName()}"` : `"${t.getName()}"`);
}

export function removeDoubleQuotes(text: string): string {
	let doubleQInd = text.indexOf('""');
	while (doubleQInd >= 0) {
		text = text.substring(0, doubleQInd) + text.substring(doubleQInd+1);
		doubleQInd = text.indexOf('""');
	}
	return text;
}

/**
 * This creates roles that are without root-like privileges, NOINHERIT to keep
 * things simple, mixing of granted privileges only to login roles.
 * @param dbClient
 * @param roles 
 */
async function createGroupRoles<G>(client: pg.Client, roles: G):
		Promise<void> {
	for (const role of Object.keys(roles)) {
		await client.query(
			`CREATE ROLE "${role}" NOINHERIT`);
	}
}

/**
 * This creates a login role, granting it privileges of given groups.
 * If role exists its dropped first, so as to be recreated, potentially,
 * in a new way.
 * @param adminConf 
 * @param login is a login role that is created, if doen't exist. If role
 * exists, it is dropped, before being recreated with new parameters.
 * @param groups is an array of groups to be granted to a login role.
 * @param password is an optional passwords
 */
export async function recreateLoginRole(adminConf: pg.ClientConfig,
		login: string, groups: string[], password?: string): Promise<void> {
	const client = await pgConnect(adminConf);
	try {
		await client.query(`DROP ROLE IF EXISTS "${login}"`);
		await client.query(password ?
			`CREATE ROLE "${login}" INHERIT LOGIN PASSWORD '${password}'` :
			`CREATE ROLE "${login}" INHERIT LOGIN`);
		for (const group of groups) {
			await client.query(
				`GRANT "${group}" TO "${login}"`);
		}
	} finally {
		await client.end();
	}
}

/**
 * This creates a login role, granting it privileges of given groups.
 * If role exists this operation fails.
 * @param adminConf 
 * @param login is a login role that is created.
 * @param groups is an array of groups to be granted to a login role.
 * @param password is an optional passwords
 */
export async function createLoginRole(adminConf: pg.ClientConfig,
	login: string, groups: string[], password?: string): Promise<void> {
const client = await pgConnect(adminConf);
try {
	await client.query(password ?
		`CREATE ROLE "${login}" INHERIT LOGIN PASSWORD '${password}'` :
		`CREATE ROLE "${login}" INHERIT LOGIN`);
	for (const group of groups) {
		await client.query(
			`GRANT "${group}" TO "${login}"`);
	}
} finally {
	await client.end();
}
}

export type Privileges<G> = { [role: string]: (keyof G)[]; };

/**
 * This creates a new database, granting connection rights to given groups.
 * @param client 
 * @param dbName is a name for a new database
 * @param groups is an object with groups (roles), as keys. These groups will be
 * granted connect to a created database.
 */
export async function createDB<G>(client: pg.Client, dbName: string,
		groups: G): Promise<void> {
	await client.query(
		`CREATE DATABASE "${dbName}"`+
		" ENCODING = 'UTF8'"+
		" CONNECTION LIMIT = -1");

	await client.query(
		`REVOKE ALL PRIVILEGES ON DATABASE "${dbName}" FROM public`);

	for (const group of Object.keys(groups)) {
		await client.query(
			`GRANT CONNECT ON DATABASE "${dbName}" TO "${group}"`);
	}
}

async function createSchema(client: pg.Client, schema: string,
		groups: string[]): Promise<void> {
	await client.query(
		`CREATE SCHEMA "${schema}"`);
	for (const group of groups) {
		await client.query(
			`GRANT USAGE ON SCHEMA "${schema}" TO "${group}"`);
	}
}

async function createTable<G>(client: pg.Client,
		tab: sql.Table<string, object>, privs: TablePrivs<G>,
		tabIndexes?): Promise<void> {
	
	await client.query(removeDoubleQuotes(
		tab.create().toQuery().text));
	
	const tabName = fullQuotedNameOf(tab);
	
	for (const group of Object.keys(privs)) {
		const grPrivs = privs[group as keyof G];
		if (!Array.isArray(grPrivs) || (grPrivs.length === 0)) { continue; }
		await client.query(
			`GRANT ${grPrivs.join(',')} ON TABLE ${tabName} TO ${group}`);
	}
}

export type TablePrivs<G> =
	{ [ group in keyof G ]?: ('SELECT' | 'UPDATE' | 'INSERT' | 'DELETE')[]; };

export interface TableCreationArgs<G> {
	table: sql.Table<string, object>;
	privs: TablePrivs<G>;
	tabIndexes?: sql.IndexCreationQuery[];
}

export async function createCompleteSchema<G>(client: pg.Client, schema: string,
		tables: TableCreationArgs<G>[]): Promise<void> {
	// collect groups for schema connection, and check tables' schema field
	const groups: string[] = [];
	for (const t of tables) {
		if (t.table.getSchema() !== schema) { throw new Error(
			`Table "${t.table.getName()}" has schema "${t.table.getSchema()}" instead of expected "${schema}"`); }
		for (const group of Object.keys(t.privs)) {
			const grTabPrivs = t.privs[group as keyof G];
			if (grTabPrivs && (grTabPrivs.length > 0)) {
				groups.push(group);
			}
		}
	}

	// create schema object
	await createSchema(client, schema, groups);

	// create table objects
	for (const t of tables) {
		await createTable(client, t.table, t.privs, t.tabIndexes);
	}
}

/**
 * This function creates complete database, optionally setting up related
 * groups and logins.
 * @param adminConf connection information for account that can create new
 * databases and roles.
 * @param dbName name of a new database
 * @param groups is an object, which keys are used as group role names
 * @param creators is an array of functions that create schemas/objects in a
 * database. Order of functions defines creation order, which is important when
 * schemas depend on one another.
 */
export async function createCompleteDB<G>(adminConf: pg.ClientConfig,
		dbName: string, groups: G,
		creators: ((client: pg.Client) => Promise<void>)[]): Promise<void> {

	let client = await pgConnect(adminConf);
	try {
		await createGroupRoles(client, groups);
		await createDB(client, dbName, groups);
	} finally {
		await client.end();
	}

	const dbConf = copyJSON(adminConf);
	dbConf.database = dbName;
	client = await pgConnect(dbConf);
	try {
		await client.query("DROP SCHEMA IF EXISTS public");
		for (const createSchema of creators) {
			await createSchema(client);
		}
	} finally {
		await client.end();
	}
}

export function runQuery<T>(c: QueryExecutor, q: sql.Query<T>|sql.Executable):
		Promise<TypedQueryResult<T>> {
	const { text, values } = q.toQuery();
	return (c as pg.Pool).query(text, values);
}

export type QueryExecutor = pg.Pool|pg.Client;

export interface TypedQueryResult<T> {
    command: string;
    rowCount: number;
    oid: number;
    rows: T[];
}

export async function inTransaction<T>(pool: pg.Pool,
		run: (client: pg.Client) => Promise<{ commit: boolean; result: T; }>):
		Promise<T> {
	const client = await pool.connect();
	await client.query('BEGIN');
	try {
		const { commit, result } = await run(client);
		await client.query(commit ? 'COMMIT' : 'ROLLBACK');
		client.release();
		return result;
	} catch (err) {
		client.query('ROLLBACK').then(
			() => client.release(),
			err2 => client.release(err2));
		throw err;
	}
}

export type TransactionRunResult<T> = { result: T; }|undefined;

export interface PGException extends Error {
	code: string;
	schema?: string;
	table?: string;
	column?: string;
	constraint?: string;
}

export const exceptionCode = {
	
	// Class 23 — Integrity Constraint Violation
	integrity_constraint_violation: '23000',
	restrict_violation: '23001',
	not_null_violation: '23502',
	foreign_key_violation: '23503',
	unique_violation: '23505',
	check_violation: '23514',
	exclusion_violation: '23P01',
	
	// Class 42 — Syntax Error or Access Rule Violation
	duplicate_column: '42701',
	duplicate_cursor: '42P03',
	duplicate_database: '42P04',
	duplicate_function: '42723',
	duplicate_prepared_statement: '42P05',
	duplicate_schema: '42P06',
	duplicate_table: '42P07',
	duplicate_alias: '42712',
	duplicate_object: '42710',
	
}
Object.freeze(exceptionCode);

const PARAMS_MARKER = '$?';

/**
 * This function does post-processing of query, constructed with sql lib. It
 * adds parameters to query, constructed with literal function. Markers '$?',
 * that should be added in literal, are substituted with $n, where n is a
 * respective number of a given value, when it is appended to values that come
 * from sql's original query construction.
 * @param q is a query, constructed by sql lib
 * @param extraValues are values, that will be added to parametrized query, in
 * places, corresponding to order of markers. It is an error, if number of
 * mareker doesn't match number of given values.
 */
export function parametrizeLiteralQuery(q: sql.Executable,
		...extraValues: any[]): sql.QueryLike {
	let { text, values } = q.toQuery();
	const txtChunks = text.split(PARAMS_MARKER);
	if ((txtChunks.length - 1) !== extraValues.length) { throw new Error(
		`Number of markers in literal query, ${(txtChunks.length - 1)}, is not matching number of given parameters, ${extraValues.length}.`); }

	const initNumOfVals = values.length;
	text = txtChunks[0];
	for (let i=1; i<txtChunks.length; i+=1) {
		const paramInd = initNumOfVals + i;
		text += `$${paramInd}${txtChunks[i]}`;
	}

	values = values.concat(extraValues);
	return { text, values };
}



Object.freeze(exports);