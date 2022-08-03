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
    lands,
    borders,
    unit,
    context,
}) => {
    const BG_C = "#ffffff";
    
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
    
    // background
    clear();
    
    // shadow
//     ctx.shadowColor = "#000000";
//     ctx.shadowBlur = 15;
//     ctx.globalCompositeOperation = "source-over";
//     draw_shape(lands[0]);
    
    // outline
    with_env(() => {
        ctx.strokeStyle = "#cccccc";
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
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 5.5; y < cavh; y += 4) {
            ctx.moveTo(0, y);
            ctx.lineTo(cavw, y);
        }
        ctx.globalCompositeOperation = "destination-atop";
        ctx.stroke();
    });
    
    // fill land
    with_env(() => {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        for (const land of lands)
            trace_lines(ctx, unit, land);
        ctx.globalCompositeOperation = "source-over";
        ctx.fill();
    });
    
    // stroke land
    with_env(() => {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.lineJoin = "bevel";
        ctx.lineCap = "bevel";
        ctx.beginPath();
        for (const land of lands)
            trace_lines(ctx, unit, land);
        ctx.globalCompositeOperation = "source-over";
        ctx.stroke();
    });
};
