import {create_view} from "./m-sexpr-view/struct-editor.js";
import {create_pad} from "./pad-canvas.js";
import {shader} from "./shader.js";
import {placer, collider} from "./utils.js";
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
    "map-width": 4000,
    "map-height": 4000,
    "map-resolution": 200,
    "show-sample-points": true,
    "show-scale": true,
    "show-compass": true,
    "do-stylize": true,
    "crop-border": 20,
    "crop-spoint-space": 100,
    "crop-roughness": 0.3,
    "crop-sub-time": 6,
    "crop-seed": 0,
    "data-labels": [{
        type: "label",
        data: ["阿米西提亚王国", 2845, 1647]
    },{
        type: "label",
        data: ["伊格提希姆帝国", 1700, 1502]
    },{
        type: "label",
        data: ["路格拉斯公国", 2065, 2732]
    }],
    "data-sample-points": [{
        type: "point",
        data: ["p1", 3125, 0]
    },{
        type: "point",
        data: ["p2", 2565, 507]
    },{
        type: "point",
        data: ["p3", 1730, 757]
    },{
        type: "point",
        data: ["p4", 1065, 1717]
    },{
        type: "point",
        data: ["p5", 0, 1992]
    },{
        type: "point",
        data: ["plb", 0, 4000]
    },{
        type: "point",
        data: ["p6", 2250, 4000]
    },{
        type: "point",
        data: ["p7", 2860, 3167]
    },{
        type: "point",
        data: ["p8", 2935, 2312]
    },{
        type: "point",
        data: ["p9", 3535, 1822]
    },{
        type: "point",
        data: ["p10", 4000, 2012]
    },{
        type: "point",
        data: ["prt", 4000, 0]
    },{
        type: "point",
        data: ["mes", 1355, 1362]
    },{
        type: "point",
        data: ["me1", 1175, 2022]
    },{
        type: "point",
        data: ["me2", 1295, 2417]
    },{
        type: "point",
        data: ["me3", 1365, 2907]
    },{
        type: "point",
        data: ["me4", 1585, 3267]
    },{
        type: "point",
        data: ["me5", 2230, 3382]
    },{
        type: "point",
        data: ["me6", 2660, 2947]
    },{
        type: "point",
        data: ["me7", 2570, 1897]
    },{
        type: "point",
        data: ["mee", 3390, 2042]
    },{
        type: "point",
        data: ["mws", 825, 1547]
    },{
        type: "point",
        data: ["mw1", 880, 2162]
    },{
        type: "point",
        data: ["mw2", 1085, 2517]
    },{
        type: "point",
        data: ["mw3", 1025, 3042]
    },{
        type: "point",
        data: ["mw4", 1395, 3607]
    },{
        type: "point",
        data: ["mw5", 2230, 3832]
    },{
        type: "point",
        data: ["mw6", 3010, 3462]
    },{
        type: "point",
        data: ["mw7", 3320, 2692]
    },{
        type: "point",
        data: ["mwe", 3685, 2452]
    },{
        type: "point",
        data: ["nb1-s", 1370, 2777]
    },{
        type: "point",
        data: ["nb1-1", 1895, 1952]
    },{
        type: "point",
        data: ["nb1-e", 2575, 2247]
    },{
        type: "point",
        data: ["nb2-s", 1895, 1952]
    },{
        type: "point",
        data: ["nb2-1", 2395, 1327]
    },{
        type: "point",
        data: ["nb2-e", 2385, 647]
    },{
        type: "point",
        data: ["nb3-s", 1160, 2427]
    },{
        type: "point",
        data: ["nb3-e", 1215, 2617]
    },{
        type: "point",
        data: ["nb4-s", 2435, 942]
    },{
        type: "point",
        data: ["nb4-1", 3220, 1282]
    },{
        type: "point",
        data: ["nb4-e", 3545, 1827]
    }],
    "data-sample-lines": [{
        type: "line",
        id: "l-mainland-lt",
        modifiers: [
            ["RMDF", 0.4, 7, 1],
        ],
        data: ["p1", "p2", "p3", "p4", "p5"],
    },{
        type: "line",
        id: "l-mainland-lb",
        modifiers: [],
        data: ["p5", "plb", "p6"],
    },{
        type: "line",
        id: "l-mainland-rb",
        modifiers: [
            ["RMDF", 0.4, 7, 2],
        ],
        data: ["plb", "p6", "p7", "p8", "p9", "p10"],
    },{
        type: "line",
        id: "l-mainland-rt",
        modifiers: [],
        data: ["p10", "prt", "p1"],
    },{
        type: "line",
        id: "l-mountain-e",
        modifiers: [
            ["RMDF", 0.3, 5, 6],
        ],
        data: ["mes", "me1", "me2", "me3", "me4", "me5", "me6", "me7", "mee"],
    },{
        type: "line",
        id: "l-mountain-w",
        modifiers: [
            ["RMDF", 0.3, 5, 6],
        ],
        data: ["mwe", "mw7", "mw6", "mw5", "mw4", "mw3", "mw2", "mw1", "mws"],
    },{
        type: "line",
        id: "l-nb-1",
        modifiers: [
            ["RMDF", 0.3, 8, 19],
        ],
        data: ["nb1-s", "nb1-1", "nb1-e"],
    },{
        type: "line",
        id: "l-nb-2",
        modifiers: [
            ["RMDF", 0.3, 8, 20],
        ],
        data: ["nb2-s", "nb2-1", "nb2-e"],
    },{
        type: "line",
        id: "l-nb-3",
        modifiers: [
            ["RMDF", 0.3, 3, 5],
        ],
        data: ["nb3-s", "nb3-e"],
    },{
        type: "line",
        id: "l-nb-4",
        modifiers: [
            ["RMDF", 0.3, 8, 11],
        ],
        data: ["nb4-s", "nb4-1", "nb4-e"],
    }],
    "data-lands": [{
        type: "land",
        data: ["a-mainland", "l-mainland-lt", "l-mainland-lb", "l-mainland-rb", "l-mainland-rt"],
    }],
    "data-lines": [{
        type: "line",
        data: ["l-nb-1", "national-border", "l-nb-1"],
    },{
        type: "line",
        data: ["l-nb-2", "national-border", "l-nb-2"],
    },{
        type: "line",
        data: ["l-nb-3", "national-border", "l-nb-3"],
    },{
        type: "line",
        data: ["l-nb-4", "national-border", "l-nb-4"],
    }],
    "data-fields": [{
        type: "field",
        data: ["f-mountain", "mountain", "l-mountain-e", "l-mountain-w"],
    }],
};

