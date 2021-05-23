/**
 * SQL のタイムアウト設定
 */
declare const SQL_TIME_OUT = ".timeout 1000\n";

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
 * データベースの操作用インタフェース
 * @requires SQLite3Schema
 * @requires SenkoWSH
 */
declare class SQLite3IF {
    /**
     * 操作対象のDBファイル
     */
    db_file: any;
    /**
     * 操作対象のテーブル名
     */
    table_name: any;
    /**
     * 操作対象のテーブル情報
     */
    schema: any;
    /**
     * 型情報を取得する
     * @return {Object<string, SQLite3TypeData>}
     */
    getTypes(): any;
    /**
     * SQL文を作成する
     *
     * @param {string} sql_type 作成する SQL `select`, `count` など
     * @param {Object<string, any>} [where] 条件文 `{ A : {$gte : 20} }` など
     * @param {Object<string, number>} [select] 選択 `{ A : 1 }` など
     * @returns {string}
     */
    createSQL(sql_type: string, where?: {
        [key: string]: any;
    }, select?: {
        [key: string]: number;
    }): string;
    /**
     * レコード数を調べる
     * @param {any} target_record
     * @returns {number}
     */
    count(target_record: any): number;
    /**
     * レコードを調べる
     * @param {Object<string, any>} [target_record]
     * @param {Object<string, number>} [is_show]
     * @returns {Object<string, any>[]}
     */
    find(target_record?: {
        [key: string]: any;
    }, is_show?: {
        [key: string]: number;
    }): any;
}

declare namespace SQLite3IF {
    /**
     * データベースの操作用インタフェース
     * @param {SFile} db_file DBファイル
     * @param {string} table_name テーブル名
     * @param {SQLite3Schema} schema テーブル情報
     */
    class SQLite3IF {
        constructor(db_file: SFile, table_name: string, schema: SQLite3Schema);
    }
}

/**
 * データベースのテーブルの構造
 * @requires SQLite3Type
 * @requires SenkoWSH
 */
declare class SQLite3Schema {
    /**
     * 列名とその列に対応する型情報
     */
    types: any;
    /**
     * `SQLite3Schema` を作成する
     * `-json` で `pragma table_info(x);` で取得したレコードデータを引数に取る
     *
     * @param {string} table_info_text
     */
    static create(table_info_text: string): void;
    /**
     * 型情報を取得する
     * @return {Object<string, SQLite3TypeData>}
     */
    getTypes(): any;
    /**
     * 型情報を用いてSQLiteから取得したデータを整形する
     * @param {string} sqlite_output_text
     * @returns {Object<string, any>[]}
     */
    normalizeSQLData(sqlite_output_text: string): any;
    /**
     * where文を作成する
     * @param {Object<string, any>} where_obj
     * @returns {string}
     */
    createWhereSQL(where_obj: {
        [key: string]: any;
    }): string;
    /**
     * select文の対象を作成する
     * @param {Object<string, any>} select_column_obj
     * @returns {string}
     */
    createSelectColumnSQL(select_column_obj: {
        [key: string]: any;
    }): string;
}

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
declare type SQLite3TypeData = {
    cid: number;
    name: string;
    type: string;
    size: number;
    dflt_value: any;
    is_not_null: boolean;
};

/**
 * データベース内のテーブルの列情報
 * @requires SenkoWSH
 */
declare class SQLite3Type {
    /**
     * 列情報
     */
    info: any;
    /**
     * 正規化した型名
     */
    normalized_type: any;
    /**
     * `SQLite3Type` を作成する
     * `-json` で `pragma table_info(x);` で取得した1レコードデータを引数に取る
     *
     * @param {SQLite3TableInfo} table_info_record
     */
    static create(table_info_record: any): void;
    /**
     * 型情報を取得する
     *
     * @returns {SQLite3TypeData}
     */
    getType(): SQLite3TypeData;
    /**
     * JavaScript用のデータをSQL文で使用できる文字列へ変換
     * - `SQL` の型情報を元に `SQL` 内への記載用データへ変換
     * - 文字列データはシングルクォーテーションを付けた文字列を返す
     * - 数値データなどはシングルクォーテーション無しの文字列型を返す
     *
     * @param {any} x
     * @returns {string}
     */
    toSQLDataFromJSData(x: any): string;
    /**
     * SQLで取得したデータをJavaScript用のデータへ変換
     * - 「`-json` で取得し `eval` で変換したデータ」から `SQL` の型情報を元に `JavaScript` の型へ変換
     *
     * @param {any} x
     * @returns {any}
     */
    toJSDataFromSQLData(x: any): any;
}

/**
 * toolbox-wsh
 * @requires SenkoWSH
 */
declare const ToolBoxWSH: any;

