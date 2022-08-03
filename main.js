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
            ["RMDF", 0.5, 8, 1],
        ],
        data: ["p1", "p2", "p3", "p4", "p1"],
    }],
    "data-lands": [{
        type: "land",
        data: ["ld1", "l1"],
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
    const km2px_unit = () => {
        const r = sets["map-resolution"] / 1000;
        return ([x, y]) => [x * r, y * r];
    };
    
    const calc_data = () => {
        const spoints = new Map();
        const slines = new Map();
        const lands = new Map();
        for (const obj of sets["data-sample-points"]) {
            spoints.set(obj.data[0], obj.data.slice(1));
        }
        for (const obj of sets["data-sample-lines"]) {
            let line = obj.data.map(pid => spoints.get(pid));
            for (const mdf of obj.modifiers) {
                line = modifiers[mdf[0]](line, ...mdf.slice(1));
            }
            slines.set(obj.id, line);
        }
        for (const obj of sets["data-lands"]) {
            const land = obj.data.slice(1).map(lid => slines.get(lid));
            lands.set(obj.data[0], land);
        }
        return {spoints, slines, lands};
    };

    const draw = () => {
        const data = calc_data();
        shader({
            context,
            lands: [...data.lands.values()],
            unit: km2px_unit(),
        })
    };
    
    read_sets(DEFAULT_SETS);

    return {
        redraw: draw
    };
};

const app = App(cav);
