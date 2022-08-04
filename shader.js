import {modifiers} from "./modifiers.js";

const trace_line = (ctx, unit, points) => {
    ctx.moveTo(...unit(points[0]));
    const ps = points.slice(1);
    for (const p of ps)
        ctx.lineTo(...unit(p));
};
const trace_lines = (ctx, unit, lines) => {
    const l = lines.flatMap(n => n);
    trace_line(ctx, unit, l);
};

export const shader = ({
    crop,
    waves,
    grass,
    labels,
    lands,
    lines,
    mountains,
    unit,
    context,
}) => {
    const BG_C = "#FFEACD";
    
    const ctx = context;
    const cav = ctx.canvas;
    const cavw = cav.width;
    const cavh = cav.height;
    
    const with_env = cont => {
        ctx.save();
        cont();
        ctx.restore();
    };
    const clear = () => with_env(() => {
        ctx.fillStyle = BG_C;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillRect(0, 0, cavw, cavh);
    });
    
    // set crop
    ctx.beginPath();
    trace_line(ctx, n => n, crop);
//     with_env(() => {
//         ctx.strokeStyle = "#5e564b";
//         ctx.lineWidth = 4;
//         ctx.stroke();
//     });
    ctx.clip();
    
    // background
    clear();
    
    // shadow
//     ctx.shadowColor = "#000000";
//     ctx.shadowBlur = 15;
//     ctx.globalCompositeOperation = "source-over";
//     draw_shape(lands[0]);
    
    // outline
    with_env(() => {
        ctx.strokeStyle = "#b4a591";
        ctx.lineWidth = 20;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        for (const land of lands)
            trace_line(ctx, unit, land);
        ctx.globalCompositeOperation = "source-over";
        ctx.stroke();
    });
    
    // sea-land line
    with_env(() => {
        ctx.strokeStyle = "#b4a591";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 5.5; y < cavh; y += 4) {
            ctx.moveTo(0, y);
            ctx.lineTo(cavw, y);
        }
        ctx.globalCompositeOperation = "destination-atop";
        ctx.stroke();
        ctx.fillStyle = BG_C;
        ctx.globalCompositeOperation = "destination-atop";
        ctx.fillRect(0, 0, cavw, cavh);
    });
    
    // fill land
    with_env(() => {
        ctx.fillStyle = BG_C;
        ctx.beginPath();
        for (const land of lands)
            trace_line(ctx, unit, land);
        ctx.globalCompositeOperation = "source-over";
        ctx.fill();
    });
    
    // stroke land
    with_env(() => {
        ctx.strokeStyle = "#514a41";
        ctx.lineWidth = 1;
        ctx.lineJoin = "bevel";
        ctx.lineCap = "bevel";
        ctx.beginPath();
        for (const land of lands)
            trace_line(ctx, unit, land);
        ctx.globalCompositeOperation = "source-over";
        ctx.stroke();
    });
    
    // stroke wave
    with_env(() => {
        ctx.strokeStyle = "#b4a591";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const e of waves) {
            const p = unit(e);
            ctx.moveTo(p[0] - 15, p[1] + 2);
            ctx.lineTo(p[0] - 10, p[1] + 2);
            ctx.lineTo(p[0] - 5, p[1] + 1);
            ctx.lineTo(p[0], p[1] - 2);
            ctx.lineTo(p[0] + 5, p[1] + 1);
            ctx.lineTo(p[0] + 10, p[1] + 2);
            ctx.lineTo(p[0] + 15, p[1] + 2);
        }
        ctx.stroke();
    });
    
    // stroke grass
    with_env(() => {
        ctx.strokeStyle = "#b4a591";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const e of grass) {
            const p = unit(e);
            ctx.moveTo(p[0] - 2, p[1] + 2);
            ctx.lineTo(p[0] - 3, p[1] - 2);
            ctx.moveTo(p[0] + 2, p[1] + 2);
            ctx.lineTo(p[0] + 3, p[1] - 2);
        }
        ctx.stroke();
    });

    // stroke lines
    for (const {type, data} of lines) {
        with_env(() => {
            switch (type) {
                case "national-border":
                    ctx.strokeStyle = "#6a6155";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (const l of data)
                        trace_line(ctx, unit, l);
                    ctx.stroke();
                    break;
                default:
                    debugger;
            }
        });
    }
    
    // draw mountains
    with_env(() => {
        ctx.fillStyle = BG_C;
        let seed = 0;
        for (const e of mountains) {
            const p = unit(e);
            const s = (e[2] - 0.5) * 2 + 0.4;
            const line = [
                [p[0] - 16 * s, p[1]],
                [p[0], p[1] - 16 * s],
                [p[0] + 16 * s, p[1]],
            ];
            const res = modifiers["RMDF"](line, 0.1, 3, seed);
            ctx.beginPath();
            trace_line(ctx, n => n, res);
            ctx.fill();
            ctx.strokeStyle = BG_C;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = "#514a41";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            for (let x = p[0], y = p[1] - 13 * s; y < p[1]; x -= 1, y += 3) {
                const h = p[1] - y;
                ctx.moveTo(x, y);
                ctx.lineTo(x + h, y + h);
            }
            ctx.strokeStyle = "#b4a591";
            ctx.lineWidth = 1;
            ctx.stroke();
            seed++;
        }
    });

    // draw labels
    with_env(() => {
        ctx.textAlign = "center";
        ctx.textAlign = "middle";
        ctx.font = "italic 16px serif";
        ctx.fillStyle = "#6a6155";
        for (const {label, pos} of labels) {
            ctx.fillText(label, ...unit(pos));
        }
    });
};
