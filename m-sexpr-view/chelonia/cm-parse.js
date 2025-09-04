import {init_converter, load_cmrule, load_text} from "./utils.js";
import {parser} from "./parser.js";
const __dirname = new URL('.', import.meta.url).pathname;

await init_converter();
const cmrule_path = Deno.args[0];
const source_path = Deno.args[1];
const abs_cm_path = cmrule_path.startsWith("/") ? cmrule_path : __dirname + cmrule_path;
const abs_src_path = source_path.startsWith("/") ? source_path : __dirname + source_path;
const rule = await load_cmrule(abs_cm_path);
const source = await load_text(abs_src_path);

console.time("cost");
const res = parser(rule, source.split(''));
console.timeEnd("cost");
console.log("----------------------------------------------------------------");
console.log(JSON.stringify(res, null, 2));