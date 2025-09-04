import {init_converter, load_cmrule, load_text} from "./utils.js";
import {parser} from "./parser.js";

await init_converter();
console.time();
const rule = await load_cmrule("./rules/chelonia-rule-1");
const source = await load_text("./rules/chelonia-rule-2.cmrule");
const res = parser(rule, source.split(''));
console.log(res);
console.timeEnd();