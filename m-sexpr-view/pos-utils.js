export const copy = ary => Array.from(ary);

export const end = ary => ary[ary.length - 1];

export const end_add = (ary, n) => ary[ary.length - 1] += n;

export const with_end_add = (ary, n) => append(pop(ary), end(ary) + n);

export const pop = ary => ary.slice(0, ary.length - 1);

export const append = (ary, e) => ary.concat([e]);

export const same = (ary1, ary2) => {
    if (ary1.length !== ary2.length) return false;
    for (let i = 0; i < ary1.length; i++) {
        if (ary1[i] !== ary2[i]) return false;
    }
    return true;
};

export const contain = (ary1, ary2) => {
    if (ary1.length < ary2.length) return false;
    for (let i = 0; i < ary2.length; i++)
        if (ary1[i] !== ary2[i]) return false;
    return true;
};

export const lt = (ary1, ary2) => { // little than
    const len = Math.min(ary1.length, ary2.length);
    for (let i = 0; i < len; i++) {
        if (ary1[i] > ary2[i]) return false;
        if (ary1[i] < ary2[i]) return true;
    }
    if (ary1.length > ary2.length) return false;
    else return true;
};

const _reduce_range = (s, e) => {
    if (s.length === e.length)
        if (same(pop(s), pop(e))) {
            return [s, e];
        } else {
            s.pop();
            e.pop();
            e[e.length - 1] += 1;
            return _reduce_range(s, e);
        }
    if (s.length > e.length) {
        s.pop();
        return _reduce_range(s, e);
    }
    if (s.length < e.length) {
        e.pop();
        e[e.length - 1] += 1;
        return _reduce_range(s, e);
    }
};

export const calc_range = (anchor, focus) => {
    if (lt(anchor, focus)) {
        const [s, e] = _reduce_range(Array.from(anchor), Array.from(focus));
        return [s, e, e];
    } else {
        const [s, e] = _reduce_range(Array.from(focus), Array.from(anchor));
        return [s, e, s];
    }
};