const App = canvas => {
    canvas.addEventListener("click", (e) => {
        const rsl = sets["map-resolution"] / 1000;
        const rect = canvas.getClientRects()[0];
        const rx = e.clientX - rect.left;
        const ry = e.clientY - rect.top;
        console.log(`${rx / rsl}, ${ry / rsl}`);
    });
    const context = canvas.getContext("2d");
    
    let sets = {};
    const km2px_unit = () => {
        const r = sets["map-resolution"] / 1000;
        return ([x, y]) => [x * r, y * r];
    };
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
        id("i-crop-border").value = sets["crop-border"];
        id("i-crop-spoint-space").value = sets["crop-spoint-space"];
        id("i-crop-roughness").value = sets["crop-roughness"];
        id("i-crop-sub-time").value = sets["crop-sub-time"];
        id("i-crop-seed").value = sets["crop-seed"];
        set_data("d-labels", sets["data-labels"]);
        set_data("d-sample-points", sets["data-sample-points"]);
        set_data("d-sample-lines", sets["data-sample-lines"]);
        set_data("d-lands", sets["data-lands"]);
        set_data("d-lines", sets["data-lines"]);
        set_data("d-fields", sets["data-fields"]);
    };
    const triggers = {
        "apply_global_sets": () => {
            try {
                sets["map-width"] = parseFloat(id("i-map-width").value ?? DEFAULT_SETS["map-width"]);
                sets["map-height"] = parseFloat(id("i-map-height").value ?? DEFAULT_SETS["map-height"]);
                sets["map-resolution"] = parseFloat(id("i-map-resolution").value ?? DEFAULT_SETS["map-resolution"]);
                update_sets();
            } catch(e) {
                alert(`[CRITICAL] error: ${e.toString()}`);
            }
        },
        "apply_render_sets": () => {
            try {
                sets["show-sample-points"] = id("i-show-sample-points").checked;
                sets["show-scale"] = id("i-show-scale").checked;
                sets["show-compass"] = id("i-show-compass").checked;
                sets["do-stylize"] = id("i-do-stylize").checked;
                sets["crop-border"] = parseInt(id("i-crop-border").value ?? DEFAULT_SETS["crop-border"]);
                sets["crop-spoint-space"] = parseInt(id("i-crop-spoint-space").value ?? DEFAULT_SETS["crop-spoint-space"]);
                sets["crop-roughness"] = parseFloat(id("i-crop-roughness").value ?? DEFAULT_SETS["crop-roughness"]);
                sets["crop-sub-time"] = parseInt(id("i-crop-sub-time").value ?? DEFAULT_SETS["crop-sub-time"]);
                sets["crop-seed"] = parseInt(id("i-crop-seed").value ?? DEFAULT_SETS["crop-seed"]);
                update_sets();
            } catch(e) {
                alert(`[CRITICAL] error: ${e.toString()}`);
            }
        },
        "do_export": () => {
            try {
                const source = JSON.stringify(sets);
                id("t-export").textContent = source;
            } catch(e) {
                alert(`[CRITICAL] error: ${e.toString()}`);
            }
        },
    };
    
    const gen_crop = () => {
        const b = sets["crop-border"];
        const roughness = sets["crop-roughness"];
        const sub_time = sets["crop-sub-time"];
        const seed = sets["crop-seed"];
        const rw = 0|(sets["map-width"] * sets["map-resolution"] / 1000);
        const rh = 0|(sets["map-height"] * sets["map-resolution"] / 1000);
        const x_count = 0|((rw - b * 2) / sets["crop-spoint-space"]);
        const y_count = 0|((rh - b * 2) / sets["crop-spoint-space"]);
        const x_space = (rw - b * 2) / x_count;
        const y_space = (rh - b * 2) / y_count;
        const line = [];
        for (let i = 0; i < x_count; i++)
            line.push([i * x_space + b, b]);
        for (let i = 0; i < y_count; i++)
            line.push([x_count * x_space + b, i * y_space + b]);
        for (let i = x_count; i > 0; i--)
            line.push([i * x_space + b, y_count * y_space + b]);
        for (let i = y_count; i > 0; i--)
            line.push([b, i * y_space + b]);
        line.push([b, b]);
        const res = modifiers["RMDF"](line, roughness, sub_time, seed);
        return res;
    };
    const calc_data = async () => {
        const rw = 0|(sets["map-width"] * sets["map-resolution"] / 1000);
        const rh = 0|(sets["map-height"] * sets["map-resolution"] / 1000);
        const mw = sets["map-width"];
        const mh = sets["map-height"];
        const rsl = sets["map-resolution"] / 1000;
        const labels = [];
        const spoints = new Map();
        const slines = new Map();
        const lands = new Map();
        const lines = new Map();
        const fields = new Map();
        const unit = km2px_unit();
        for (const obj of sets["data-labels"]) {
            labels.push({label: obj.data[0], pos: obj.data.slice(1)});
        }
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
        for (const obj of sets["data-lines"]) {
            const line = obj.data.slice(2).map(lid => slines.get(lid));
            lines.set(obj.data[0], {type: obj.data[1], data: line});
        }
        for (const obj of sets["data-fields"]) {
            const field = obj.data.slice(2).map(lid => slines.get(lid));
            fields.set(obj.data[0], {type: obj.data[1], data: field});
        }
        const crop = gen_crop();
        const col_land = await collider({
            width: rw,
            height: rh,
            shapes: [...lands.values()].map(l => l.flatMap(e => e)),
            unit,
        });
        const col_field = await collider({
            width: rw,
            height: rh,
            shapes: [...fields.values()].map(l => l.data.flatMap(e => e)),
            unit,
        });
        const waves = placer({
            x_step: 80 / rsl,
            y_step: 40 / rsl,
            start_x: 80 / rsl,
            start_y: 80 / rsl,
            end_x: mw - 80 / rsl,
            end_y: mh - 80 / rsl,
            x_offset: 0.2,
            y_offset: 0.2,
            seed: 1,
            filter: p => col_land.collide(...p, 30, 30) < 0.01 ? p : null,
        });
        const grass = placer({
            x_step: 36 / rsl,
            y_step: 30 / rsl,
            start_x: 0,
            start_y: 0,
            end_x: mw,
            end_y: mh,
            x_offset: 0.3,
            y_offset: 0.4,
            seed: 1,
            filter: p => col_land.collide(...p, 4, 4) > 0.99 ? p : null,
        });
        const mountains = placer({
            x_step: 20 / rsl,
            y_step: 16 / rsl,
            start_x: 80 / rsl,
            start_y: 80 / rsl,
            end_x: mw - 80 / rsl,
            end_y: mh - 80 / rsl,
            x_offset: 0.2,
            y_offset: 0.4,
            seed: 1,
            filter: p => {
                const th = 0.7;
                const c_land = col_land.collide(...p, 32, 12);
                if (c_land < th) return null;
                const c_field = col_field.collide(...p, 32, 12);
                if (c_field < th) return null;
                const c = Math.min(c_land, c_field);
                return [...p, c];
            },
        }).sort((a, b) => a[1] - b[1]);
        col_land.destroy();
        col_field.destroy();
        return {crop, waves, grass, labels, spoints, slines, lands, lines, mountains};
    };

    const draw = async () => {
        const data = await calc_data();
        shader({
            context,
            crop: data.crop,
            waves: data.waves,
            grass: data.grass,
            labels: data.labels,
            lands: [...data.lands.values()],
            lines: [...data.lines.values()],
            mountains: data.mountains,
            unit: km2px_unit(),
        })
    };
    
    read_sets(DEFAULT_SETS);
    
    const elem_triggers = [...document.querySelectorAll(".trigger")];
    for (const elem of elem_triggers) {
        const trigger = triggers[elem.getAttribute("trigger")];
        if (trigger)
            elem.addEventListener("click", trigger);
    }

    return {
        redraw: draw
    };
};

const app = App(cav);
