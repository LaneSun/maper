import {init_converter, load_cmrule} from "./chelonia/utils.js";
import {parser} from "./chelonia/parser.js";
const __dirname = new URL('.', import.meta.url).pathname;
await init_converter();
const rule_source = await load_cmrule((__dirname === '/' ? '' : __dirname) + "/rules/source");

const data_is_str = d => {
    return typeof d === "string";
};

const str_is_token = s => {
    return !str_is_whitespace(s);
};

const str_is_whitespace = s => {
    return /[\u0009\u000B\u000C\u0020\u00A0\u000A\u000D\u2028\u2029]+/.test(s);
};

export const atomify_data = data =>
    data.flatMap(n => typeof n === "string" && !n.startsWith('"') ? n.split('') : [n]);
export const normalize = stream => {
    const res = [];
    let lf = null;
    for (const n of stream) {
        if (lf === 't') {
            if (typeof(n) === "string") {
                if (str_is_token(n))
                    res[res.length - 1] += n;
                else {
                    res.push(n);
                    lf = 'w';
                }
            } else {
                res.push(n);
                lf = null;
            }
        } else if (lf === 'w') {
            if (typeof(n) === "string") {
                if (str_is_whitespace(n))
                    res[res.length - 1] += n;
                else {
                    res.push(n);
                    lf = 't';
                }
            } else {
                res.push(n);
                lf = null;
            }
        } else {
            res.push(n);
            lf = typeof(n) === "string" ? (str_is_whitespace(n) ? 'w' : 't') : null;
        }
    }
    return res;
};
export const sub_lead_whitespace = stream => {
    if (stream[0] && str_is_whitespace(stream[0])) stream[0] = stream[0].slice(1);
    if (stream[0] === '') stream.shift();
    return stream;
};
export const cut_down = node => {
    const data = atomify_data(node.slice(1));
    const head_ary = [];
    while (data.length) {
        if (data_is_str(data[0]))
            if (str_is_token(data[0]))
                head_ary.push(data.shift());
            else if (str_is_whitespace(data[0])) {
                data[0] = data[0].slice(1);
                if (data[0] === '') data.shift();
                break;
            } else debugger;
        else
            break;
    }
    const head = head_ary.join('');
    return [head, data];
};
export const pick_head = node => cut_down(node)[0];
export const pick_body = node => cut_down(node)[1];
export const format_source = data => {
    return data.map(e => {
        if (typeof e === "string")
            return e;
        if (typeof e === "object" && e.length)
            if (e[0] === "exp" || e[0] === "rexp")
                return '(' + format_source(e.slice(1)) + ')';
            else if (e[0] === "vec")
                return '[' + format_source(e.slice(1)) + ']';
            else debugger;
    }).join('');
};
export const parse_source = (source) => {
    return parser(rule_source, source.split(''));
};
