/*
 * Module: struct-editor
 * Gen 0.2
 */

import * as utils from "./node-utils.js";
import * as Pos from "./pos-utils.js";
import {KeyListener} from "./key-listener.js";
import {actions as NORMAL_ACTIONS} from "./normal-actions.js";
import {
    enew,
    eis,
    eis_nelem,
    eis_root,
    eis_token,
    eis_newline,
    eis_struct,
    eis_stream,
    eis_cont,
    eis_nroot,
    eis_extern,
    eis_elem,
    eget,
    eget_node,
    eget_last,
    eget_first,
    egets,
    epar,
    enelem2elem,
    eitems,
    eindex,
    esize,
    ehas,
    econtains,
    etype_set,
    etype_unset,
    edata_set,
    edata_unset,
    edata_init,
    edata_get,
    epar_cont,
    epos,
    eroot,
    emroot,
    pos_get,
    pos_get_node,
    pos_get_par,
    range_get,
    pos_pre_inline,
    pos_next_inline,
    calc_pre_newline,
    calc_next_newline,
    get_elem_rect,
    get_elem_rects,
    get_anchor_gap,
} from "./elem-utils.js";

/*
 * Element Types
 *
 * root: root element, position calculation should not go above it
 *   "rt"   root
 *   +"mrt" editor root                 (pre-defined type)
 * hide: invisible element
 *   "h"    hide
 * token: text element, contains a char
 *   "t"    token
 *   "w"    whitespace
 * newline: blank element, indicate a line break
 *   "l"    new line
 * struct: inline-box container element
 *   "b"    box container
 *   +"exp" expression box container    (pre-defined type)
 *   +"vec" vector box container        (pre-defined type)
 * stream: inline container element
 *   "s"    inline container
 *   +"qt"  quote inline container      (pre-defined type)
 * cont: container element
 *   <struct>
 *   <stream>
 * nroot: not a root, position should not be calculated inside it
 *   "nrt"  not a root
 * extern: extern element
 *   "ext"  extern element
 *   +<struct>
 *   +<stream>
 *   +<root>
 *   +<nroot>
 * elem: all st element
 *   "e"    st element
 *   +<root>
 *   +<token>
 *   +<newline>
 *   +<struct>
 *   +<stream>
 *   +<nroot>
 *   +<extern>
 */

const h_hide_elem_node = elem => edata_get(elem, "inner");
const enew_hide = inner => enew({
    inner: '',
    types: "h",
    data: {
        inner,
        node: h_hide_elem_node,
    },
});
const enew_token = (str, ...types) => enew({
    inner: str,
    types: [str === ' ' ? "w" : "t", ...types],
});
const enew_newline = () => enew({
    inner: "\n\u{200B}",
    types: "l",
});
const enew_cont = (data, ...types) => enew({
    types,
    data,
});
const enew_struct = (data, start_col, end_col, node, ...types) => enew_cont({
    ...data,
    start_col,
    end_col,
    node,
}, "b", ...types);
const enew_stream = (data, start_col, end_col, node, ...types) => enew_cont({
    ...data,
    start_col,
    end_col,
    node,
}, "s", ...types);
const h_exp_node = elem => {
    return ["rexp", ...elems2node(eitems(elem))];
};
const enew_exp = items => {
    const elem = enew_struct({}, 4, 4, h_exp_node, "exp");
    elem.append(...items);
    return elem;
};
const h_vec_node = elem => {
    return ["vec", ...elems2node(eitems(elem))];
};
const enew_vec = items => {
    const elem = enew_struct({}, 4, 4, h_vec_node, "vec");
    elem.append(...items);
    return elem;
};
const enew_qt = items => {
    const elem = enew_stream({}, 4, 4, null, "qt");
    elem.append(...items);
    return elem;
};
const enew_root = () => enew({
    types: ["rt"],
});
const enew_struct_extern = (data, start_col, end_col, node, ...types) => enew_struct(
    data, start_col, end_col, node, "ext", ...types
);
const enew_stream_extern = (data, start_col, end_col, node, ...types) => enew_stream(
    data, start_col, end_col, node, "ext", ...types
);

