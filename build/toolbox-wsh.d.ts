/**
 * データベースのレコードの列データ
 * @typedef {Object} SQLite3TypeData
 * @property {string} column_name 列名
 * @property {string} type_name 型名
 * @property {number} size 型のサイズ
 * @property {boolean} is_unique ユニークかどうか
 * @property {boolean} is_not_null NULLを許してよいか
 */
declare type SQLite3TypeData = {
    column_name: string;
    type_name: string;
    size: number;
    is_unique: boolean;
    is_not_null: boolean;
};

/**
 * SQL のタイムアウト設定
 */
declare const SQL_TIME_OUT = ".timeout 1000\n";

/**
 * データベースの操作用インタフェース
 * @param {SFile} db_file DBファイル
 * @param {string} table_name テーブル名
 */
declare class SQLite3IF {
    constructor(db_file: SFile, table_name: string);
    /**
     * 型情報を取得する
     * @return {Object<string, SQLite3TypeData>}
     */
    getTypes(): {
        [key: string]: SQLite3TypeData;
    };
    /**
     * レコードを挿入する
     * @param {any} insert_record
     */
    insert(insert_record: any): void;
    /**
     * レコード数を調べる
     * @param {any} target_record
     * @returns {number}
     */
    count(target_record: any): number;
    /**
     * レコードを調べる
     * @param {any} target_record
     * @returns {any}
     */
    find(target_record: any): any;
    /**
     * レコードを削除する
     * @param {any} target_record
     */
    remove(target_record: any): void;
    /**
     * レコードを変更する
     * @param {any} update_record
     * @param {any} target_record
     */
    update(update_record: any, target_record: any): void;
}

/**
 * WSH で SQLite3 を使用するためのライブラリ
 * @requires SenkoWSH
 */
declare class SQLite3 {
    /**
     * 利用するデータベースをセット
     * @param {SFile} db_file DBファイル
     * @returns {Object<string, SQLite3IF>} テーブル操作用データ
     */
    static use(db_file: SFile): {
        [key: string]: SQLite3IF;
    };
    /**
     * SQL文を実行する
     * @param {SFile} db_file DBファイル
     * @param {string} sql SQL文
     * @param {string} [option] 実行時のオプション
     * @returns {string | null} SQL実行結果
     */
    static execSQL(db_file: SFile, sql: string, option?: string): string | null;
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
    /**
     *  `*.db` を操作するための `sqlite-tools-win32` に含まれる `sqlite3.exe`
     * @type {SFile}
     */
    static sqlite3: SFile;
}

/**
 * toolbox-wsh
 * @requires SenkoWSH
 */
declare const ToolBoxWSH: any;

