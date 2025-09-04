export function parser(rule, stream) {
    const stack = [];
    while (stream.length) {
        const res = match(rule, stream);
        if (res) {
            stack.push(...res.created);
        } else {
            throw JSON.stringify(stack); // FIXME
        }
    }
    return stack;
}

function match(rule, stream) {
    if (!stream[0]) return null;
    if (stream[0].id && stream[0].id === rule.id) {
        const elem = stream.shift();
        const res = {created: [elem], used: [elem]};
        if (rule.packer) return pack(rule, stream, res);
        return res;
    }
    if (!MATCHERS[rule.type]) return null;
    //console.log("matching:", rule.id, rule.type);
    //console.log(stream.slice(0, 3)); // TODO
    const res = MATCHERS[rule.type](rule, stream);
    //console.log("matched:", rule.id, res?.created);
    if (res && rule.packer) return pack(rule, stream, res);
    return res;
}

function pack(rule, stream, res) {
    const new_elems = rule.packer(res.created);
    if (new_elems) return {created: new_elems, used: res.used};
    stream.unshift(...used);
    return null;
}

const MATCHERS = {
    "raw_regexp": (rule, stream) => {
        if (typeof stream[0] === "string" && rule.regexp.test(stream[0])) {
            const c = stream.shift();
            return {created: [c], used: [c]};
        }
        return null
    },
    "raw_string": (rule, stream) => {
        const created = [], used = [];
        while (stream.length && used.join('').length < rule.str.length) {
            const c = stream.shift();
            created.push(c);
            used.push(c);
            if (used.join('') === rule.str) return {created, used};
        }
        stream.unshift(...used);
        return null
    },
    "set": (rule, stream) => {
        outer: for (const sub_rule of rule.rules) {
            const created = [], used = [];
            for (const elem_rule of sub_rule) {
                const res = match(elem_rule, stream);
                if (res) {
                    created.push(...res.created);
                    used.push(...res.used);
                } else {
                    stream.unshift(...used);
                    continue outer;
                }
            }
            return {created, used};
        }
        return null;
    },
    "sequence": (rule, stream) => {
        const created = [], used = [];
        let res;
        let time = 0;
        while (res = match(rule.sub, stream)) {
            time += 1;
            created.push(...res.created);
            used.push(...res.used);
            if (time >= rule.max) break;
        }
        if (time >= rule.min && time <= rule.max) {
            return {created, used};
        }
        stream.unshift(...used);
        return null;
    },
    "assertion": (rule, stream) => {
        const res = match(rule.sub, stream);
        if (res) stream.unshift(...res.used);
        if (!!res === rule.positive) {
            return {created:[], used: []};
        } else {
            return null;
        }
    }
};