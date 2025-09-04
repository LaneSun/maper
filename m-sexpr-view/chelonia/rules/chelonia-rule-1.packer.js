export const packer = {
    "Whitespace": elems => [],
    "Token": elems => [{id: "Token", value: elems.join('')}],
    "Number": elems => [{id: "Number", value: Number.parseInt(elems.join(''))}],
    "Regexp": elems => [{id: "Regexp", value: elems[1]}],
    "String": elems => [{id: "String", value: elems[1]}],
    "StrBackslashSequence": elems => [elems[1]],
    "Body": elems => [elems.join('')],
    "Comment": elems => [],
};