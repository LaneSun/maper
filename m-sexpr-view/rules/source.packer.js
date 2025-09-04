export const packer = {
    "Sexpr": elems => [["exp", ...elems.slice(1, elems.length - 1)]],
    "Vector": elems => [["vec", ...elems.slice(1, elems.length - 1)]],
    "Whitespace": elems => [elems.join('')],
    "Token": elems => [elems.join('')],
};
