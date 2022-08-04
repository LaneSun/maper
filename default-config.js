export const sets = {
    "map-width": 4000,
    "map-height": 4000,
    "map-resolution": 200,
    "show-sample-points": true,
    "show-scale": true,
    "show-compass": true,
    "do-stylize": true,
    "crop-border": 20,
    "crop-spoint-space": 100,
    "crop-roughness": 0.3,
    "crop-sub-time": 6,
    "crop-seed": 0,
    "data-labels": [{
        type: "label",
        data: ["阿米西提亚王国", 2845, 1647]
    },{
        type: "label",
        data: ["伊格提希姆帝国", 1700, 1502]
    },{
        type: "label",
        data: ["路格拉斯公国", 2065, 2732]
    }],
    "data-sample-points": [{
        type: "point",
        data: ["p1", 3125, 0]
    },{
        type: "point",
        data: ["p2", 2565, 507]
    },{
        type: "point",
        data: ["p3", 1730, 757]
    },{
        type: "point",
        data: ["p4", 1065, 1717]
    },{
        type: "point",
        data: ["p5", 0, 1992]
    },{
        type: "point",
        data: ["plb", 0, 4000]
    },{
        type: "point",
        data: ["p6", 2250, 4000]
    },{
        type: "point",
        data: ["p7", 2860, 3167]
    },{
        type: "point",
        data: ["p8", 2935, 2312]
    },{
        type: "point",
        data: ["p9", 3535, 1822]
    },{
        type: "point",
        data: ["p10", 4000, 2012]
    },{
        type: "point",
        data: ["prt", 4000, 0]
    },{
        type: "point",
        data: ["mes", 1355, 1362]
    },{
        type: "point",
        data: ["me1", 1175, 2022]
    },{
        type: "point",
        data: ["me2", 1295, 2417]
    },{
        type: "point",
        data: ["me3", 1365, 2907]
    },{
        type: "point",
        data: ["me4", 1585, 3267]
    },{
        type: "point",
        data: ["me5", 2230, 3382]
    },{
        type: "point",
        data: ["me6", 2660, 2947]
    },{
        type: "point",
        data: ["me7", 2570, 1897]
    },{
        type: "point",
        data: ["mee", 3390, 2042]
    },{
        type: "point",
        data: ["mws", 825, 1547]
    },{
        type: "point",
        data: ["mw1", 880, 2162]
    },{
        type: "point",
        data: ["mw2", 1085, 2517]
    },{
        type: "point",
        data: ["mw3", 1025, 3042]
    },{
        type: "point",
        data: ["mw4", 1395, 3607]
    },{
        type: "point",
        data: ["mw5", 2230, 3832]
    },{
        type: "point",
        data: ["mw6", 3010, 3462]
    },{
        type: "point",
        data: ["mw7", 3320, 2692]
    },{
        type: "point",
        data: ["mwe", 3685, 2452]
    },{
        type: "point",
        data: ["nb1-s", 1370, 2777]
    },{
        type: "point",
        data: ["nb1-1", 1895, 1952]
    },{
        type: "point",
        data: ["nb1-e", 2575, 2247]
    },{
        type: "point",
        data: ["nb2-s", 1895, 1952]
    },{
        type: "point",
        data: ["nb2-1", 2395, 1327]
    },{
        type: "point",
        data: ["nb2-e", 2385, 647]
    },{
        type: "point",
        data: ["nb3-s", 1160, 2427]
    },{
        type: "point",
        data: ["nb3-e", 1215, 2617]
    },{
        type: "point",
        data: ["nb4-s", 2435, 942]
    },{
        type: "point",
        data: ["nb4-1", 3220, 1282]
    },{
        type: "point",
        data: ["nb4-e", 3545, 1827]
    }],
    "data-sample-lines": [{
        type: "sline",
        id: "l-mainland-lt",
        modifiers: [
            ["RMDF", 0.4, 7, 1],
        ],
        data: ["p1", "p2", "p3", "p4", "p5"],
    },{
        type: "sline",
        id: "l-mainland-lb",
        modifiers: [],
        data: ["p5", "plb", "p6"],
    },{
        type: "sline",
        id: "l-mainland-rb",
        modifiers: [
            ["RMDF", 0.4, 7, 2],
        ],
        data: ["plb", "p6", "p7", "p8", "p9", "p10"],
    },{
        type: "sline",
        id: "l-mainland-rt",
        modifiers: [],
        data: ["p10", "prt", "p1"],
    },{
        type: "sline",
        id: "l-mountain-e",
        modifiers: [
            ["RMDF", 0.3, 5, 6],
        ],
        data: ["mes", "me1", "me2", "me3", "me4", "me5", "me6", "me7", "mee"],
    },{
        type: "sline",
        id: "l-mountain-w",
        modifiers: [
            ["RMDF", 0.3, 5, 6],
        ],
        data: ["mwe", "mw7", "mw6", "mw5", "mw4", "mw3", "mw2", "mw1", "mws"],
    },{
        type: "sline",
        id: "l-nb-1",
        modifiers: [
            ["RMDF", 0.3, 8, 19],
        ],
        data: ["nb1-s", "nb1-1", "nb1-e"],
    },{
        type: "sline",
        id: "l-nb-2",
        modifiers: [
            ["RMDF", 0.3, 8, 20],
        ],
        data: ["nb2-s", "nb2-1", "nb2-e"],
    },{
        type: "sline",
        id: "l-nb-3",
        modifiers: [
            ["RMDF", 0.3, 3, 5],
        ],
        data: ["nb3-s", "nb3-e"],
    },{
        type: "sline",
        id: "l-nb-4",
        modifiers: [
            ["RMDF", 0.3, 8, 11],
        ],
        data: ["nb4-s", "nb4-1", "nb4-e"],
    }],
    "data-lands": [{
        type: "land",
        data: ["a-mainland", "l-mainland-lt", "l-mainland-lb", "l-mainland-rb", "l-mainland-rt"],
    }],
    "data-lines": [{
        type: "line",
        data: ["l-nb-1", "national-border", "l-nb-1"],
    },{
        type: "line",
        data: ["l-nb-2", "national-border", "l-nb-2"],
    },{
        type: "line",
        data: ["l-nb-3", "national-border", "l-nb-3"],
    },{
        type: "line",
        data: ["l-nb-4", "national-border", "l-nb-4"],
    }],
    "data-fields": [{
        type: "field",
        data: ["f-mountain", "mountain", "l-mountain-e", "l-mountain-w"],
    }],
};
