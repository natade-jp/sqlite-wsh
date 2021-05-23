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

/**
 * データベースのレコードの列情報
 * @typedef {Object} SQLite3TypeData
 * @property {number} cid 列番号
 * @property {string} name 列名
 * @property {string} type 型名
 * @property {number} size 型のサイズ
 * @property {Object} dflt_value 初期値 未設定は(`NULL`)
 * @property {boolean} is_not_null `NULL` を許してよいか
 */

/**
 * データベース内のテーブルの列情報
 * @requires SenkoWSH
 */
export default class SQLite3Type {

	/**
	 * データベース内のテーブルの列情報を初期設定する
	 * - `create` を使用して作成すること
	 * 
	 * @param {SQLite3TypeData} info_data
	 * @private
	 */
	constructor(info_data) {

		/**
		 * 列情報
		 */
		this.info = info_data;

		// SQLite には扱える型名が複数あるため正規化した型名を作成
		{
			let type = "undefined";
			// https://www.sqlite.org/datatype3.html
			// TEXT, VARCHAR
			if(/char|clob|text|decimal/i.test(this.info.type)) {
				type = "string";
			}
			// NUMERIC
			else if(/numeric/i.test(this.info.type)) {
				type = "numeric";
			}
			// INTEGER
			else if(/int/i.test(this.info.type)) {
				type = "int";
			}
			// REAL
			else if(/double|float|real/i.test(this.info.type)) {
				type = "real";
			}
			// BLOB
			else if(/blob/i.test(this.info.type)) {
				type = "blob";
			}
			// BOOLEAN(NUMERIC)
			else if(/boolean/i.test(this.info.type)) {
				type = "boolean";
			}
			// DATETIME(NUMERIC)
			else if(/date|datetime/i.test(this.info.type)) {
				type = "datetime";
			}
			// NONE(NUMERIC)
			else if(/none/i.test(this.info.type)) {
				type = "none";
			}

			/**
			 * 正規化した型名
			 */
			this.normalized_type = type;
		}
	}

	/**
	 * `SQLite3Type` を作成する
	 * `-json` で `pragma table_info(x);` で取得した1レコードデータを引数に取る
	 * 
	 * @param {import("./SQLite3Schema").SQLite3TableInfo} table_info_record 
	 */
	static create(table_info_record) {
		const cid = table_info_record.cid;
		const name = table_info_record.name;
		const type_data = table_info_record.type.match(/[^(]+/);
		const type = type_data ? type_data[0] : "NONE";
		const dflt_value = table_info_record.dflt_value;
		const is_not_null = table_info_record.notnull !== 0;
		const size_data = table_info_record.type.match(/\(([0-9]+)\)/);
		const size = size_data ? Number.parseInt(size_data[1], 10) : -1;
		return new SQLite3Type({
			cid : cid,
			name : name,
			type : type,
			size : size,
			dflt_value : dflt_value,
			is_not_null : is_not_null
		});
	}

	/**
	 * 型情報を取得する
	 * 
	 * @returns {SQLite3TypeData}
	 */
	getType() {
		return {
			cid : this.info.cid,
			name : this.info.name,
			type : this.info.type,
			size : this.info.size,
			dflt_value : this.info.dflt_value,
			is_not_null : this.info.is_not_null
		};
	}

	/**
	 * JavaScript用のデータをSQL文で使用できる文字列へ変換
	 * - `SQL` の型情報を元に `SQL` 内への記載用データへ変換
	 * - 文字列データはシングルクォーテーションを付けた文字列を返す
	 * - 数値データなどはシングルクォーテーション無しの文字列型を返す
	 * 
	 * @param {any} x
	 * @returns {string}
	 */
	toSQLDataFromJSData(x) {
		const td = this.info;
		const js_type = System.typeOf(x);
		if(this.normalized_type === "string") {
			/**
			 * @type {string}
			 */
			const str = x.toString();
			if(td.size === -1) {
				return "'" + str + "'";
			}
			else {
				return "'" + str.slice(0, td.size) + "'";
			}
		}
		else if((this.normalized_type === "numeric") || (this.normalized_type === "none")) {
			if(js_type !== "number") {
				return "'" + x + "'";
			}
			return x.toString();
		}
		else if(this.normalized_type === "int") {
			if(js_type !== "number") {
				return Number.parseFloat(x).toString();
			}
			return Math.trunc(x).toString();
		}
		else if(this.normalized_type === "real") {
			if(js_type !== "number") {
				return Number.parseFloat(x).toString();
			}
			return x.toString();
		}
		else if(this.normalized_type === "blob") {
			return "null";
		}
		else if(this.normalized_type === "boolean") {
			return !!x ? "1" : "0";
		}
		else if(this.normalized_type === "datetime") {
			const date = new Date(x);
			return date.getTime().toString();
		}
		console.log("toSQLDataFromJSData:" + x);
		return "null";
	}

	/**
	 * SQLで取得したデータをJavaScript用のデータへ変換
	 * - 「`-json` で取得し `eval` で変換したデータ」から `SQL` の型情報を元に `JavaScript` の型へ変換
	 * 
	 * @param {any} x
	 * @returns {any}
	 */
	toJSDataFromSQLData(x) {
		const js_type = System.typeOf(x);
		if(this.normalized_type === "string") {
			if(js_type === "string") {
				return x;
			}
			else if(js_type === "object") {
				return null;
			}
			else {
				return x.toString();
			}
		}
		else if((this.normalized_type === "numeric") || (this.normalized_type === "none")) {
			if(js_type === "object") {
				return null;
			}
			const number = Number.parseFloat(x);
			if(Number.isFinite(number)) {
				return number;
			}
			if(x.toString() === number.toString()) {
				return number;
			}
			return x.toString();
		}
		else if(this.normalized_type === "int") {
			if(js_type === "object") {
				return null;
			}
			return Number.parseInt(x, 10);
		}
		else if(this.normalized_type === "real") {
			if(js_type === "object") {
				return null;
			}
			return Number.parseFloat(x);
		}
		else if(this.normalized_type === "blob") {
			return {};
		}
		else if(this.normalized_type === "boolean") {
			const number = Number.parseFloat(x);
			return number !== 0;
		}
		else if(this.normalized_type === "datetime") {
			/**
			 * @type {string}
			 */
			const date = x.toString();
			return new Date(date.replace(/\-/g, "/"));
		}
		return null;
	}

}
