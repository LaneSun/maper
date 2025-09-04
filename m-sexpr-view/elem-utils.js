import * as Pos from "./pos-utils.js";

const t2c = t => "st-" + t;

export const enew = ({inner, types, data} = {}) => {
    inner = inner ?? "";
    types = types ?? [];
    data = data ?? {};
    const elem = document.createElement("div");
    elem.st_data = {};
    etype_set(elem, "e", ...types);
    edata_init(elem, data);
    elem.textContent = inner;
    return elem;
};

export const eis = (e, t) => e && e.classList.contains(t2c(t));
export const eis_nelem = e => e.nodeType === 3;
export const eis_root = e => eis(e, "rt") || eis(e, "mrt");
export const eis_token = e => eis(e, "t") || eis(e, "w");
export const eis_newline = e => eis(e, "l");
export const eis_struct = e => eis(e, "b");
export const eis_stream = e => eis(e, "s");
export const eis_cont = e => eis_struct(e) || eis_stream(e) || eis_root(e);
export const eis_nroot = e => eis(e, "nrt");
export const eis_extern = e => eis(e, "ext");
export const eis_elem = e => eis(e, "e");

export const einner = elem => elem.textContent;
export const eget = (elem, index) => elem.children[index];
export const eget_node = (elem, index) => elem.childNodes[index];
export const eget_last = elem => elem.children[elem.children.length - 1];
export const eget_first = elem => elem.children[0];
export const egets = (elem, index, count) => eitems(elem).slice(index, index + count);
export const epar = elem => elem.parentElement;
export const enelem2elem = nelem => eis_nelem(nelem) ? nelem.parentElement : nelem;
export const eitems = elem => [...elem.children];
export const eindex = elem => eitems(epar(elem)).indexOf(elem);
export const esize = elem => elem.children.length;
export const ehas = (par, elem) => eitems(par).includes(elem);
export const econtains = (par, elem) => par.contains(elem) && par !== elem;
export const etype_set = (elem, ...types) => elem.classList.add(...types.map(t2c));
export const etype_unset = (elem, ...types) => elem.classList.remove(...types.map(t2c));
export const edata_set = (elem, key, value) => elem.st_data[key] = value;
export const edata_unset = (elem, key) => delete elem.st_data[key];
export const edata_init = (elem, data) => elem.st_data = data;
export const edata_get = (elem, key) => elem.st_data[key];
export const epar_cont = elem => {
    if (epar(elem))
        if (eis_cont(epar(elem)))
            return epar(elem);
        else
            return epar_cont(epar(elem));
    else
        return null;
};
export const epos = elem => { // FIXME
    if (eis_elem(elem))
        if (eis_root(elem))
            return [];
        else
            return epos(epar(elem)).concat(eindex(elem));
    else
        if (epar(elem))
            return epos(epar(elem));
        else
            return null;
};
export const eroot = elem => {
    if (eis_elem(elem))
        if (eis_root(elem))
            return elem
        else
            return eroot(epar(elem));
    else
        if (epar(elem))
            return eroot(epar(elem));
        else
            return null;
};
export const emroot = eroot;

