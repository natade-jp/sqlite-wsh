/**
 * The script is part of toolbox-wsh.
 * 
 * AUTHOR:
 *  natade (http://twitter.com/natadea)
 * 
 * LICENSE:
 *  The MIT license https://opensource.org/licenses/MIT
 */

/// <reference path="../../include/SenkoWSH.d.ts" />

import SQLite3Schema from "./SQLite3Schema.js";
import SQLite3 from "./SQLite3.js";

/**
 * データベースの操作用インタフェース
 * @requires SQLite3Schema
 * @requires SenkoWSH
 */
export default class SQLite3IF {

	/**
	 * データベースの操作用インタフェース
	 * @param {SFile} db_file DBファイル
	 * @param {string} table_name テーブル名
	 * @param {SQLite3Schema} schema テーブル情報
	 */
	constructor(db_file, table_name, schema) {

		/**
		 * 操作対象のDBファイル
		 */
		this.db_file = db_file;

		/**
		 * 操作対象のテーブル名
		 */
		this.table_name = table_name;

		/**
		 * 操作対象のテーブル情報
		 */
		this.schema = schema;
	}

	/**
	 * 型情報を取得する
	 * @return {Object<string, import("./SQLite3Type.js").SQLite3TypeData>}
	 */
	getTypes() {
		return this.schema.getTypes();
	}

	/**
	 * SQL文を作成する
	 * 
	 * @param {string} sql_type 作成する SQL `select`, `count` など
	 * @param {Object<string, any>} [where] 条件文 `{ A : {$gte : 20} }` など
	 * @param {Object<string, null|number|boolean>} [select] 選択 `{ A : 1 }` など
	 * @param {Object<string, any>} [setdata] 設定値 `{ A : 1 }` など
	 * @returns {string}
	 */
	createSQL(sql_type, where, select, setdata) {
		let sql_text = "";
		if(sql_type === "count") {
			sql_text = "select count(*) from " + this.table_name;
		}
		else if(sql_type === "select") {
			const select_sql = this.schema.createSelectColumnSQL(select);
			if(!select_sql) {
				console.log("Error : createSelectColumnSQL");
				return null;
			}
			sql_text = "select " + select_sql + " from " + this.table_name;
		}
		else if(sql_type === "insert") {
			const value_sql = this.schema.createValuesSQL(setdata);
			if(!value_sql) {
				console.log("Error : createValuesSQL");
				return null;
			}
			sql_text = "insert into " + this.table_name + " " + value_sql;
		}
		else if(sql_type === "delete") {
			sql_text = "delete from " + this.table_name;
		}
		else if(sql_type === "update") {
			const set_sql = this.schema.createSetSQL(setdata);
			if(!set_sql) {
				console.log("Error : createValuesSQL");
				return null;
			}
			sql_text = "update " + this.table_name + " " + set_sql;
		}
		if(where) {
			const where_sql = this.schema.createWhereSQL(where);
			if(where_sql === null) {
				console.log("Error : createWhereSQL");
				return null;
			}
			else if(where_sql.length) {
				sql_text += " " + where_sql;
			}
		}
		return sql_text + ";";
	}

	/**
	 * レコード数を調べる
	 * @param {any} where_record
	 * @returns {number|null} 
	 */
	count(where_record) {
		const sql = this.createSQL("count", where_record);
		if(sql === null) {
			console.log("Error : createSQL");
			return null;
		}
		const sql_data = SQLite3.execSQL(this.db_file, sql, "-readonly");
		if(sql_data === null) {
			console.log("Error : count " + this.table_name);
			return null;
		}
		return Number.parseInt(sql_data, 10);
	}

	/**
	 * レコードを調べる
	 * @param {Object<string, any>} [where_record]
	 * @param {Object<string, null|number|boolean>} [is_show]
	 * @returns {Object<string, any>[]|null}
	 */
	find(where_record, is_show) {
		const sql = this.createSQL("select", where_record, is_show);
		if(sql === null) {
			console.log("Error : createSQL");
			return null;
		}
		const sql_data = SQLite3.execSQL(this.db_file, sql, "-readonly -json");
		if(sql_data === null) {
			console.log("Error : find " + sql.replace(/\n/g, "_"));
			return [];
		}
		if(sql_data.length === 0) {
			// 何もない場合は、見つからない = レコード数 0
			return [];
		}
		return this.schema.normalizeSQLData(sql_data);
	}

	/**
	 * レコードを挿入する
	 * @param {Object<string, any>} insert_record
	 * @returns {boolean}
	 */
	insert(insert_record) {
		const sql = this.createSQL("insert", undefined, undefined, insert_record);
		if(sql === null) {
			console.log("Error : createSQL");
			return false;
		}
		const sql_data = SQLite3.execSQL(this.db_file, sql);
		if(sql_data === null) {
			console.log("Error : insert " + sql.replace(/\n/g, "_"));
			return false;
		}
		return true;
	}

	/**
	 * レコードを削除する
	 * @param {Object<string, any>} [where_record]
	 * @returns {boolean}
	 */
	remove(where_record) {
		const sql = this.createSQL("delete", where_record);
		if(sql === null) {
			console.log("Error : createSQL");
			return false;
		}
		const sql_data = SQLite3.execSQL(this.db_file, sql);
		if(sql_data === null) {
			console.log("Error : remove " + sql.replace(/\n/g, "_"));
			return false;
		}
		return true;
	}

	/**
	 * レコードを変更する
	 * @param {Object<string, any>} where_record
	 * @param {Object<string, any>} update_record
	 * @returns {boolean}
	 */
	update(where_record, update_record) {
		const sql = this.createSQL("update", where_record, undefined, update_record);
		if(sql === null) {
			console.log("Error : createSQL");
			return false;
		}
		const sql_data = SQLite3.execSQL(this.db_file, sql);
		if(sql_data === null) {
			console.log("Error : update " + sql.replace(/\n/g, "_"));
			return false;
		}

	}

}

