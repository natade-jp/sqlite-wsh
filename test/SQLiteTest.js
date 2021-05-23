//@ts-check
/// <reference path="../include/SenkoWSH.d.ts" />
/// <reference path="../build/toolbox-wsh.d.ts" />

System.executeOnCScript();
System.initializeCurrentDirectory();

SQLite3.install();

var db_file = new SFile("./SQLiteTest.db");
var db = SQLite3.use(db_file);

for(var key in db) {
	console.log("table : " + key);
	console.log("types : " + JSON.stringify(db[key].getTypes()));
	console.log("data  : " + JSON.stringify(db[key].find()));
}

console.log(db.A.createSQL( "select", { "C" : { $ne: "A" } , "B" : 123 } ));
console.log(db.A.createSQL( "select", {$or: [{A: "A"} , {B: "123" }]}, { A : 1 } ));
console.log(db.A.find( {$or: [{A: "A"} , {B: "123" }]}, { A : 1 } ));

console.log("終了");
System.stop();
