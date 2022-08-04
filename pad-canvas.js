export const create_pad = elem => {
    elem.classList.add("pd-rt");
    const cav = document.createElement("canvas");
    const gui = document.createElement("canvas");
    cav.classList.add("pd-cav");
    gui.classList.add("pd-gui");
    let pos_x = elem.clientWidth / 2;
    let pos_y = elem.clientHeight / 2;
    
    const update_pos = (x, y) => {
        pos_x = x;
        pos_y = y;
        update();
    };
    const move_pos = (x, y) => {
        pos_x += x;
        pos_y += y;
        update();
    };
    const update = () => {
        const rx = pos_x - cav.clientWidth / 2;
        const ry = pos_y - cav.clientHeight / 2;
        cav.style.setProperty("--pos-x", rx + "px");
        cav.style.setProperty("--pos-y", ry + "px");
        gui.style.setProperty("--pos-x", rx + "px");
        gui.style.setProperty("--pos-y", ry + "px");
    };
    const set_size = (w, h) => {
        cav.width = w;
        cav.height = h;
        gui.width = w;
        gui.height = h;
        update();
    }
    
    cav.set_size = set_size;
    
    elem.append(cav, gui);
    update();
    
    elem.addEventListener("mousemove", e => {
        if (e.buttons & 4) move_pos(e.movementX, e.movementY);
    });
    
    return [cav, gui];
};
