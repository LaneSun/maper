import {init_converter, cmrule2obj} from "./utils.js";
const __dirname = new URL('.', import.meta.url).pathname;

await init_converter();
for (const cmrule_path of Deno.args) {
    console.time(cmrule_path);
    const abs_path = cmrule_path.startsWith("/") ? cmrule_path : __dirname + cmrule_path;
    //console.log("[Compiling]", cmrule_path);
    
    const cmrule = await Deno.readTextFile(abs_path);
    const res = "export const data = " + JSON.stringify(cmrule2obj(cmrule));
    await Deno.writeTextFile(abs_path + ".js", res);
    
    //console.log("[Compiled] ", cmrule_path);
    console.timeEnd(cmrule_path);
}