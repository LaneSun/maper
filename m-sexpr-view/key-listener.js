/*
 * Module: key-listener
 * Gen 0.1
 */

const get_key_code = key => {
    if (typeof key === "string") return key;
    const opts = [];
    if (key.includes("ctrl")) opts.push("ctrl");
    if (key.includes("alt")) opts.push("alt");
    if (key.includes("shift")) opts.push("shift");
    opts.push(key[key.length - 1]);
    return opts.join("::");
};

export class KeyListener {
    constructor(env_getter, actions) {
        this.env = env_getter;
        this.actions = new Map();
        this.keybinds = new Map();
        this.add_actions(actions);
    }
    add_actions(actions) {
        for (const action of actions)
            this.add_action(action);
    }
    add_action(action) {
        if (this.actions.has(action.id)) debugger;
        this.actions.set(action.id, action);
        for (const key of action.bind) {
            const code = get_key_code(key);
            this.insert_action(code, action);
        }
    }
    insert_action(code, action) {
        if (this.keybinds.has(code))
            this.keybinds.get(code).push(action);
        else
            this.keybinds.set(code, [action]);
    }
    trigger(event, ed) {
        const opt = [];
        if (event.ctrlKey) opt.push("ctrl");
        if (event.altKey) opt.push("alt");
        if (event.shiftKey) opt.push("shift");
        opt.push(event.key);
        const code = opt.join("::");
        if (this.keybinds.has(code)) {
            const env = this.env();
            let triggered = false;
            for (const action of this.keybinds.get(code)) {
                if (action.env.includes(env)) {
                    triggered = true;
                    action.handle(ed);
                }
            }
            if (triggered) event.preventDefault();
        }
    }
};
