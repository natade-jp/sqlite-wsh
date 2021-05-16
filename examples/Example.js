//@ts-check
/// <reference path="../include/SenkoWSH.d.ts" />
/// <reference path="../build/toolbox-wsh.d.ts" />

System.executeOnCScript();
System.initializeCurrentDirectory();

SQLite3.install();
var db = SQLite3.use(new SFile("./TEST_DB.db"));

for(var key in db) {
	console.log("table : " + key);
	console.log("types : " + JSON.stringify(db[key].getTypes()));
	console.log("data  : " + JSON.stringify(db[key].find()));
}

console.log("終了");
System.stop();
