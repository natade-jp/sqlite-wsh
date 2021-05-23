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
	 * @param {Object<string, number>} [select] 選択 `{ A : 1 }` など
	 * @returns {string}
	 */
	 createSQL(sql_type, where, select) {
		let sql_text = "";
		const sql_from = " from " + this.table_name + " ";
		const sql_where = where ? this.schema.createWhereSQL(where) : "";
		if(sql_type === "count") {
			sql_text = "select count(*)" + sql_from;
		}
		else if(sql_type === "select") {
			sql_text = "select " + this.schema.createSelectColumnSQL(select) + sql_from;
		}
		if(sql_where.length) {
			sql_text += sql_where;
		}
		return sql_text;
	}

	/**
	 * レコード数を調べる
	 * @param {any} target_record
	 * @returns {number} 
	 */
	count(target_record) {
		const sql = this.createSQL("count", target_record);
		const sql_data = SQLite3.execSQL(this.db_file, sql, "-readonly");
		if(!sql_data) {
			console.log("count," + this.table_name);
			return null;
		}
		return Number.parseInt(sql_data, 10);
	}

	/**
	 * レコードを調べる
	 * @param {Object<string, any>} [target_record]
	 * @param {Object<string, number>} [is_show]
	 * @returns {Object<string, any>[]}
	 */
	find(target_record, is_show) {
		const sql = this.createSQL("select", target_record, is_show);
		const sql_data = SQLite3.execSQL(this.db_file, sql, "-readonly -json");
		if(!sql_data) {
			console.log("not find, " + sql.replace(/\n/g, "_"));
			return [];
		}
		return this.schema.normalizeSQLData(sql_data);
	}

	/*
	 * レコードを挿入する
	 * @param {any} insert_record
	 */
//	insert(insert_record) {
//
//	}

	/*
	 * レコードを削除する
	 * @param {any} target_record
	 */
//	remove(target_record) {
//	}

	/*
	 * レコードを変更する
	 * @param {any} update_record
	 * @param {any} target_record
	 */
//	update(update_record, target_record) {
//	}

}

