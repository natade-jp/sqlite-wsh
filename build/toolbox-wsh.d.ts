/**
 * WSH で SQLite3 を使用するためのライブラリ
 * @requires SenkoWSH
 */
declare class SQLite3 {
    /**
     * ツールをインストールする
     * - `./lib/sqlite3.exe` を利用する
     * - ファイルが存在しない場合は自動でダウンロードする
     * - 本ライブラリを使用する場合は、`setSQLite3` でツールを設定するか、`install` でダウンロードする必要がある
     *
     * @returns {boolean}
     */
    static install(): boolean;
    /**
     * ツールを設定する
     * - `*.db` を操作するための `sqlite-tools-win32` に含まれる `sqlite3.exe` を設定する
     * @param {SFile|string} sqlite_tool_path
     * @returns {boolean}
     */
    static setSQLite3(sqlite_tool_path: SFile | string): boolean;
}

declare namespace SQLite3 {
    /**
     * DB名を設定する
     * @param {SFile|string} filename
     */
    class SQLite3 {
        constructor(filename: SFile | string);
    }
}

/**
 * toolbox-wsh
 * @requires SenkoWSH
 */
declare const ToolBoxWSH: any;

