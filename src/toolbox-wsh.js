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

import typeSQLite3 from "./SQLite3/SQLite3.js";

/**
 * toolbox-wsh
 * @requires SenkoWSH
 */
const ToolBoxWSH = {
	
	/**
 	 * @type {typeof typeSQLite3}
	 */
	 SQLite3 : typeSQLite3

}

export default ToolBoxWSH;

if(!(System.isDefined("SQLite3"))) {
	// @ts-ignore
	// eslint-disable-next-line no-undef
	SQLite3 = typeSQLite3;
}