const rect_in = (rect, x, y) =>
    rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;

const get_pos_anchor = (root, pos) => {
    console.assert(pos.length); // TRAP
    const end = Pos.end(pos);
    const par = pos_get_par(pos);
    if (end < esize(par))
        return [eget(par, end), 0];
    else if (esize(par))
        return [eget_last(par), 1];
    else
        return [par, 0]; // BUGGY
};

const __all_stream = (cont, elem) => {
    if (cont === elem) return true;
    const par = epar(elem);
    if (par === cont) return true;
    if (eis_stream(par)) return __all_stream(cont, par);
    if (eis_struct(par)) return false;
    debugger;
};

const reduce_to_cont = (elem, cont) => {
    console.assert(eis_elem(elem)); // TRAP
    console.assert(eis_cont(cont)); // TRAP
    if (__all_stream(cont, elem))
        return elem;
    else
        return reduce_to_cont(epar(elem), cont);
};

const modify_pointer = (elem, x, y) => { // BUGGY
    if (!elem) return null;
    const sc = edata_get(elem, "start_col");
    const ec = edata_get(elem, "end_col");
    if (eis_struct(elem)) {
        const rect = get_elem_rect(elem);
        if (rect_in(rect, x, y))
            if (x <= rect.left + sc)
                return 0;
            else if (rect.right - ec <= x)
                return 1;
            else
                return null;
        else
            return null;
    } else if (eis_stream(elem)) {
        const rects = get_elem_rects(elem);
        const srect = rects[0];
        const erect = Pos.end(rects);
        if (rect_in(srect, x, y) && x <= srect.left + sc)
            return 0;
        else if (rect_in(erect, x, y) && erect.right - ec <= x)
            return 1;
        else
            return null;
    }
    debugger;
    return null;
};

const calc_anchor = (cont, nelem, offset, x) => { // BUGGY TODO econtains(root, nelem) === true
    if (!nelem) return null;
    const elem = eis_nelem(nelem) ?
                    enelem2elem(nelem) :
                    eget_node(nelem, offset) ?
                        (eis_nelem(eget_node(nelem, offset)) ?
                            nelem : eget_node(nelem, offset)) :
                        enelem2elem(nelem);
    if (eis_root(elem) && offset === 0) return [0];
    if (ehas(cont, elem)) {
        const pos = epos(elem);
        console.assert(pos !== null); // TRAP
        if (eis_cont(elem))
            return Pos.append(pos, offset);
        else if (eis_newline(elem))
            if (offset > 0)
                return Pos.with_end_add(pos, 1);
            else
                return pos;
        else if (eis_token(elem))
            return Pos.with_end_add(pos, offset);
        else
            debugger;
    } else if (econtains(cont, elem)) {
        const e = reduce_to_cont(elem, cont);
        const pos = epos(e);
        const rect = get_elem_rect(e);
        if (rect.left < x)
            return Pos.with_end_add(pos, 1);
        else
            return pos;
    } else {
        const pos = epos(cont);
        console.assert(pos !== null); // TRAP
        let par = epar(cont);
        while (eis_elem(par)) {
            if (econtains(par, elem)) {
                if (cont === elem)
                    if (offset > 0)
                        return Pos.append(pos, esize(cont));
                    else
                        return Pos.append(pos, 0);
                else {
                    const p = epos(elem);
                    console.assert(p !== null); // TRAP
                    if (Pos.lt(p, pos))
                        return Pos.append(pos, 0);
                    else
                        return Pos.append(pos, esize(cont));
                }
            }
            par = epar(par);
        }
        return null;
    }
};

