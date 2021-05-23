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
import SQLite3IF from "./SQLite3IF.js";

/**
 * SQL のタイムアウト設定
 */
const SQL_TIME_OUT = ".timeout 1000\n";

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
		const table_name = SQLite3.execSQL(db_file, ".tables", "-readonly");
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
		const table_info_data = SQLite3.execSQL(db_file, table_info_sql.join(""), "-readonly -json");
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
		const sqt_text = SQL_TIME_OUT + sql;
		sql_file.writeString(sqt_text, "utf-8", "\r\n", false);
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
