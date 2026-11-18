const fs=require("fs"),path=require("path");
function load(f,k){const s=fs.readFileSync(path.join("site/assets",f),"utf8");return new Function("window",s+"\nreturn window."+k+";")(globalThis);}
load("data/characters.js","HANZI"); load("data/characters2.js","HANZI2");
const all=[].concat(globalThis.HANZI||[],globalThis.HANZI2||[]);
const set=new Set(all.map(c=>c.c).filter(Boolean));
"名字学光明德仁礼信诚善谦毅恒正温雅文思书哲睿博渊涵聪敏颖志远宏鹏鸿骏帆峰岳山川海澜云月星辰松竹梅兰荷林静淑婉宁和泰安琳瑾瑜璇琪瑞瑶清澄朗润熙景嘉福荣翔衡".split("").forEach(c=>set.add(c));
const chars=[...set];
fs.writeFileSync("_chars.txt",chars.join(""),"utf8");
console.log("total chars:",chars.length);
