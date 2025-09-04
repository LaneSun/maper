import {parser} from "./parser.js";
const __dirname = new URL('.', import.meta.url).pathname;

export function cmrule2rule(src, opts) {
    return obj2rule(cmrule2obj(src), opts);
}

export function obj2rule(obj, opts = {}) {
    const rule_map = new Map();
    const gen_rules = [];
    for (const block of obj) {
        rule_map.set(block.id, {});
        gen_rules.push([{
            type: "token",
            id: block.id
        }]);
    }
    for (const block of obj) convert_block(rule_map, block, opts);
    return ELEM_CONVERTERS.set(rule_map, opts, {rules: gen_rules}, {});
}

function convert_block(par_rule_map, block, opts) {
    const self = par_rule_map.get(block.id);
    const rule_map = new Map();
    rule_map.parent = par_rule_map;
    if (block.scope) {
        for (const b of block.scope) rule_map.set(b.id, {});
        for (const b of block.scope) convert_block(rule_map, b, opts);
    }
    self.id = block.id;
    ELEM_CONVERTERS.set(rule_map, opts, block, self);
    bind_hook(opts, self);
    return self;
}

function convert_elem(rule_map, opts, elem, self = {}) {
    return ELEM_CONVERTERS[elem.type](rule_map, opts, elem, self);
}

const ELEM_CONVERTERS = {
    "token": (...args) => find_rule(...args),
    "assertion": (rule_map, opts, elem, self) => {
        self.type = "assertion";
        self.sub = convert_elem(rule_map, opts, elem.sub);
        self.positive = elem.positive;
        return self;
    },
    "sequence": (rule_map, opts, elem, self) => {
        self.type = "sequence";
        self.sub = convert_elem(rule_map, opts, elem.sub);
        self.min = elem.min === "inf" ? Infinity : elem.min;
        self.max = elem.max === "inf" ? Infinity : elem.max;
        return self;
    },
    "set": (rule_map, opts, elem, self) => {
        self.type = "set";
        self.rules = [];
        for (const rule of elem.rules) {
            const combine = [];
            for (const e of rule) combine.push(convert_elem(rule_map, opts, e));
            self.rules.push(combine);
        }
        return self;
    },
    "regexp": (rule_map, opts, elem, self) => {
        self.type = "raw_regexp";
        self.regexp = new RegExp(elem.regexp);
        return self;
    },
    "string": (rule_map, opts, elem, self) => {
        self.type = "raw_string";
        self.str = elem.str;
        return self;
    },
}

function find_rule(rule_map, opts, elem) {
    const {id} = elem;
    if (rule_map.has(id)) return rule_map.get(id);
    else if (rule_map.parent) return find_rule(rule_map.parent, opts, elem);
    else {
        const self = {type: "token", id};
        bind_hook(opts, self);
        return self;
    }
}

function bind_hook(opts, self) {
    if (opts.packer && opts.packer[self.id]) self.packer = opts.packer[self.id];
    if (opts.pattern_packer) {
        for (const [pattern, packer] of opts.pattern_packer) {
            if (pattern.test(self.id)) self.packer = packer;
        }
    }
}

let chelonia_rule1, chelonia_rule2;
export async function init_converter() {
    [chelonia_rule1, chelonia_rule2] = await Promise.all([
        load_compiled_cmrule(__dirname + "rules/chelonia-rule-1"),
        load_compiled_cmrule(__dirname + "rules/chelonia-rule-2")
    ]);
}

export function cmrule2obj(src) {
    if (chelonia_rule1 && chelonia_rule2) {
        const tmp = parser(chelonia_rule1, src.split(''));
        return parser(chelonia_rule2, tmp);
    } else throw new Error("not inited"); // TODO
}

export async function load_compiled_cmrule(src, opts = true) {
    if (typeof Deno !== "undefined" && !(src.startsWith("./") || src.startsWith("/"))) src = "./" + src;
    if (opts === true) {
        const [{data}, opts] = await Promise.all([
            import(src + ".cmrule.js"),
            import(src + ".packer.js")
        ]);
        return obj2rule(data, opts);
    } else if (typeof opts === "object") {
        const {data} = await import(src + ".cmrule.js");
        return obj2rule(data, opts);
    } else {
        const {data} = await import(src + ".cmrule.js");
        return obj2rule(data);
    }
}

export async function load_cmrule(src, opts = true) {
    if (typeof Deno !== "undefined" && !(src.startsWith("./") || src.startsWith("/"))) src = "./" + src;
    if (opts === true) {
        const [raw, opts] = await Promise.all([
            load_text(src + ".cmrule"),
            import(src + ".packer.js")
        ]);
        return cmrule2rule(raw, opts);
    } else if (typeof opts === "object") {
        const raw = await load_text(src + ".cmrule");
        return cmrule2rule(raw, opts);
    } else {
        const raw = await load_text(src + ".cmrule");
        return cmrule2rule(raw);
    }
}

export async function load_text(src) {
    if (typeof Deno !== "undefined") return await Deno.readTextFile(src);
    return await (await fetch(src)).text();
}