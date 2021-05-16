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
 * @property {string} column_name 列名
 * @property {string} type_name 型名
 * @property {number} size 型のサイズ
 * @property {boolean} is_unique ユニークかどうか
 * @property {boolean} is_not_null NULLを許してよいか
 */

/**
 * データベースのレコードの列データの形式
 * @private
 * @requires SenkoWSH
 */
class SQLite3Type {

	/**
	 * データベースのレコードの列データの形式を作成する
	 * @param {SQLite3TypeData} type_data
	 * @private
	 */
	constructor(type_data) {
		this.type_data = type_data;
		let type = "undefined";
		// https://www.sqlite.org/datatype3.html
		// TEXT, VARCHAR
		if(/char|clob|text|decimal/i.test(this.type_data.type_name)) {
			type = "string";
		}
		// NUMERIC
		else if(/numeric/i.test(this.type_data.type_name)) {
			type = "numeric";
		}
		// INTEGER
		else if(/int/i.test(this.type_data.type_name)) {
			type = "int";
		}
		// REAL
		else if(/double|float|real/i.test(this.type_data.type_name)) {
			type = "real";
		}
		// BLOB
		else if(/blob/i.test(this.type_data.type_name)) {
			type = "blob";
		}
		// BOOLEAN(NUMERIC)
		else if(/boolean/i.test(this.type_data.type_name)) {
			type = "boolean";
		}
		// DATETIME(NUMERIC)
		else if(/date|datetime/i.test(this.type_data.type_name)) {
			type = "datetime";
		}
		// NONE(NUMERIC)
		else if(/none/i.test(this.type_data.type_name)) {
			type = "none";
		}
		this.normalized_type = type;
	}

	/**
	 * `.schema` で取得した行
	 * @param {string} line_text 
	 */
	static create(line_text) {
		const match_data = line_text.match(/\[(\w+)\] ([A-Z_]*)(.*)/ );
		if(!match_data) {
			console.log("create," + line_text);
			return null;
		}
		const column_name = match_data[1];
		const type_name = match_data[2];
		const string_after = match_data[3];
		const is_unique = /UNIQUE/i.test(string_after);
		const is_not_null = /NOT NULL/i.test(string_after);
		const size_data = string_after.match(/\(([0-9]+)\)/ );
		const size = size_data ? Number.parseInt(size_data[1], 10) : -1;
		return new SQLite3Type({
			column_name : column_name,
			type_name : type_name,
			size : size,
			is_unique : is_unique,
			is_not_null : is_not_null
		});
	}

	/**
	 * 型情報を取得する
	 * @returns {SQLite3TypeData}
	 */
	getType() {
		return {
			column_name : this.type_data.column_name,
			type_name : this.type_data.type_name,
			size : this.type_data.size,
			is_unique : this.type_data.is_unique,
			is_not_null : this.type_data.is_not_null
		};
	}

	/**
	 * SQL用の型へ変換
	 * - `SQL` の型情報を元に `SQL` 内への記載用データへ変換
	 * 
	 * @param {any} x
	 * @returns {string}
	 */
	toSQLDataFromJSData(x) {
		const td = this.type_data;
		const js_type = System.typeOf(x);
		if(this.normalized_type === "string") {
			/**
			 * @type {string}
			 */
			const str = x.toString();
			if(td.size === -1) {
				return "\"" + str + "\"";
			}
			else {
				return "\"" + str.slice(0, td.size) + "\"";
			}
		}
		else if((this.normalized_type === "numeric") || (this.normalized_type === "none")) {
			if(js_type !== "number") {
				return "\"" + x + "\"";
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
			return Math.toString();
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
	 */
	constructor(db_file, table_name) {
		this.db_file = db_file;
		this.table_name = table_name;
		this.initSchema();
	}

	/**
	 * テーブルのスキーマを読み込んで内部で設定する
	 * @private
	 * @returns {boolean} 
	 */
	initSchema() {
		const sql = SQL_TIME_OUT + ".schema " + this.table_name;
		const sql_data = SQLite3.execSQL(this.db_file, sql, "-readonly");
		if(!sql_data) {
			console.log("initSchema[1]," + this.table_name);
			return false;
		}
		const lines = sql_data.match(/^\[\w+\] [A-Z_]*.*$/mg);
		if(!lines) {
			console.log("initSchema[2]," + this.table_name);
			return false;
		}
		/**
		 * @type {Object<string, SQLite3Type>}
		 */
		const type_data = {};
		for(let i = 0; i < lines.length; i++) {
			const type = SQLite3Type.create(lines[i]);
			if(type === null) {
				return false;
			}
			type_data[type.getType().column_name] = type;
		}
		this.type_data = type_data;
		return true;
	}

	/**
	 * 型情報を用いてSQLiteから取得したデータを整形する
	 * @param {string} sqlite_output_text
	 * @returns {Object<string, any>[]}
	 * @private
	 */
	normalizeSQLData(sqlite_output_text) {
		/**
		 * @type {Object<string, any>[]}
		 */
		const obj_data = JSON.parse(sqlite_output_text);
		for(let i = 0; i < obj_data.length; i++) {
			const tgt = obj_data[i];
			for(const key in tgt) {
				if(key in this.type_data) {
					tgt[key] = this.type_data[key].toJSDataFromSQLData(tgt[key]);
				}
			}
		}
		return obj_data;
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
		for(const key in this.type_data) {
			output[key] = this.type_data[key].getType();
		}
		return output;
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
	 * @param {any} target_record
	 * @returns {Object<string, any>[]}
	 */
	find(target_record) {
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
			return this.normalizeSQLData(sql_data);
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
		const table_name = SQLite3.execSQL(db_file, SQL_TIME_OUT + ".tables", "-readonly");
		if(!table_name) {
			console.log("use," + db_file);
			return null;
		}
		/**
		 * @type {Object<string, SQLite3IF>}
		 */
		const output = {};
		const table_list = table_name.trim().split(/\s+/);
		for(let i = 0; i < table_list.length; i++) {
			const key = table_list[i];
			const data = new SQLite3IF(db_file, key);
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
