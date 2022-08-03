export const shader = ({
    lands,
    borders,
    unit,
    context,
}) => {
    const ctx = context;
    const cav = ctx.canvas;
    const cavw = cav.width;
    const cavh = cav.height;

    const draw_line = (points) => {
        ctx.beginPath();
        ctx.moveTo(...points[0]);
        const ps = points.slice(1);
        for (const p of ps) {
            ctx.lineTo(...p);
        }
        ctx.stroke();
    };

    const draw_shape = (points) => {
        ctx.beginPath();
        ctx.moveTo(...points[0]);
        const ps = points.slice(1);
        for (const p of ps) {
            ctx.lineTo(...p);
        }
        ctx.fill();
    };
    
    // background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cavw, cavh);
    
    // shadow
//     ctx.shadowColor = "#000000";
//     ctx.shadowBlur = 15;
//     ctx.globalCompositeOperation = "source-over";
//     draw_shape(lands[0]);
    
    // outline
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 20;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "source-over";
    draw_line(lands[0]);
    
    // sea-land line
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    for (let y = 5.5; y < cavh; y += 4) {
        ctx.moveTo(0, y);
        ctx.lineTo(cavw, y);
    }
    ctx.globalCompositeOperation = "destination-atop";
    ctx.stroke();
    
    // fill land
    ctx.fillStyle = "#ffffff";
    ctx.globalCompositeOperation = "source-over";
    draw_shape(lands[0]);
    
    // stroke land
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.lineJoin = "bevel";
    ctx.lineCap = "bevel";
    draw_line(lands[0]);
};
