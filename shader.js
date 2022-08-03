const trace_line = (ctx, unit, points) => {
    ctx.moveTo(...unit(points[0]));
    const ps = points.slice(1);
    for (const p of ps)
        ctx.lineTo(...unit(p));
};
const trace_lines = (ctx, unit, lines) => {
    for (const l of lines)
        trace_line(ctx, unit, l);
};

export const shader = ({
    crop,
    lands,
    borders,
    waves,
    grass,
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
            trace_lines(ctx, unit, land);
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
            trace_lines(ctx, unit, land);
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
            trace_lines(ctx, unit, land);
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
    
    // draw mountains
    with_env(() => {
        ctx.strokeStyle = "#514a41";
        ctx.fillStyle = BG_C;
        ctx.lineWidth = 1;
        for (const e of mountains) {
            const p = unit(e);
            const s = (e[2] - 0.5) * 2 + 0.2;
            ctx.beginPath();
            ctx.moveTo(p[0] - 16 * s, p[1]);
            ctx.lineTo(p[0], p[1] - 24 * s);
            ctx.lineTo(p[0] + 16 * s, p[1]);
            ctx.fill();
            ctx.stroke();
        }
    });
};
