const n_scroll = (n, min, max) => n < min ? n + max - min : n >= max ? n - max + min : n;
const gen_randomer = seed => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280.0;
    };
};
const wait_render = () => new Promise(resolve => {
    requestAnimationFrame(resolve);
});

export const placer = ({
    x_step,
    y_step,
    start_x,
    start_y,
    end_x,
    end_y,
    x_offset,
    y_offset,
    seed,
    filter,
}) => {
    filter = filter ?? (n => n);
    const rand = gen_randomer(seed || 0);
    const r = () => rand() * 2 - 1;
    const red = 2;
    const sw = x_step / red;
    const ox = x_step * (x_offset || 0);
    const oy = y_step * (y_offset || 0);
    let x = start_x, y = start_y, sx = 0;
    const res = [];
    while (y <= end_y) {
        const p = [x + r() * ox, y + r() * oy];
        const rp = filter(p);
        if (rp !== null) res.push(rp);
        x += x_step;
        if (x > end_x) {
            y += y_step;
            sx = n_scroll(sx + 1, 0, red);
            x = sx * sw + start_x;
        }
    }
    return res;
};

export const collider = async ({
    width,
    height,
    shapes,
    unit,
}) => {
    const cav = document.createElement("canvas");
    const ctx = cav.getContext("2d");
    cav.style.display = "none";
    cav.width = width;
    cav.height = height;
    document.body.append(cav);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    for (const shape of shapes) {
        ctx.beginPath();
        ctx.moveTo(...unit(shape[0]));
        const ps = shape.slice(1);
        for (const p of ps)
            ctx.lineTo(...unit(p));
        ctx.closePath();
        ctx.fill();
    }
    await wait_render();
    const data = ctx.getImageData(0, 0, width, height);
    const dataw = data.width;
    return {
        collide: (x, y, rx, ry) => {
            [x, y] = unit([x, y]);
            x = 0|x;
            y = 0|y;
            const size = rx * ry * 4;
            const x1 = x - rx;
            const y1 = y - ry;
            const x2 = x + rx;
            const y2 = y + ry;
            let sum = 0;
            for (let cx = x1; cx < x2; cx++) {
                for (let cy = y1; cy < y2; cy++) {
                    sum += data.data[(cy * dataw + cx) * 4] / 255;
                }
            }
            const res = sum / size;
            return res;
        },
        destroy: () => {
            cav.remove();
        }
    };
};
