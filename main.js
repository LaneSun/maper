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
    "data-sample-points": [{
        type: "point",
        data: ["p1", 1000, 2000]
    },{
        type: "point",
        data: ["p2", 2000, 1000]
    },{
        type: "point",
        data: ["p3", 3000, 2000]
    },{
        type: "point",
        data: ["p4", 2000, 3000]
    },{
        type: "point",
        data: ["p5", 1500, 1500]
    },{
        type: "point",
        data: ["p6", 2000, 2000]
    },{
        type: "point",
        data: ["p7", 1000, 3000]
    }],
    "data-sample-lines": [{
        type: "line",
        id: "l1",
        modifiers: [
            ["RMDF", 0.5, 8, 1],
        ],
        data: ["p1", "p2", "p3", "p4", "p1"],
    },{
        type: "line",
        id: "l2",
        modifiers: [
            ["RMDF", 0.3, 6, 2],
        ],
        data: ["p1", "p5", "p6", "p7", "p1"],
    }],
    "data-lands": [{
        type: "land",
        data: ["ld1", "l1"],
    }],
    "data-fields": [{
        type: "field",
        data: ["f-m1", "mountain", "l2"],
    }],
};

const App = canvas => {
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
        set_data("d-sample-points", sets["data-sample-points"]);
        set_data("d-sample-lines", sets["data-sample-lines"]);
        set_data("d-lands", sets["data-lands"]);
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
        const spoints = new Map();
        const slines = new Map();
        const lands = new Map();
        const fields = new Map();
        const unit = km2px_unit();
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
            x_step: 12 / rsl,
            y_step: 10 / rsl,
            start_x: 80 / rsl,
            start_y: 80 / rsl,
            end_x: mw - 80 / rsl,
            end_y: mh - 80 / rsl,
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
            y_offset: 0.3,
            seed: 1,
            filter: p => {
                const th = 0.5;
                const c_land = col_land.collide(...p, 32, 24);
                if (c_land < th) return null;
                const c_field = col_field.collide(...p, 32, 24);
                if (c_field < th) return null;
                const c = Math.min(c_land, c_field);
                return [...p, c];
            },
        });
        col_land.destroy();
        col_field.destroy();
        return {spoints, slines, lands, crop, waves, grass, mountains};
    };

    const draw = async () => {
        const data = await calc_data();
        shader({
            context,
            crop: data.crop,
            lands: [...data.lands.values()],
            waves: data.waves,
            grass: data.grass,
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
