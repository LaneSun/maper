/*
 * Script: m-note-view
 * Gen 0.1
 */

import {create_view} from "./struct-editor.js";
import * as utils from "./node-utils.js";
import {part as p_sheet} from "./parts/sheet.js";

const prefix = type => "mn-" + type;

const test_source = `(@h Welcome)

Welcome to use the struct editor.

To insert a block, type (@p (@sbl)) (@sb which is a "exp" block) or (@p (@mbl)) (@sb which is a "vec" block).
To insert a preview block, type (@p (@sb @<preview-type> ...<preview-data>)).

(@h Shotcuts)

(@p Ctrl) + (@p /): toggle preview/source
(@p Ctrl) + (@p Shift) + (@p (@sbl)): release text from current block
(@p Ctrl) + (@p z): undo
(@p Ctrl) + (@p Z) / (@p Ctrl) + (@p Shift) + (@p z): redo

(@h Preview Types)

(@p h): title
(@p b): bold text
(@p i): italic text
(@p p): inline code
(@p s): baseline aligned text
(@p sb): text surrounded by parentheses
(@p code): code block
(@p sbl): left parentheses
(@p sbr): right parentheses
(@p mbl): left middle parentheses
(@p mbr): right middle parentheses

(@h Demo)

Lisp like code

(@code (define (hello)
    (set! data [1 2 3
4 5 6])
    (print "hello world!")))

Sheet

(@sheet (size 4 3)
    (cell ) (cell (@b Name)) (cell (@b Count)) (cell (@b Price))
    (cell 1) (cell Pizza) (cell 1) (cell $21.30)
    (cell 2) (cell Hamburger) (cell 3) (cell $9.90))
`;

const view = create_view(test_source, ed => {
    const gen_fn_pre_text = type => {
        const parse_node = elem => [
            "exp",
            '@' + type, ' ',
            ...[...elem.children].map(ed.elem2node),
        ];
        return node => {
            const items = utils.pick_body(node).flatMap(ed.node2elem);
            const root = ed.pre_stream_create({
                classes: [prefix(type)],
                parse_node,
                items,
            });
            return root;
        };
    };

    const gen_fn_pre_text_block = type => {
        const parse_node = elem => [
            "exp",
            '@' + type, ' ',
            ...[...elem.children].map(ed.elem2node),
        ];
        return node => {
            const items = utils.pick_body(node).flatMap(ed.node2elem);
            const root = ed.pre_struct_create({
                classes: [prefix(type)],
                parse_node,
                items,
            });
            return root;
        };
    };
    return {
        config: {},
        preview: {
            "h": gen_fn_pre_text("h"),
            "b": gen_fn_pre_text("b"),
            "i": gen_fn_pre_text("i"),
            "p": gen_fn_pre_text("p"),
            "s": gen_fn_pre_text("s"),
            "sb": gen_fn_pre_text("sb"),
            "sbl": gen_fn_pre_text("sbl"),
            "sbr": gen_fn_pre_text("sbr"),
            "mbl": gen_fn_pre_text("mbl"),
            "mbr": gen_fn_pre_text("mbr"),
            "code": gen_fn_pre_text_block("code"),
            "sheet": p_sheet(ed),
        },
    };
});

document.getElementById("editor").append(view);