export const pos_get = (elem, pos) => {
    console.assert(!elem || eis_elem(elem)); // TRAP
    if (pos.length)
        return pos_get(eget(elem, pos[0]), pos.slice(1));
    else
        return elem;
};
export const pos_get_node = (root, pos) => eget_node(pos_get_par(root, pos), Pos.end(pos));
export const pos_get_par = (elem, pos) => pos_get(elem, Pos.pop(pos));
export const range_get = (elem, start, end) => {
    const par = pos_get_par(elem, start);
    return egets(par, Pos.end(start), Pos.end(end) - Pos.end(start));
};
export const pos_pre_inline = (root, pos) => {
    if (Pos.end(pos) === 0)
        if (pos.length === 1)
            return null;
        else
            return Pos.pop(pos);
    const pre_pos = Pos.with_end_add(pos, -1);
    const elem = pos_get(root, pre_pos);
    if (eis_cont(elem))
        return Pos.append(pre_pos, esize(elem));
    else
        return pre_pos;
};
export const pos_next_inline = (root, pos) => {
    const par = pos_get_par(root, pos);
    if (Pos.end(pos) === esize(par))
        if (pos.length === 1)
            return null;
        else
            return Pos.with_end_add(Pos.pop(pos), 1);
    const elem = pos_get(root, pos);
    if (eis_cont(elem))
        return Pos.append(pos, 0);
    else
        return Pos.with_end_add(pos, 1);
};
export const calc_pre_newline = (root, pos) => {
    let par_pos = Pos.pop(pos);
    let par = pos_get(root, par_pos);
    let offset = Pos.end(pos) - 1;
    while (true) {
        if (offset < 0) {
            if (par === root) return null;
            par = epar(par);
            offset = Pos.end(par_pos);
            par_pos.pop();
        } else {
            const e = eget(par, offset);
            if (eis_newline(e)) break;
            else if (eis_stream(e)) {
                par = e;
                par_pos.push(offset);
                offset = esize(e);
            }
        }
        offset -= 1;
    }
    return [...par_pos, offset];
};
export const calc_next_newline = (root, pos) => {
    let par_pos = Pos.pop(pos);
    let par = pos_get(root, par_pos);
    let offset = Pos.end(pos);
    while (true) {
        if (offset >= esize(par)) {
            if (par === root) return null;
            par = epar(par);
            offset = Pos.end(par_pos);
            par_pos.pop();
        } else {
            const e = eget(par, offset);
            if (eis_newline(e)) break;
            else if (eis_stream(e)) {
                par = e;
                par_pos.push(offset);
                offset = -1;
            }
        }
        offset += 1;
    }
    return [...par_pos, offset];
};
export const get_elem_rect = elem => {
    console.assert(eis_elem(elem)); // TRAP
    return elem.getBoundingClientRect();
}
export const get_elem_rects = elem => elem.getClientRects();
const get_elem_start_rect = elem =>
    eis_newline(elem) || eis_stream(elem) ?
        get_elem_rects(elem)[0] :
        get_elem_rect(elem);
const get_elem_end_rect = elem =>
    eis_newline(elem) || eis_stream(elem) ?
        Pos.end(get_elem_rects(elem)) :
        get_elem_rect(elem);
const get_elem_start_gap = (root, elem, rt_rect) => {
    const rect = get_elem_start_rect(elem);
    return [rect.left - rt_rect.left + root.scrollLeft,
            rect.top - rt_rect.top + root.scrollTop,
            rect.height];
};
const get_elem_end_gap = (root, elem, rt_rect) => {
    const rect = get_elem_end_rect(elem);
    return [rect.right - rt_rect.left + root.scrollLeft,
            rect.top - rt_rect.top + root.scrollTop,
            rect.height];
};
export const get_anchor_gap = (root, anchor) => {
    console.assert(anchor.length); // TRAP
    if (!anchor.length) debugger; //TRAP
    const end = Pos.end(anchor);
    const par = pos_get_par(root, anchor);
    const mrt_rect = get_elem_rect(emroot(root));
    console.assert(eis_cont(par)); // TRAP
    if (end < esize(par)) {
        const elem = eget(par, end);
        const pelem = eget(par, end-1);
        if (eis_newline(elem) && pelem)
            return get_elem_end_gap(root, pelem, mrt_rect);
        else
            return get_elem_start_gap(root, elem, mrt_rect);
    } else if (esize(par))
        return get_elem_end_gap(root, eget_last(par), mrt_rect);
    else {
        const rect = get_elem_rect(par);
        return par === root ? [8, 8, Math.min(rect.height, 20)] :
                              [rect.left - mrt_rect.left + rect.width/2 + root.scrollLeft,
                               rect.top - mrt_rect.top + root.scrollTop,
                               rect.height];
    }
};
