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
 * WSH で SQLite3 を使用するためのライブラリ
 * @requires SenkoWSH
 */
export default class SQLite3 {
	
	/**
	 * DB名を設定する
	 * @param {SFile|string} filename 
	 */
	constructor(filename) {
		this.file = new SFile(filename);
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
			const download_text = new SFile(download_url).getTextFile();
			if(download_text) {
				const match_data = download_text.match(/'[^']+\/sqlite-tools-win32[^']+'/);
				if(match_data) {
					const match_text = match_data[0].toString();
					const zip_url = "https://www.sqlite.org/" + match_text.substr(1, match_text.length - 2);
					const zip_binary = new SFile(zip_url).getBinaryFile();
					if(zip_binary.length !== 0) {
						const temp_file_1 = SFile.createTempFile();
						temp_file_1.mkdirs();
						const zip_file = new SFile(temp_file_1 + "\\" + new SFile(zip_url).getName());
						zip_file.setBinaryFile(zip_binary);
						const temp_file_2 = SFile.createTempFile();
						SFile.extract(zip_file, temp_file_2);
						/**
						 * @type {SFile}
						 */
						// @ts-ignore
						const sqlite3_file = temp_file_2.searchFile(/\\sqlite3.exe$/i);
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
