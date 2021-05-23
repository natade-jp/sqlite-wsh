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

import SQLite3Type from "./SQLite3Type.js";

/**
 * `-json` で `pragma table_info(x);` で取得した情報
 * @typedef {Object} SQLite3TableInfo
 * @property {number} cid 列番号
 * @property {string} name 列名
 * @property {string} type 型名 + 型のサイズ
 * @property {number} notnull `NULL` を許してよいか
 * @property {string} dflt_value 初期値 未設定は(`NULL`)
 * @property {number} pk 主キーとして設定されているか
 * @private
 */

/**
 * データベースのテーブルの構造
 * @requires SQLite3Type
 * @requires SenkoWSH
 */
export default class SQLite3Schema {

	/**
	 * データベースのテーブルの構造
	 * - `create` を使用して作成すること
	 * 
	 * @param {Object<string, SQLite3Type>} types 列名とその列に対応する型情報
	 * @private
	 */
	constructor(types) {

		/**
		 * 列名とその列に対応する型情報
		 */
		this.types = types;

	}

	/**
	 * `SQLite3Schema` を作成する
	 * `-json` で `pragma table_info(x);` で取得したレコードデータを引数に取る
	 * 
	 * @param {string} table_info_text
	 */
	static create(table_info_text) {

		/**
		 * @type {SQLite3TableInfo[]}
		 */
		const table_info_array = JSON.parse(table_info_text);

		/**
		 * @type {Object<string, SQLite3Type>}
		 */
		const info_data = {};
		// 専用の列データ型へ置き換える
		for(let j = 0; j < table_info_array.length; j++) {
			const table_info = table_info_array[j];
			info_data[table_info.name] = SQLite3Type.create(table_info);
		}

		return new SQLite3Schema(info_data);
	}

	/**
	 * 型情報を取得する
	 * @return {Object<string, import("./SQLite3Type.js").SQLite3TypeData>}
	 */
	getTypes() {
		/**
		 * @type {Object<string, import("./SQLite3Type.js").SQLite3TypeData>}
		 */
		const output = {};
		for(const key in this.types) {
			output[key] = this.types[key].getType();
		}
		return output;
	}

	/**
	 * 型情報を用いてSQLiteから取得したデータを整形する
	 * @param {string} sqlite_output_text
	 * @returns {Object<string, any>[]}
	 */
	normalizeSQLData(sqlite_output_text) {
		/**
		 * @type {Object<string, any>[]}
		 */
		const obj_data = JSON.parse(sqlite_output_text);
		for(let i = 0; i < obj_data.length; i++) {
			const tgt = obj_data[i];
			for(const key in tgt) {
				if(key in this.types) {
					tgt[key] = this.types[key].toJSDataFromSQLData(tgt[key]);
				}
			}
		}
		return obj_data;
	}

	/**
	 * where文を作成する
	 * @param {Object<string, any>} where_obj
	 * @returns {string}
	 */
	createWhereSQL(where_obj) {
		if(where_obj === undefined) {
			return "";
		}

		/**
		 * @type {Object<string, string>}
		 */
		const sign_map = {
			"$gt"  : ">",
			"$gte" : ">=",
			"$lt"  : "<",
			"$lte" : "<=",
			"$eq"  : "==",
			"$ne"  : "!="
		}

		const types = this.types;

		/**
		 * @param {Object<string, any>} obj 
		 * @param {number} level
		 * @param {string[]} sql_text
		 * @returns
		 */
		const create = function(obj, level, sql_text) {
			// 下調べ
			let len = 0;
			/**
			 * @type {string[]}
			 */
			const keys = [];
			/**
			 * @type {any[]}
			 */
			const values = [];
			for(const key in obj) {
				len++;
				keys.push(key);
				values.push(obj[key]);
			}

			let is_first = true;

			// 本格的に調査
			for(let i = 0; i < len; i++) {
				const key = keys[i];

				// 型情報の中にあるかどうか
				if(key in types) {

					const value = values[i];
					const value_type = System.typeOf(value);

					if(value_type === "object") {

						// 型情報にあった場合は、以下の用になる
						//  { money: { $gt: 30 } }
						/**
						 * @type {Object<string, string>}
						 */
						const data = value;

						// 型情報の設定があるか
						for(const data_key in data) {
							if(sign_map[data_key]) {
								if(!is_first) {
									sql_text.push("and");
								}
								else {
									is_first = false;
								}
								sql_text.push("(");
								sql_text.push(key);
								sql_text.push(sign_map[data_key]);
								sql_text.push(types[key].toSQLDataFromJSData(data[data_key]));
								sql_text.push(")");
								continue;
							}
						}
					}
					else {
						// 指定がない場合は = 判定
						if(!is_first) {
							sql_text.push("and");
						}
						else {
							is_first = false;
						}
						sql_text.push("(");
						sql_text.push(key);
						sql_text.push("=");
						sql_text.push(types[key].toSQLDataFromJSData(value));
						sql_text.push(")");
					}
				}
				// or 条件
				else if(key === "$or") {
					/**
					 * @type {Object<string, string>[]}
					 */
					const data = values[i];
					for(let j = 0; j < data.length; j++) {
						if(j > 0) {
							sql_text.push("or");
						}
						sql_text.push("(");
						create(data[j], level + 1, sql_text);
						sql_text.push(")");
					}
				}
			}
		}

		/**
		 * @type {string[]}
		 */
		const sql_text = [];
		create(where_obj, 0, sql_text);

		return sql_text.length ? "where " + sql_text.join(" ") : "";
	}

	/**
	 * select文の対象を作成する
	 * @param {Object<string, any>} select_column_obj
	 * @returns {string}
	 */
	createSelectColumnSQL(select_column_obj) {
		/**
		 * @type {string[]}
		 */
		const column_array = [];
		if(select_column_obj === undefined) {
			// 全選択
			column_array.push("rowid");
			for(const key in this.types) {
				column_array.push(key);
			}
		}
		else {
			for(const key in select_column_obj) {
				if(!(key in this.types)) {
					console.log("not found : " + key);
					continue;
				}
				if(select_column_obj[key]) {
					column_array.push(key);
				}
			}
		}
		return column_array.join(", ");
	}

}
