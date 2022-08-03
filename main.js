import {create_view} from "./m-sexpr-view/struct-editor.js";
import {create_pad} from "./pad-canvas.js";
import {shader} from "./shader.js";
import {modifiers} from "./modifiers.js";

const view = document.getElementById("view");
const cav = create_pad(view);
const elem_databoxes = [...document.querySelectorAll(".databox")];
for (const elem of elem_databoxes) {
    const e = create_view("", () => ({}));
    e.classList.add("databox");
    e.id = elem.id;
    elem.replaceWith(e);
}
const throttle = fn => {
    let waiting = null;
    let padding = null;
    return () => {
        if (padding === null) {
            if (waiting === null) {
                fn();
                waiting = true;
                requestAnimationFrame(() => waiting = null);
            } else {
                padding = true;
                requestAnimationFrame(() => {
                    fn();
                    padding = null;
                    waiting = true;
                    requestAnimationFrame(() => waiting = null);
                });
            }
        }
    };
};
const id = i => document.getElementById(i);
const v = n => [n, n];
const v_add = ([p1_x, p1_y], [p2_x, p2_y]) => [p1_x + p2_x, p1_y + p2_y];
const v_sub = ([p1_x, p1_y], [p2_x, p2_y]) => [p1_x - p2_x, p1_y - p2_y];
const v_mul = ([p_x, p_y], n) => [p_x * n, p_y * n];
const v_div = ([p_x, p_y], n) => [p_x / n, p_y / n];
const m_mid_move = (point_1, point_2, movement) => {
    const pm = v_div(v_add(point_1, point_2), 2);
    const dir = v_sub(point_1, point_2);
    const nor = v_div([-dir[1], dir[0]], 2);
    const mov = v_mul(nor, movement);
    const res = v_add(pm, mov);
    return res;
};
const normalize = stream => {
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
            res.push(typeof n === "object" ? normalize(n) : n);
            lf = typeof(n) === "string" ? (str_is_whitespace(n) ? 'w' : 't') : null;
        }
    }
    return res;
};
const node2data = node => {
    if (typeof node !== "object") {
        return JSON.parse(node);
    } else {
        if (node[0] === "vec") {
            const data = node.slice(1).map(node2data);
            return data;
        } else if (node[0] === "exp" || node[0] === "rexp") {
            const data = {};
            const res_data = [];
            data.type = node[1].slice(1);
            const body = node.slice(2);
            for (const n of body) {
                if (typeof n === "object") {
                    if (n[0] === "vec")
                        data[n[1]] = n.slice(1).map(node2data);
                    else
                        data[n[1]] = node2data(n[2]);
                } else {
                    res_data.push(n);
                }
            }
            if (res_data.length)
                data.data = res_data;
            return data;
        } else
            debugger;
    }
};
const data2node = data => {
    if (typeof data === "string") {
        return '"' + data.toString() + '"';
    } else if (typeof data === "number") {
        return data.toString();
    } else if (data instanceof Array) {
        return ["vec", ...data.flatMap(d => [' ' ,data2node(d)]).slice(1)];
    } else {
        const node = ["exp", '@' + data.type];
        const res_data = data.data || [];
        let has_key = false;
        for (const key in data) {
            if (key !== "type" && key !== "data") {
                has_key = true;
                const value = data[key];
                if (value instanceof Array) {
                    if (value.length > 1)
                        node.push('\n', "  ", ["vec", key, ...value.flatMap(d => ['\n', "  ", data2node(d)])]);
                    else
                        node.push('\n', "  ", ["vec", key, ...value.flatMap(d => [' ', data2node(d)])]);
                } else {
                    node.push('\n', "  ", ["exp", key, ' ', data2node(value)]);
                }
            }
        }
        if (has_key && res_data.length)
            node.push('\n', ' ');
        node.push(...res_data.flatMap(d => [' ' ,data2node(d)]));
        return node;
    }
};
const get_data = i => {
    const elem = id(i);
    const nodes = normalize(elem.get_nodes());
    const data = nodes.map(node2data);
    return data;
};
const set_data = (i, data) => {
    const elem = id(i);
    const nodes = data.flatMap(d => ['\n' ,data2node(d)]).slice(1);
    elem.set_nodes(nodes);
};

