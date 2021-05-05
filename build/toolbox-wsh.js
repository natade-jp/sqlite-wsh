/*!
 * toolbox-wsh.js (version 1.0.0, 2021/5/3)
 * https://github.com/natade-jp/sqlite-wsh
 * Copyright 2021-2021 natade < https://github.com/natade-jp >
 *
 * The MIT license.
 * https://opensource.org/licenses/MIT
 */
!function(e,i){"object"==typeof exports&&"undefined"!=typeof module?module.exports=i():"function"==typeof define&&define.amd?define(i):(e=e||self)["sqlite-wsh"]=i()}(this,function(){"use strict";function u(e){this.file=new SFile(e)}u.install=function(){if(u.sqlite3)return!0;var e=new SFile("./lib/sqlite3.exe");if(e.isFile())return u.setSQLite3(e);new SFile("./lib").mkdirs();var i=new SFile("https://www.sqlite.org/download.html").getTextFile();if(i){var t=i.match(/'[^']+\/sqlite-tools-win32[^']+'/);if(t){var l=t[0].toString(),n="https://www.sqlite.org/"+l.substr(1,l.length-2),r=new SFile(n).getBinaryFile();if(0!==r.length){var s=SFile.createTempFile();s.mkdirs();var o=new SFile(s+"\\"+new SFile(n).getName());o.setBinaryFile(r);var a=SFile.createTempFile();SFile.extract(o,a);var f=a.searchFile(/\\sqlite3.exe$/i);return f&&f.move("./lib"),s.remove(),a.remove(),u.setSQLite3(f)}}}return!1},u.setSQLite3=function(e){var i=new SFile(e);return!(!i.isFile()||!/sqlite3.exe$/i.test(i.getAbsolutePath()))&&(u.sqlite3=i,!0)},u.sqlite3=null;var e={SQLite3:u};return System.isDefined("SQLite3")||(SQLite3=u),e});
