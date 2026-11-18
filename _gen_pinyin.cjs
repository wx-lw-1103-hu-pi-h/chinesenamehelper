const fs=require("fs"),path=require("path");
const BASE="site/assets";
function load(f,k){const s=fs.readFileSync(path.join(BASE,f),"utf8");return new Function("window",s+"\nreturn window."+k+";")(globalThis);}
load("data/characters.js","HANZI"); load("data/characters2.js","HANZI2");
const all=[].concat(globalThis.HANZI||[],globalThis.HANZI2||[]);
const map={};
all.forEach(c=>{ if(c&&c.c&&c.p&&!map[c.c]) map[c.c]=c.p; });
// extra common chars so the pinyin page is not useless on arbitrary text
const extra = {
"的":"de","一":"yī","是":"shì","不":"bù","了":"le","在":"zài","人":"rén","有":"yǒu","我":"wǒ","他":"tā",
"这":"zhè","个":"gè","们":"men","中":"zhōng","来":"lái","上":"shàng","大":"dà","为":"wéi","和":"hé","国":"guó",
"地":"dì","到":"dào","以":"yǐ","就":"jiù","成":"chéng","发":"fā","对":"duì","地":"de","也":"yě","子":"zǐ",
"时":"shí","道":"dào","出":"chū","要":"yào","于":"yú","下":"xià","得":"de","可":"kě","你":"nǐ","年":"nián",
"生":"shēng","自":"zì","会":"huì","那":"nà","后":"hòu","能":"néng","而":"ér","过":"guò","家":"jiā","学":"xué",
"小":"xiǎo","么":"me","心":"xīn","多":"duō","天":"tiān","而":"ér","能":"néng","好":"hǎo","都":"dōu","然":"rán",
"没":"méi","日":"rì","于":"yú","起":"qǐ","还":"hái","发":"fā","成":"chéng","事":"shì","只":"zhǐ","作":"zuò",
"当":"dāng","想":"xiǎng","看":"kàn","文":"wén","无":"wú","开":"kāi","手":"shǒu","十":"shí","用":"yòng","主":"zhǔ",
"行":"xíng","方":"fāng","又":"yòu","如":"rú","前":"qián","所":"suǒ","本":"běn","见":"jiàn","经":"jīng","头":"tóu",
"面":"miàn","公":"gōng","同":"tóng","三":"sān","已":"yǐ","老":"lǎo","从":"cóng","动":"dòng","两":"liǎng","长":"cháng",
"知":"zhī","民":"mín","样":"yàng","现":"xiàn","分":"fēn","将":"jiāng","外":"wài","但":"dàn","身":"shēn","些":"xiē",
"与":"yǔ","高":"gāo","意":"yì","进":"jìn","把":"bǎ","法":"fǎ","此":"cǐ","实":"shí","回":"huí","二":"èr",
"理":"lǐ","美":"měi","点":"diǎn","月":"yuè","明":"míng","其":"qí","种":"zhǒng","声":"shēng","全":"quán","工":"gōng",
"己":"jǐ","话":"huà","儿":"ér","者":"zhě","向":"xiàng","情":"qíng","部":"bù","正":"zhèng","名":"míng","定":"dìng",
"女":"nǚ","本":"běn","关":"guān","建":"jiàn","变":"biàn","位":"wèi","题":"tí","今":"jīn","次":"cì","车":"chē",
"重":"zhòng","便":"biàn","思":"sī","数":"shù","死":"sǐ","将":"jiāng","直":"zhí","性":"xìng","太":"tài","每":"měi",
"处":"chù","完":"wán","水":"shuǐ","风":"fēng","山":"shān","火":"huǒ","土":"tǔ","金":"jīn","木":"mù","字":"zì",
"词":"cí","语":"yǔ","读":"dú","写":"xiě","说":"shuō","听":"tīng","师":"shī","友":"yǒu","爱":"ài","喜":"xǐ",
"欢":"huān","怒":"nù","哀":"āi","乐":"lè","春":"chūn","夏":"xià","秋":"qiū","冬":"dōng","东":"dōng","南":"nán",
"西":"xī","北":"běi","左":"zuǒ","右":"yòu","上":"shàng","下":"xià","内":"nèi","间":"jiān","门":"mén","口":"kǒu"
};
Object.keys(extra).forEach(k=>{ if(!map[k]) map[k]=extra[k]; });
const keys=Object.keys(map).sort();
let out="/* Auto-generated from the character library plus a common-character table. */\nwindow.HANZI_PINYIN = {\n";
keys.forEach((k,i)=>{ out+="  "+JSON.stringify(k)+":"+JSON.stringify(map[k])+(i<keys.length-1?",":"")+"\n"; });
out+="};\n";
fs.writeFileSync(path.join(BASE,"data","pinyin-table.js"),out,"utf8");
console.log("chars:",keys.length);
