const v = n => [n, n];
const v_add = ([p1_x, p1_y], [p2_x, p2_y]) => [p1_x + p2_x, p1_y + p2_y];
const v_sub = ([p1_x, p1_y], [p2_x, p2_y]) => [p1_x - p2_x, p1_y - p2_y];
const v_mul = ([p_x, p_y], n) => [p_x * n, p_y * n];
const v_div = ([p_x, p_y], n) => [p_x / n, p_y / n];
const m_mid_move = (point_1, point_2, movement) => {
    const pm = v_div(v_add(point_1, point_2), 2);
    const dir = v_sub(point_1, point_2);
    const nor = v_div([-dir[1], dir[0]], 2);
    const mov = v_mul(nor, movement);
    const res = v_add(pm, mov);
    return res;
};
const gen_randomer = seed => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280.0;
    };
};

const do_RMDF = (line, roughness, random) => {
    const res = new Array(line.length * 2 - 1);
    for (let i = 0; i < line.length; i++)
        res[i * 2] = line[i];
    for (let i = 1; i < line.length; i++)
        res[i * 2 - 1] = m_mid_move(
            line[i - 1],
            line[i],
            (random() - 0.5) * 2 * roughness
        );
    return res;
};

export const modifiers = {
    "RMDF": (line, roughness, time, seed) => {
        const random = gen_randomer(seed);
        let res = line;
        for (let i = 0; i < time; i++) {
            res = do_RMDF(res, roughness, random);
        }
        return res;
    },
};
