import * as Pos from "./pos-utils.js";
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

const _pos_start = (ed, pos) => {
    const par_pos = Pos.pop(pos);
    const par = pos_get(ed, par_pos);
    let offset = Pos.end(pos) - 1;
    if (offset === -1 || eis_newline(eget(par, offset))) 
        if (par === ed)
            return pos;
        else
            return par_pos;
    while (true) {
        if (offset < 0) {
            if (par === ed) return [0];
            offset = 0;
            break;
        } else {
            const e = eget(par, offset);
            if (eis_newline(e)) {
                offset += 1;
                break;
            }
        }
        offset -= 1;
    }
    return [...par_pos, offset];
};
const _pos_end = (ed, pos) => {
    const par_pos = Pos.pop(pos);
    const par = pos_get(ed, par_pos);
    let offset = Pos.end(pos);
    if (offset === esize(par) || eis_newline(eget(par, offset))) 
        if (par === ed)
            return pos;
        else
            return Pos.with_end_add(par_pos, 1);
    while (true) {
        if (offset >= esize(par)) {
            if (par === ed) return [esize(par)];
            offset = esize(par);
            break;
        } else {
            const e = eget(par, offset);
            if (eis_newline(e)) break;
        }
        offset += 1;
    }
    return [...par_pos, offset];
};

