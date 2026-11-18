const fs=require("fs");
const src=fs.readFileSync("site/assets/lib/lunar.js","utf8");
const mod={exports:{}};
const fn=new Function("module","exports",src);
fn(mod,mod.exports);
const L=mod.exports;
console.log("keys:", Object.keys(L).slice(0,12).join(","));
const Solar=L.Solar;
const s=Solar.fromYmd(1994,1,27);
const lunar=s.getLunar();
console.log("lunarDate:", lunar.toString());
console.log("yearShengXiao:", lunar.getYearShengXiao());
console.log("monthCn:", lunar.getMonthInChinese(), "dayCn:", lunar.getDayInChinese());
const ec=lunar.getEightChar();
console.log("bazi:", ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime());
console.log("wuXing:", ec.getYearWuXing(), ec.getMonthWuXing(), ec.getDayWuXing(), ec.getTimeWuXing());
try{ console.log("dayMaster:", ec.getDayGan()); }catch(e){ console.log("no dayGan"); }
