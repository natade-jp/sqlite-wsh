/// <reference path="../include/SenkoWSH.d.ts" />
/// <reference path="../build/toolbox-wsh.d.ts" />

System.executeOnCScript();
System.initializeCurrentDirectory();

// 練習用のスクリプトです。
// コメントアウトを外したりして、色々試してみてください。

console.log("ツールをインストールします。");
console.log("結果 "+ SQLite3.install());

console.log("自動的に終了します。");
System.sleep(60.0);