export const actions = [
    {
        name: "Move Left",
        id: "move-left",
        env: ["cont", "raw"],
        bind: ["ArrowLeft"],
        handle: ed => {
            if (ed.has_selection()) {
                ed.set_cursor(ed.get_selection()[0]);
                ed.clear_selection();
            } else {
                const pos = ed.get_cursor();
                const par = pos_get_par(ed, pos);
                if (Pos.end(pos) === 0)
                    if (pos.length > 1)
                        ed.set_cursor(Pos.pop(pos));
                    else
                        ed.set_cursor(pos);
                else {
                    const pre_pos = Pos.with_end_add(pos, -1);
                    const elem = pos_get(ed, pre_pos);
                    if (eis_cont(elem))
                        ed.set_cursor(Pos.append(pre_pos, esize(elem)));
                    else
                        ed.set_cursor(pre_pos);
                }
            }
            ed.update_cursor_anchor();
        },
    },{
        name: "Move Right",
        id: "move-right",
        env: ["cont", "raw"],
        bind: ["ArrowRight"],
        handle: ed => {
            if (ed.has_selection()) {
                ed.set_cursor(ed.get_selection()[1]);
                ed.clear_selection();
            } else {
                const pos = ed.get_cursor();
                const par = pos_get_par(ed, pos);
                if (Pos.end(pos) === esize(par))
                    if (pos.length > 1)
                        ed.set_cursor(Pos.with_end_add(Pos.pop(pos), 1));
                    else
                        ed.set_cursor(pos);
                else {
                    const elem = pos_get(ed, pos);
                    if (eis_cont(elem))
                        ed.set_cursor(Pos.append(pos, 0));
                    else
                        ed.set_cursor(Pos.with_end_add(pos, 1));
                }
            }
            ed.update_cursor_anchor();
        },
    },{
        name: "Move Up",
        id: "move-up",
        env: ["cont", "raw"],
        bind: ["ArrowUp"],
        handle: ed => {
            ed.clear_selection();
            const tx = ed.get_cursor_anchor().x;
            const res = calc_pre_newline(ed, ed.get_cursor());
            if (res === null)
                ed.set_cursor([0]);
            else {
                let pos = res;
                let pre_pos = pos;
                let pre_x = null;
                while (pos) {
                    const e = pos_get(ed, pos);
                    if (e && eis_newline(e) && pre_x) {
                        ed.set_cursor(pre_pos);
                        break;
                    }
                    const x = get_anchor_gap(ed, pos)[0];
                    if (x <= tx)
                        if (pre_x !== null) {
                            ed.set_cursor(Math.abs(x - tx) < Math.abs(pre_x - tx) ? pos : pre_pos);
                            break;
                        } else {
                            ed.set_cursor(pos);
                            break;
                        }
                    pre_pos = pos;
                    pre_x = x;
                    pos = pos_pre_inline(ed, pos);
                }
            }
        },
    },{
        name: "Move Down",
        id: "move-down",
        env: ["cont", "raw"],
        bind: ["ArrowDown"],
        handle: ed => {
            ed.clear_selection();
            const tx = ed.get_cursor_anchor().x;
            const res = calc_next_newline(ed, ed.get_cursor());
            if (res === null)
                ed.set_cursor([esize(ed)]);
            else {
                let pos = Pos.with_end_add(res, 1);
                let pre_pos = pos;
                let pre_x = null;
                while (pos) {
                    const e = pos_get(ed, pos);
                    const x = get_anchor_gap(ed, pos)[0];
                    if (x >= tx || (e && eis_newline(e)))
                        if (pre_x !== null) {
                            ed.set_cursor(Math.abs(x - tx) < Math.abs(pre_x - tx) ? pos : pre_pos);
                            break;
                        } else {
                            ed.set_cursor(pos);
                            break;
                        }
                    pre_pos = pos;
                    pre_x = x;
                    pos = pos_next_inline(ed, pos);
                    if (pos === null) ed.set_cursor([esize(ed)]);
                }
            }
        },
    },{
        name: "Move Start",
        id: "move-start",
        env: ["cont", "raw"],
        bind: ["Home"],
        handle: ed => {
            ed.clear_selection();
            ed.set_cursor(_pos_start(ed, ed.get_cursor()));
            ed.update_cursor_anchor();
        },
    },{
        name: "Move End",
        id: "move-end",
        env: ["cont", "raw"],
        bind: ["End"],
        handle: ed => {
            ed.clear_selection();
            ed.set_cursor(_pos_end(ed, ed.get_cursor()));
            ed.update_cursor_anchor();
        },
    },{
        name: "Select All",
        id: "select-all",
        env: ["cont", "raw"],
        bind: [["ctrl", "a"], ["ctrl", "A"]],
        handle: ed => {
            ed.clear_selection();
            ed.set_selection([0], [esize(ed)]);
            ed.set_cursor([esize(ed)]);
            ed.update_cursor_anchor();
        },
    },{
        name: "Backspace",
        id: "backspace",
        env: ["cont", "raw"],
        bind: ["Backspace"],
        handle: ed => {
            if (ed.has_selection())
                ed.set_cursor(ed.delete_selection());
            else {
                const pos = ed.get_cursor();
                if (Pos.end(pos) === 0) {
                    if (pos.length > 1)
                        ed.set_cursor(ed.cmd_do(['d', Pos.pop(pos), 1]));
                } else
                    ed.set_cursor(ed.cmd_do(['d', Pos.with_end_add(pos, -1), 1]));
            }
            ed.update_cursor_anchor();
        },
    },{
        name: "Delete",
        id: "delete",
        env: ["cont", "raw"],
        bind: ["Delete"],
        handle: ed => {
            if (ed.has_selection())
                ed.set_cursor(ed.delete_selection());
            else {
                const pos = ed.get_cursor();
                const par = pos_get_par(ed, pos);
                if (Pos.end(pos) === esize(par)) {
                    if (pos.length > 1)
                        ed.set_cursor(ed.cmd_do(['d', Pos.pop(pos), 1]));
                } else
                    ed.set_cursor(ed.cmd_do(['d', pos, 1]));
            }
            ed.update_cursor_anchor();
        },
    },{
        name: "Indent Increase",
        id: "indent-increase",
        env: ["cont", "raw"],
        bind: ["Tab"],
        handle: ed => {
            ed.clear_selection();
            const res = calc_pre_newline(ed, ed.get_cursor());
            let spos = res ? Pos.with_end_add(res, 1) : [0];
            while (eis(pos_get(ed, spos), "w"))
                spos = Pos.with_end_add(spos, 1);
            ed.set_cursor(ed.cmd_do(['i', spos, "  "]));
            ed.update_cursor_anchor();
        },
    },{
        name: "Indent Decrease",
        id: "indent-decrease",
        env: ["cont", "raw"],
        bind: [["shift", "Tab"]],
        handle: ed => {
            ed.clear_selection();
            const res = calc_pre_newline(ed, ed.get_cursor());
            let spos = res ? Pos.with_end_add(res, 1) : [0];
            for (let i = 0; i < 2; i++) {
                if (eis(pos_get(ed, spos), "w"))
                    spos = ed.cmd_do(['d', spos, 1]);
                else
                    break;
            }
            while (eis(pos_get(ed, spos), "w"))
                spos = Pos.with_end_add(spos, 1);
            ed.set_cursor(spos);
            ed.update_cursor_anchor();
        },
    },{
        name: "Newline",
        id: "newline",
        env: ["cont", "raw"],
        bind: ["Enter"],
        handle: ed => {
            ed.delete_selection();
            const pos = ed.get_cursor();
            let spos = _pos_start(ed, pos);
            let str = '\n';
            while (eis(pos_get(ed, spos), "w")) {
                spos = Pos.with_end_add(spos, 1);
                str += ' ';
            }
            ed.set_cursor(ed.cmd_do(['i', pos, str]));
            ed.update_cursor_anchor();
        },
    },{
        name: "Insert Exp",
        id: "insert-exp",
        env: ["cont"],
        bind: ["(", ["shift", "("]],
        handle: ed => {
            if (ed.has_selection()) {
                const nodes = ed.get_range(...ed.get_selection());
                const at_start = !ed.is_select_from_start();
                const pos = ed.delete_selection();
                ed.cmd_do(['i', pos, ["rexp"]]);
                const epos = ed.cmd_do(['i', Pos.append(pos, 0), ...nodes]);
                ed.set_selection(Pos.append(pos, 0), epos);
                ed.set_cursor(at_start ? Pos.append(pos, 0) : epos);
            } else {
                const pos = ed.get_cursor();
                ed.cmd_do(['i', pos, ["rexp"]]);
                ed.set_cursor(Pos.append(pos, 0));
            }
            ed.update_cursor_anchor();
        },
    },{
        name: "Insert Vec",
        id: "insert-vec",
        env: ["cont"],
        bind: ["["],
        handle: ed => {
            if (ed.has_selection()) {
                const nodes = ed.get_range(...ed.get_selection());
                const at_start = !ed.is_select_from_start();
                const pos = ed.delete_selection();
                ed.cmd_do(['i', pos, ["vec"]]);
                const epos = ed.cmd_do(['i', Pos.append(pos, 0), ...nodes]);
                ed.set_selection(Pos.append(pos, 0), epos);
                ed.set_cursor(at_start ? Pos.append(pos, 0) : epos);
            } else {
                const pos = ed.get_cursor();
                ed.cmd_do(['i', pos, ["vec"]]);
                ed.set_cursor(Pos.append(pos, 0));
            }
            ed.update_cursor_anchor();
        },
    },{
        name: "Insert Quote",
        id: "insert-qt",
        env: ["cont"],
        bind: ["\"", ["shift", "\""]],
        handle: ed => {
            ed.delete_selection();
            const pos = ed.get_cursor();
            ed.cmd_do(['i', pos, "\"\""]);
            ed.set_cursor(Pos.append(pos, 0));
            ed.update_cursor_anchor();
        },
    },{
        name: "Remove Cont",
        id: "remove-cont",
        env: ["cont", "raw"],
        bind: [["ctrl", ")"], ["ctrl", "shift", ")"], ["ctrl", "]"]],
        handle: ed => {
            if (ed.has_focus()) {
                const pos = ed.get_focus();
                const elem = pos_get(ed, pos);
                const nodes = ed.get_range(Pos.append(pos, 0), Pos.append(pos, esize(elem)));
                ed.cmd_do(['d', pos, 1]);
                const epos = ed.cmd_do(['i', pos, ...nodes]);
                ed.set_selection(pos, epos);
                ed.set_cursor(epos);
                ed.update_cursor_anchor();
            }
        },
    },{
        name: "Toggle Preview",
        id: "toggle-preview",
        env: ["cont", "raw"],
        bind: [["ctrl", "/"]],
        handle: ed => {
            if (ed.has_focus()) {
                const pos = ed.get_focus();
                const elem = pos_get(ed, pos);
                if (eis(elem, "exp"))
                    ed.set_cursor(ed.cmd_do(["cp", pos]));
                else
                    ed.set_cursor(ed.cmd_do(["cs", pos]));
                ed.update_cursor_anchor();
            }
        },
    },{
        name: "Undo",
        id: "undo",
        env: ["cont", "raw"],
        bind: [["ctrl", "z"], ["ctrl", "Z"]],
        handle: ed => {
            const pos = ed.cmd_undo();
            if (pos) {
                ed.set_cursor(pos);
                ed.update_cursor_anchor();
            }
        },
    },{
        name: "Redo",
        id: "redo",
        env: ["cont", "raw"],
        bind: [["ctrl", "shift", "z"], ["ctrl", "shift", "Z"]],
        handle: ed => {
            const pos = ed.cmd_redo();
            if (pos) {
                ed.set_cursor(pos);
                ed.update_cursor_anchor();
            }
        },
    },
];
