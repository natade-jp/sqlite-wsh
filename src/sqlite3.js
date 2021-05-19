/**
 * The script is part of toolbox-wsh.
 * 
 * AUTHOR:
 *  natade (http://twitter.com/natadea)
 * 
 * LICENSE:
 *  The MIT license https://opensource.org/licenses/MIT
 */

/// <reference path="../include/SenkoWSH.d.ts" />

/**
 * データベースのレコードの列データ
 * @typedef {Object} SQLite3TypeData
 * @property {number} cid 列番号
 * @property {string} name 列名
 * @property {string} type 型名
 * @property {number} size 型のサイズ
 * @property {Object} dflt_value 初期値 未設定は(`NULL`)
 * @property {boolean} is_not_null `NULL` を許してよいか
 */

/**
 * `-json` で `pragma table_info(x);` で取得したデータ
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
 * データベース内のテーブルの列情報
 * @private
 * @requires SenkoWSH
 */
class SQLite3Type {

	/**
	 * データベース内のテーブルの列情報する
	 * @param {SQLite3TypeData} info_data
	 * @private
	 */
	constructor(info_data) {
		this.info = info_data;
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
		this.normalized_type = type;
	}

	/**
	 * `-json` で `pragma table_info(x);` で取得した1レコードデータ
	 * @param {SQLite3TableInfo} table_info_record 
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
	 * SQL用の型へ変換
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
	 * JavaScript用の型へ変換
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


/**
 * データベースのテーブルの構造
 * @private
 * @requires SenkoWSH
 */
class SQLite3Schema {

	/**
	 * データベースのテーブルの構造
	 * @param {Object<string, SQLite3Type>} types
	 * @private
	 */
	constructor(types) {
		this.types = types;
	}

	/**
	 * `-json` で `pragma table_info(x);` で取得したレコードデータ
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
	 * @return {Object<string, SQLite3TypeData>}
	 */
	getTypes() {
		/**
		 * @type {Object<string, SQLite3TypeData>}
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

		const sign_map = {
			"$gt"  : ">",
			"$gte" : ">=",
			"$lt"  : "<",
			"$lte" : "<=",
			"$eq"  : "==",
			"$ne"  : "!="
		}

		/**
		 * @param {Object<string, any>} obj 
		 * @param {number} level
		 * @returns {string}
		 */
		const create = function(obj, level) {
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
			if((len === 0) && (level === 0)) {
				return "";
			}

			// 本格的に調査
			for(let i = 0; i < len; i++) {
				const key = keys[i];
				const value = values[i];

				// 型情報の中にあるかどうか
				if(key in this.types) {
					// 型情報にあった場合は、以下の用になる
					//  { money: { $gt: 30 } }

				}


			}

		}
		return create(where_obj, 0);
	}

}


/**
 * SQL のタイムアウト設定
 */
const SQL_TIME_OUT = ".timeout 1000\n";

/**
 * データベースの操作用インタフェース
 * @requires SenkoWSH
 */
class SQLite3IF {

	/**
	 * データベースの操作用インタフェース
	 * @param {SFile} db_file DBファイル
	 * @param {string} table_name テーブル名
	 * @param {SQLite3Schema} schema テーブル情報
	 */
	constructor(db_file, table_name, schema) {
		this.db_file = db_file;
		this.table_name = table_name;
		this.schema = schema;
	}

	/**
	 * 型情報を取得する
	 * @return {Object<string, SQLite3TypeData>}
	 */
	getTypes() {
		return this.schema.getTypes();
	}

	/**
	 * レコードを挿入する
	 * @param {any} insert_record
	 */
	insert(insert_record) {

	}

	/**
	 * レコード数を調べる
	 * @param {any} target_record
	 * @returns {number} 
	 */
	count(target_record) {
		if(target_record === undefined) {
			const sql = SQL_TIME_OUT + "select count(*) from " + this.table_name;
			const sql_data = SQLite3.execSQL(this.db_file, sql, "-readonly");
			if(!sql_data) {
				console.log("count," + this.table_name);
				return null;
			}
			return Number.parseInt(sql_data, 10);
		}
	}

	/**
	 * レコードを調べる
	 * @param {Object<string, any>} [target_record]
	 * @param {Object<string, number>} [is_show]
	 * @returns {Object<string, any>[]}
	 */
	find(target_record, is_show) {
		// TODO ROWID も表示させる
		if(target_record === undefined) {
			if(this.count() === 0) {
				// レコードなし
				return [];
			}
			const sql = SQL_TIME_OUT + "select * from " + this.table_name;
			const sql_data = SQLite3.execSQL(this.db_file, sql, "-readonly -json");
			if(!sql_data) {
				console.log("find," + this.table_name);
				return null;
			}
			return this.schema.normalizeSQLData(sql_data);
		}
		return [];
	}

	/**
	 * レコードを削除する
	 * @param {any} target_record
	 */
	remove(target_record) {

	}

	/**
	 * レコードを変更する
	 * @param {any} update_record
	 * @param {any} target_record
	 */
	update(update_record, target_record) {

	}

}

/**
 * WSH で SQLite3 を使用するためのライブラリ
 * @requires SenkoWSH
 */
export default class SQLite3 {
	
