export const packer = {
    "DefineBlock": elems => {
        const type = "block";
        const id = elems[0].id;
        const children = elems.slice(2, elems.length-1);
        const rules = children.filter(e => !(e.type && e.type === "block"));
        const scope = children.filter(e => e.type && e.type === "block");
        return [{type,id,rules,scope}];
    },
    "Rule": elems => [elems.slice(1, elems.length-1)],
    "Assertion": elems => {
        const res = {type: "assertion", sub: elems[1]};
        res.positive = elems[0] === "@";
        return [res];
    },
    "Sequence": elems => {
        const res = {type: "sequence", sub: elems[0]};
        if (elems[1] === "?") {
            res.min = 0;
            res.max = 1;
        } else if (elems[1] === "*") {
            res.min = 0;
            res.max = "inf";
        } else if (elems[1] === "+") {
            res.min = 1;
            res.max = "inf";
        } else if (elems.length === 4) {
            self.min = elems[2].value;
            self.max = "inf";
        } else {
            self.min = elems[2].value;
            self.max = elems[4].value;
        }
        return [res];
    },
    "Token": elems => [{type: "token", id: elems[0].value}],
    "Regexp": elems => [{type: "regexp", regexp: elems[0].value}],
    "String": elems => [{type: "string", str: elems[0].value}],
    "Set": elems => [{type: "set", rules: elems.filter(e => typeof e === "object")}],
    "SetPart": elems => [elems]
};