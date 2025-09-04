/*
 * Module: sheet
 * Gen 0.1
 */

import {normalize, sub_lead_whitespace} from "../node-utils.js";

const rxp_whitespace = /[\u0009\u000B\u000C\u0020\u00A0\u000A\u000D\u2028\u2029]+/;

const nis_whitespace = n => rxp_whitespace.test(n);

const m_token = node => node.filter(n => !rxp_whitespace.test(n));

const m_hide_token = (ed, token) => {
    return [ed.hide_elem_create(token)];
};

const m_mapper = (ed, {lead, body, tail}, mapper) => {
    return nodes => {
        const elems = [];
        const lnode = nodes[0];
        if (typeof lnode === "string" && nis_whitespace(lnode)) {
            elems.push(...lead(ed, lnode));
            nodes.shift();
        }
        const tnode = nodes[nodes.length - 1];
        if (typeof tnode === "string" && nis_whitespace(tnode)) {
            elems.push(...tail(ed, tnode));
            nodes.pop();
        }
        for (const node of nodes) {
            if (typeof node === "string" && nis_whitespace(node))
                elems.push(...body(ed, node));
            else
                elems.push(...mapper(ed, node));
        }
        return elems;
    };
};

export const part = ed => {
    const parse_node = elem => [
        "exp",
        '@sheet',
        ...[...elem.children].map(ed.elem2node),
    ];
    const cell_parse_node = elem => [
        "exp",
        'cell', ' ',
        ...[...elem.children].map(ed.elem2node),
    ];
    return node => {
        const mapper = m_mapper(ed, {
            lead: m_hide_token,
            body: m_hide_token,
            tail: m_hide_token,
        }, (_, node) => {
            const body = normalize(node.slice(1));
            if (body[0] === "size") {
                size = m_token(body.slice(1));
                return m_hide_token(ed, node);
            } else if (body[0] === "cell") {
                const items = sub_lead_whitespace(body.slice(1)).flatMap(ed.node2elem);
                return [ed.pre_struct_create({
                    classes: ["mn-p-sheet-cell"],
                    parse_node: cell_parse_node,
                    items
                })];
            } else
                debugger;
        });
        const body = normalize(node.slice(1)).slice(1);
        let size = [1, 1];
        const items = mapper(body);
        const elem = ed.pre_struct_create({
            classes: ["mn-p-sheet"],
            parse_node,
            items,
            css_var: {
                "sheet-column": size[0],
                "sheet-row": size[1],
            },
        });
        return elem;
    };
};