const elem2node = elem => {
    if (eis_newline(elem))
        return '\n';
    else if (eis_token(elem))
        return elem.textContent;
    else if (eis(elem, "qt"))
        return '"' + elems2node(eitems(elem)).join('') + '"';
    else {
        console.assert(eis_elem(elem)); // TRAP
        if (edata_get(elem, "node"))
            return edata_get(elem, "node")(elem); // TODO
        else
            return null; // BUGGY
    }
};

const elems2node = elems => {
    return elems.map(elem2node).filter(n => n !== null);
};

export const create_view = (source, cons) => {
    const root = enew_root();
    const data = utils.parse_source(source);

    let cur_cont = null;
    const cur_cont_clean = () => {
        if (cur_cont) {
            etype_unset(cur_cont, "hover");
            cur_cont = null;
        }
    };
    const cur_cont_set = elem => {
        if (cur_cont !== elem) {
            cur_cont_clean();
            cur_cont = elem;
            etype_set(cur_cont, "hover");
        }
    };
    const handle_enter = event => cur_cont_set(event.target);
    const handle_leave = event => {
        const par = event.target.parentElement;
        cur_cont_clean();
        if (eis_stream(par) || eis_struct(par)) cur_cont_set(par);
    };
    let last_anchor = [0];
    let last_focus = [0];
    const calc_selection = (x, y) => {
        const mod_pos = modify_pointer(cur_cont, x, y);
        const sel = document.getSelection();
        const anchor =  anchor_ori ||
                        (sel.anchorNode &&
                            (econtains(root, sel.anchorNode) || root === sel.anchorNode) &&
                            calc_anchor(struct_ori ?? root,
                                        sel.anchorNode,
                                        sel.anchorOffset,
                                        x_ori)
                        ) ||
                        last_anchor;
        last_anchor = anchor;
        const focus =   mod_pos !== null ? Pos.with_end_add(epos(cur_cont), mod_pos) : (
                        ((econtains(root, sel.focusNode) || root === sel.focusNode) &&
                            calc_anchor(cur_cont ?? root,
                                        sel.focusNode,
                                        sel.focusOffset,
                                        x)
                        ) ||
                        last_focus);
        last_focus = focus;
        if (!focus.length) debugger; // TRAP
        return [anchor, focus];
    };
    let is_dragging = false;
    let x_ori = 0, y_ori = 0;
    let struct_ori = null;
    let anchor_ori = null;
    let cursor_pos = [0];
    let selection = null;
    let sel_cursor = 0;
    let pre_elems = [];
    let kselect_anchor = null;
    let cursor_anchor = {x: 0, y: 0};
    const update_caret = cursor => {
        const [cx, cy, ch] = get_anchor_gap(root, cursor);
        root.style.setProperty("--cursor-x", cx + "px");
        root.style.setProperty("--cursor-y", cy + "px");
        root.style.setProperty("--cursor-h", ch + "px");
        reset_anim();
    };
    const update_cursor_anchor = () => {
        const [cx, cy, ch] = get_anchor_gap(root, cursor_pos);
        cursor_anchor.x = cx;
        cursor_anchor.y = cy + ch / 2;
    };
    const clear_range_mark = () => {
        pre_elems.forEach(e => etype_unset(e, "select"));
        pre_elems = [];
    };
    const update_range_mark = (start, end) => {
        const elems = range_get(root, start, end);
        clear_range_mark();
        elems.forEach(e => etype_set(e, "select"));
        pre_elems = elems;
    };
    let focus_elem = null;
    const clear_focus_mark = () => {
        if (focus_elem) {
            etype_unset(focus_elem, "focus");
            focus_elem = null;
        }
    };
    const update_focus_mark = pos => {
        const elem = pos_get(root, pos);
        if (focus_elem !== elem) clear_focus_mark();
        if (eis_cont(elem)) {
            etype_set(elem, "focus");
            focus_elem = elem;
        }
    };
    const clear_selection = () => {
        selection = null;
        clear_range_mark();
    };
    const update_selection = (x, y) => {
        const sel = calc_selection(x, y);
        const [start, end, cursor] = Pos.calc_range(...sel);
        update_caret(cursor);
        cursor_pos = cursor;
        set_selection(start, end);
    };
    const set_selection = (start, end) => {
        if (!Pos.same(start, end)) {
            selection = [start, end];
            sel_cursor = Pos.same(start, cursor_pos) ? 0 : 1;
            update_range_mark(start, end);
        } else
            clear_selection();
    };
    const update_kselect = () => {
        const [start, end, cursor] = Pos.calc_range(kselect_anchor, cursor_pos);
        if (!Pos.same(start, end)) {
            selection = [start, end];
            sel_cursor = Pos.same(start, cursor) ? 0 : 1;
            update_range_mark(start, end);
        } else
            clear_selection();
//         cursor_pos = cursor;
    };
    const update_cursor = () => {
        update_focus_mark(Pos.pop(cursor_pos));
        const sel = document.getSelection();
        sel.removeAllRanges();
        update_caret(cursor_pos);
        if (selection) {
            const s_par = pos_get(root, Pos.pop(selection[0]));
            const s_offset = Pos.end(selection[0]);
            const e_par = pos_get(root, Pos.pop(selection[1]));
            const e_offset = Pos.end(selection[1]);
            sel.setBaseAndExtent(s_par, s_offset, e_par, e_offset);
        } else {
            const par = pos_get(root, Pos.pop(cursor_pos));
            const offset = Pos.end(cursor_pos);
            sel.setBaseAndExtent(par, offset, par, offset);
        }
    };
    const delete_selection = () => {
        if (selection) {
            const elems = range_get(root, ...selection);
            const pos = cmd_do(['d', selection[0], elems.length]);
            clear_selection();
            return pos;
        }
        return cursor_pos;
    };
    const reset_anim = () => {
        etype_set(root, "anim-clear");
        setTimeout(() => etype_unset(root, "anim-clear"), 100);
    };
    const handle_unfocus = event => {
        clear_selection();
        clear_focus_mark();
        cur_cont_clean();
    };
    const handle_copy = event => {
        if (selection) {
            const elems = range_get(root, ...selection);
            const nodes = elems2node(elems);
            const source = utils.format_source(nodes);
            event.clipboardData.setData("text/plain", source);
        } else
            event.clipboardData.setData("text/plain", "");
        event.preventDefault();
    };
    const handle_cut = event => {
        if (selection) {
            const elems = range_get(root, ...selection);
            const nodes = elems2node(elems);
            const source = utils.format_source(nodes);
            event.clipboardData.setData("text/plain", source);
            cursor_pos = delete_selection();
            update_cursor_anchor();
        } else
            event.clipboardData.setData("text/plain", "");
        event.preventDefault();
    };
    const handle_down = event => {
        if (event.button !== 0) return;
        is_dragging = true;
        const sel = document.getSelection();
        sel.removeAllRanges();
        const mod_pos = modify_pointer(cur_cont, event.clientX, event.clientY);
        x_ori = event.clientX;
        y_ori = event.clientY;
        struct_ori = cur_cont;
        if (mod_pos !== null) anchor_ori = Pos.with_end_add(epos(cur_cont), mod_pos);
        else anchor_ori = null;
    };
    const handle_move = event => {
        if (!is_dragging) return;
        update_selection(event.clientX, event.clientY);
    };
    const handle_up = event => {
        if (event.button !== 0 || !is_dragging) return;
        is_dragging = false;
        update_selection(event.clientX, event.clientY);
        update_cursor();
        update_cursor_anchor();
    };
    const handle_input = event => {
        if (!event.isComposing) {
            const str = event.data ?? event.dataTransfer.getData("text/plain");
            const nodes = utils.parse_source(str);
            cursor_pos = delete_selection();
            cursor_pos = action_insert(cursor_pos, ...nodes);
            update_cursor();
            update_cursor_anchor();
            event.preventDefault();
        }
    };
    const handle_composition = event => {
        const str = event.data;
        if (!str) return;
        const node = pos_get_node(root, cursor_pos);
        if (node && eis_nelem(node))
            node.remove();
        else {
            const elem = pos_get_node(root, Pos.with_end_add(cursor_pos, -1));
            if (elem) {
                const n = Pos.end(elem.childNodes);
                n.data = n.data.slice(0, n.data.length - str.length);
                if (!n.data.length) n.remove();
            } else {
                const n = node.childNodes[0];
                n.data = n.data.slice(str.length);
                if (!n.data.length) n.remove();
            }
        }
        cursor_pos = delete_selection();
        cursor_pos = action_insert(cursor_pos, str);
        update_cursor();
    };
    const handle_kselectstart = event => {
        if (event.key === "Shift")
            if (selection)
                kselect_anchor = selection[1 - sel_cursor];
            else
                kselect_anchor = cursor_pos;
    };
    const handle_modify = () => {
        root.dispatchEvent(new Event("st-modify"));
    };
    const action_insert = (pos, ...nodes) => {
        return cmd_do(['i', pos, ...nodes]);
    };
    let preload_tmark = null;
    let stack_undo = [];
    let stack_redo = [];
    let time_pre_do = 0;
    const need_new_stack = () => {
        return Date.now() - time_pre_do > 1000;
    };
    const is_stack_full = () => {
        return stack_undo.length >= 100;
    };
    const cmd_do = cmd => {
        if (is_stack_full()) stack_undo.shift();
        const [pos, rev_cmd] = exec_cmd(root, cmd);
        if (rev_cmd)
            if (need_new_stack()) {
                const ns = [rev_cmd];
                ns.tmark = {};
                stack_undo.push(ns);
            } else
                stack_undo[stack_undo.length - 1].push(rev_cmd);
        stack_redo = [];
        time_pre_do = Date.now();
        handle_modify();
        return pos;
    };
    const cmd_undo = () => {
        if (stack_undo.length) {
            const cmds = stack_undo.pop();
            let pos;
            const rev_cmds = cmds.reverse().map(cmd => {
                const [p, rcmd] = exec_cmd(root, cmd);
                pos = p;
                return rcmd;
            }).filter(c => c);
            rev_cmds.tmark = cmds.tmark;
            stack_redo.push(rev_cmds);
            handle_modify();
            return pos;
        } else return false;
    };
    const cmd_redo = () => {
        if (stack_redo.length) {
            const cmds = stack_redo.pop();
            let pos;
            const rev_cmds = cmds.reverse().map(cmd => {
                const [p, rcmd] = exec_cmd(root, cmd);
                pos = p;
                return rcmd;
            }).filter(c => c);
            rev_cmds.tmark = cmds.tmark;
            stack_undo.push(rev_cmds);
            handle_modify();
            return pos;
        } else return false;
    };
    const exec_cmd = (root, cmd) => {
        const c = cmd[0];
        const data = cmd.slice(1);
        let res = null;
        switch (c) {
            case "i":
                res = exec_cmd_insert(root, ...data);
                break;
            case "d":
                res = exec_cmd_delete(root, ...data);
                break;
            case "cp":
                res = exec_cmd_convert2pre(root, ...data);
                break;
            case "cs":
                res = exec_cmd_convert2src(root, ...data);
                break;
            default: debugger;
        }
        return res;
    };
    const exec_cmd_insert = (root, pos, ...nodes) => {
        const par = pos_get_par(root, pos);
        const offset = Pos.end(pos);
        const offset_elem = eget(par, offset) ?? null;
        const elems = nodes.flatMap(n => node2elem(n));
        const npos = Array.from(pos);
        let count = 0;
        elems.forEach(e => {
            par.insertBefore(e, offset_elem);
            count += 1;
        });
        Pos.end_add(npos, count);
        return [npos, ["d", pos, count]];
    };
    const exec_cmd_delete = (root, pos, count) => {
        const par = pos_get_par(root, pos);
        const offset = Pos.end(pos);
        const nodes = [];
        for (let i = 0; i < count; i++) {
            const elem = eget(par, offset);
            if (eis(elem, "hover")) cur_cont_clean();
            nodes.push(elem2node(elem));
            elem.remove();
        }
        return [pos, ["i", pos, ...nodes]];
    };
    const exec_cmd_convert2pre = (root, pos) => {
        const npos = Array.from(pos);
        Pos.end_add(npos, 1);
        const elem = pos_get(root, pos);
        if (eis(elem, "exp")) {
            const node = elem2node(elem);
            const pre_elem = try_node2pre(node);
            if (pre_elem) {
                elem.replaceWith(pre_elem);
                cur_cont_clean();
                return [npos, ["cs", pos]]
            }
        }
        return [npos, ["cs", pos]];
    };
    const exec_cmd_convert2src = (root, pos) => {
        const npos = Array.from(pos);
        Pos.end_add(npos, 1);
        const elem = pos_get(root, pos);
        if (eis_extern(elem)) {
            const node = elem2node(elem);
            node[0] = "rexp";
            const [src_elem] = node2elem(node);
            elem.replaceWith(src_elem);
            cur_cont_clean();
            return [npos, ["cp", pos]]
        }
        return [npos, ["cp", pos]];
    };
    const trigger_convert = elem => {
        if (eis(elem, "exp"))
            return cmd_do(["cp", epos(elem)]);
        else if (eis_extern(elem))
            return cmd_do(["cs", epos(elem)]);
    };
    const trigger_convert_pre = elem => {
        if (eis(elem, "exp"))
            return cmd_do(["cp", epos(elem)]);
    };
    const try_node2pre = node => {
        const head = utils.pick_head(node);
        if (head.startsWith('@')) {
            const pre_elem = preview_fn(head.slice(1), node);
            return pre_elem;
        }
        return null;
    };
    const preview_fn = (type, node) => {
        if (preview[type])
            return preview[type](node);
        else
            return null;
    };
    const text2elems = (text) => {
        return text.split('').map(c => {
            if (c === '\n')
                return enew_newline();
            else
                return enew_token(c);
        });
    };
    const node2elem = node => {
        if (typeof node === "string")
            if (node.length > 1 && node.startsWith('"') && node.endsWith('"'))
                return [elem_qt_create(Pos.pop(node.split('').slice(1)))];
            else
                return text2elems(node);
        switch (node[0]) {
            case "exp":
                const pre_elem = try_node2pre(node);
                if (pre_elem) return [pre_elem];
            case "rexp":
                return [elem_exp_create(node.slice(1))];
            case "vec":
                return [elem_vec_create(node.slice(1))];
            default: debugger;
        }
    };
    const elem_qt_create = data => {
        const elem = enew_qt(data.flatMap(node2elem));
        elem.addEventListener("mouseenter", handle_enter);
        elem.addEventListener("mouseleave", handle_leave);
        return elem;
    };
    const elem_exp_create = data => {
        const elem = enew_exp(data.flatMap(node2elem));
        elem.addEventListener("mouseenter", handle_enter);
        elem.addEventListener("mouseleave", handle_leave);
        return elem;
    };
    const elem_vec_create = data => {
        const elem = enew_vec(data.flatMap(node2elem));
        elem.addEventListener("mouseenter", handle_enter);
        elem.addEventListener("mouseleave", handle_leave);
        return elem;
    };
    const pre_struct_create = sets => {
        const classes = sets.classes ?? [];
        const parse_node = sets.parse_node;
        const items = sets.items ?? [];
        const css_var = sets.css_var ?? {};
        const start_col = sets.start_col ?? 0;
        const end_col = sets.end_col ?? 0;
        const data = sets.data ?? {};
        const elem = enew_struct_extern(
            data,
            start_col,
            end_col,
            parse_node,
            ...classes,
        );
        elem.append(...items);
        for (const key in css_var) {
            const value = css_var[key];
            elem.style.setProperty("--" + key, value);
        }
        elem.addEventListener("mouseenter", handle_enter);
        elem.addEventListener("mouseleave", handle_leave);
        return elem;
    };
    const pre_stream_create = sets => {
        const classes = sets.classes ?? [];
        const parse_node = sets.parse_node;
        const items = sets.items ?? [];
        const start_col = sets.start_col ?? 0;
        const end_col = sets.end_col ?? 0;
        const data = sets.data ?? {};
        const elem = enew_stream_extern(
            data,
            start_col,
            end_col,
            parse_node,
            ...classes,
        );
        elem.append(...items);
        elem.addEventListener("mouseenter", handle_enter);
        elem.addEventListener("mouseleave", handle_leave);
        return elem;
    };
    const hide_elem_create = inner => enew_hide(inner);
    const get_env = () => {
        const par = pos_get_par(root, cursor_pos);
        if (eis(par, "qt"))
            return "raw";
        else
            return "cont";
    };
    const handle_key = (e) => {
        key_listener.trigger(e, root);
    };
    const clear_content = () => {
        return cmd_do(['d', [0], esize(root)]);
    };
    root.has_selection = () => !!selection;
    root.get_selection = () => selection;
    root.set_selection = set_selection;
    root.clear_selection = clear_selection;
    root.delete_selection = delete_selection;
    root.is_select_from_start = () => Pos.same(cursor_pos, selection[1]);
    root.set_cursor = (pos) => {
        cursor_pos = pos;
        update_cursor();
    };
    root.get_cursor = () => cursor_pos;
    root.get_cursor_anchor = () => cursor_anchor;
    root.update_cursor_anchor = update_cursor_anchor;
    root.has_focus = () => !eis_root(pos_get_par(root, cursor_pos));
    root.get_focus = () => Pos.pop(cursor_pos);
    root.cmd_do = cmd_do;
    root.cmd_undo = cmd_undo;
    root.cmd_redo = cmd_redo;
    root.get_range = (start, end) => {
        const elems = range_get(root, start, end);
        return elems.map(elem2node);
    };
    root.elem2node = elem2node;
    root.node2elem = node2elem;
    root.pre_struct_create = pre_struct_create;
    root.pre_stream_create = pre_stream_create;
    root.hide_elem_create = hide_elem_create;
    root.is_modified = () => {
        if (preload_tmark === null)
            return stack_undo.length > 0;
        else if (stack_undo.length)
            return Pos.end(stack_undo).tmark !== preload_tmark;
        else
            return true;
    };
    root.update_modify_state = () => {
        time_pre_do = 0;
        if (stack_undo.length)
            preload_tmark = Pos.end(stack_undo).tmark;
        else
            preload_tmark = null;
    };
    root.get_nodes = () => {
        return elems2node(eitems(root));
    };
    root.set_nodes = nodes => {
        clear_content();
        action_insert([0], ...nodes);
    };
    root.get_source = () => {
        return utils.format_source(get_nodes());
    };
    root.set_source = source => {
        set_nodes(utils.parse_source(source));
    };
    const settings = cons(root);
    const config = settings.config ?? {};
    const preview = settings.preview ?? {};
    const actions = settings.actions ?? [];
    const key_listener = new KeyListener(get_env, actions.concat(NORMAL_ACTIONS));
    root.tabIndex = 0;
    root.contentEditable = true;
    root.spellcheck = false;
    root.append(...data.flatMap((e) => node2elem(e)));
    root.addEventListener("blur", handle_unfocus);
    root.addEventListener("copy", handle_copy);
    root.addEventListener("cut", handle_cut);
    root.addEventListener("mousedown", handle_down);
    root.addEventListener("mousemove", handle_move);
    root.addEventListener("mouseup", handle_up);
    root.addEventListener("beforeinput", handle_input);
    root.addEventListener("compositionend", handle_composition);
    root.addEventListener("keydown", handle_key);
    root.addEventListener("keydown", handle_kselectstart);
    return root;
};