const DEFAULT_SETS = {
    "map-width": 6000,
    "map-height": 4000,
    "map-resolution": 200,
    "show-sample-points": true,
    "show-scale": true,
    "show-compass": true,
    "do-stylize": true,
    "data-sample-points": [{
        type: "point",
        data: ["p1", 2000, 2000]
    },{
        type: "point",
        data: ["p2", 3000, 1000]
    },{
        type: "point",
        data: ["p3", 4000, 2000]
    },{
        type: "point",
        data: ["p4", 3000, 3000]
    }],
    "data-sample-lines": [{
        type: "line",
        id: "l1",
        modifiers: [
            ["RMDF", 0.5, 10],
        ],
        data: ["p1", "p2", "p3", "p4", "p1"],
    }],
    "data-lands": [{
        type: "land",
        id: "ld1",
        data: ["l1"],
    }],
};

const App = canvas => {
    const context = canvas.getContext("2d");
    
    let sets = {};
    const read_sets = s => {
        sets = s;
        sync_sets();
        update_sets();
    };
    const update_sets = () => {
        const rw = 0|(sets["map-width"] * sets["map-resolution"] / 1000);
        const rh = 0|(sets["map-height"] * sets["map-resolution"] / 1000);
        canvas.set_size(rw, rh);
        draw();
    };
    const sync_sets = () => {
        id("i-map-width").value = sets["map-width"];
        id("i-map-height").value = sets["map-height"];
        id("i-map-resolution").value = sets["map-resolution"];
        id("i-show-sample-points").checked = sets["show-sample-points"];
        id("i-show-scale").checked = sets["show-scale"];
        id("i-show-compass").checked = sets["show-compass"];
        id("i-do-stylize").checked = sets["do-stylize"];
        set_data("d-sample-points", sets["data-sample-points"]);
        set_data("d-sample-lines", sets["data-sample-lines"]);
        set_data("d-lands", sets["data-lands"]);
    };

    const u_percent = point => {
        return [canvas.width * point[0], canvas.height * point[1]];
    };
    const rline_resolve = (fn, rline) => {
        const [p1, p2] = rline;
        return [p1].concat(__rline_resolve(fn, rline), [p2]);
    };
    const __rline_resolve = (fn, rline) => {
        const [p1, p2, arg, sub1, sub2] = rline;
        const pm = fn(p1, p2, arg);
        const l1 = sub1 ? __rline_resolve(fn, [p1, pm].concat(sub1)) : [];
        const l2 = sub2 ? __rline_resolve(fn, [pm, p2].concat(sub2)) : [];
        return l1.concat([pm], l2);
    };
    const rline_generate = (point_1, point_2, deepth, fn) => {
        const res = [];
        for (let i = 0; i < deepth; i++) {
            const count = 2 ** i;
            const r = new Array(count).fill(0).map(() => [fn(i)]);
            res.push(r);
        }
        return [point_1, point_2].concat(...res.reduceRight((acu, cur) => cur.map((e, i) => e.concat([acu[i * 2]], [acu[i * 2 + 1]]))));
    };

    const draw = () => {
        const rand = () => (Math.random() - 0.5) * 1;
        const rline1 = rline_generate(
            u_percent([0.1, 0.5]),
            u_percent([0.5, 0.2]),
            10,
            rand,
        );
        const rline2 = rline_generate(
            u_percent([0.5, 0.2]),
            u_percent([0.9, 0.5]),
            10,
            rand,
        );
        const rline3 = rline_generate(
            u_percent([0.9, 0.5]),
            u_percent([0.5, 0.8]),
            10,
            rand,
        );
        const rline4 = rline_generate(
            u_percent([0.5, 0.8]),
            u_percent([0.1, 0.5]),
            10,
            rand,
        );
        const area = rline_resolve(m_mid_move, rline1).concat(
            rline_resolve(m_mid_move, rline2),
            rline_resolve(m_mid_move, rline3),
            rline_resolve(m_mid_move, rline4),
        );
        shader({
            context,
            lands: [area],
        })
    };
    
    read_sets(DEFAULT_SETS);

    return {
        redraw: draw
    };
};

const app = App(cav);

// const resize = () => {
//     view.width = view.clientWidth;
//     view.height = view.clientHeight;
//     app.redraw();
// };
// window.addEventListener("resize", throttle(resize));
// resize();