	/**
	 * 利用するデータベースをセット
	 * @param {SFile} db_file DBファイル
	 * @returns {Object<string, SQLite3IF>} テーブル操作用データ
	 */
	static use(db_file) {
		/**
		 * @type {Object<string, SQLite3IF>}
		 */
		const output = {};

		// テーブル名のリストを作成
		const table_name = SQLite3.execSQL(db_file, SQL_TIME_OUT + ".tables", "-readonly");
		if(!table_name) {
			console.log("use1," + db_file);
			return null;
		}
		const table_name_list = table_name.trim().split(/\s+/);

		// テーブル内の列データを作成する
		/**
		 * 列名
		 * @type {string[]}
		 */
		const table_info_sql = [];
		for(let i = 0; i < table_name_list.length; i++) {
			const key = table_name_list[i];
			table_info_sql.push("pragma table_info(" + key + ");");
		}

		// テーブル内の列データを全て取得する
		const table_info_data = SQLite3.execSQL(db_file, SQL_TIME_OUT + table_info_sql.join(""), "-readonly -json");
		if(!table_info_data) {
			console.log("use2," + db_file);
			return null;
		}
		// []で括られた1テーブルごとのJSON情報から、1テーブルずつ抜き出して、データを格納する
		
		/**
		 * 列情報
		 * @type {SQLite3Schema[]}
		 */
		const type_obj_list = [];
		/**
		 * @param {string} table_info_text
		 * @returns {string}
		 * @private
		 */
		const create_table_info = function(table_info_text) {
			type_obj_list.push(SQLite3Schema.create(table_info_text));
			return "";
		}
		table_info_data.replace(/(\[[^\]]+\])/g, create_table_info);

		// IFを作成していく
		for(let i = 0; i < table_name_list.length; i++) {
			const key = table_name_list[i];
			const data = new SQLite3IF(db_file, key, type_obj_list[i]);
			output[key] = data;
		}
		return output;
	}

	/**
	 * SQL文を実行する
	 * @param {SFile} db_file DBファイル
	 * @param {string} sql SQL文
	 * @param {string} [option] 実行時のオプション
	 * @returns {string | null} SQL実行結果
	 */
	 static execSQL(db_file, sql, option) {
		if(!SQLite3.sqlite3) {
			console.log("execSQL," + db_file + "," + sql);
			return null;
		}
		const option_ = option !== undefined ? option : "";
		const sql_file = SFile.createTempFile();
		sql_file.writeString(sql, "utf-8", "\r\n", false);
		const script = "\"" + SQLite3.sqlite3.getAbsolutePath() + "\" \"" + db_file.getAbsolutePath() + "\" " + option_ + " < \"" + sql_file.getAbsolutePath() + "\"";
		const output = System.execBatchScript(script, "utf-8");
		sql_file.remove();
		/*
		console.log("*************");
		console.log(sql);
		console.log("****");
		console.log(output);
		console.log("*************");
		*/
		return output;
	 }

	/**
	 * ツールをインストールする
	 * - `./lib/sqlite3.exe` を利用する
	 * - ファイルが存在しない場合は自動でダウンロードする
	 * - 本ライブラリを使用する場合は、`setSQLite3` でツールを設定するか、`install` でダウンロードする必要がある
	 * 
	 * @returns {boolean}
	 */
	static install() {
		if(SQLite3.sqlite3) {
			return true;
		}
		const exe_path = "./lib/sqlite3.exe";
		const exe_file = new SFile(exe_path);
		if(exe_file.isFile()) {
			// ファイルがある場合はそれを設定する
			return SQLite3.setSQLite3(exe_file);
		}
		else {
			// ファイルがない場合は、ダウンロードしてくれる
			new SFile("./lib").mkdirs();
			const download_url = "https://www.sqlite.org/download.html";
			const download_text = new SFile(download_url).readString();
			if(download_text) {
				const match_data = download_text.match(/'[^']+\/sqlite-tools-win32[^']+'/);
				if(match_data) {
					const match_text = match_data[0].toString();
					const zip_url = "https://www.sqlite.org/" + match_text.substr(1, match_text.length - 2);
					const zip_binary = new SFile(zip_url).readBinary();
					if(zip_binary.length !== 0) {
						const temp_file_1 = SFile.createTempFile();
						temp_file_1.mkdirs();
						const zip_file = new SFile(temp_file_1 + "\\" + new SFile(zip_url).getName());
						zip_file.writeBinary(zip_binary);
						const temp_file_2 = SFile.createTempFile();
						SFile.extract(zip_file, temp_file_2);
						/**
						 * @type {SFile}
						 */
						const sqlite3_file = SFile.findFile(temp_file_2, /\\sqlite3.exe$/i);
						if(sqlite3_file) {
							sqlite3_file.move("./lib");
						}
						temp_file_1.remove();
						temp_file_2.remove();
						return SQLite3.setSQLite3(sqlite3_file);
					}
				}
			}
		}
		return false;
	}

	/**
	 * ツールを設定する
	 * - `*.db` を操作するための `sqlite-tools-win32` に含まれる `sqlite3.exe` を設定する
	 * @param {SFile|string} sqlite_tool_path
	 * @returns {boolean}
	 */
	static setSQLite3(sqlite_tool_path) {
		const exe_file = new SFile(sqlite_tool_path);
		if(!exe_file.isFile() || !/sqlite3.exe$/i.test(exe_file.getAbsolutePath()) ) {
			return false;
		}
		SQLite3.sqlite3 = exe_file;
		return true;
	}
	
}

/**
 *  `*.db` を操作するための `sqlite-tools-win32` に含まれる `sqlite3.exe`
 * @type {SFile}
 */
SQLite3.sqlite3 = null;
