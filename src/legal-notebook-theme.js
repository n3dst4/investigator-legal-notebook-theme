"use strict";
var _a;
exports.__esModule = true;
var assetPath = "modules/investigator-legal-notebook-theme/assets";
var seed = {
    schemaVersion: "v1",
    displayName: "Legal Notebook",
    global: "\n      @import url('https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap');\n    ",
    largeSheetRootStyle: {
        backgroundImage: "\n      linear-gradient(to bottom right, #ff9 0%, #ff5 100%),\n        url(".concat(assetPath, "/stil-wtqe5nd5MYk-unsplash.webp)\n      "),
        backgroundPosition: "center",
        backgroundSize: "cover",
        paddingLeft: "2em",
        backgroundBlendMode: "multiply"
    },
    // smallSheetRootStyle: {
    //   backgroundImage: `url(systems/${systemName}/assets/wallpaper/scott-webb-UjupleczBOY-unsplash.webp)`,
    // },
    bodyFont: "16px 'Architects Daughter', sans-serif",
    displayFont: "normal small-caps normal 1.1em 'Architects Daughter', serif",
    logo: {
        fontScaleFactor: 14,
        frontTextElementStyle: {
            color: "transparent",
            backgroundImage: "linear-gradient(\n          to right,\n          hsl(240deg 100% 23%) 0%,\n          hsl(207deg 100% 28%) 50%,\n          hsl(180deg 100% 23%) 100%\n        )",
            backgroundClip: "text"
        },
        rearTextElementStyle: {
            // display: "none",
            textShadow: [
                "0.03em 0.03em 0px #fff9",
                // "0.06em 0.06em 0px #000",
                "-0.03em -0.03em 0px #fff9",
                // "-0.06em -0.06em 0px #000",
            ].join(", ")
        },
        textElementsStyle: {
        // transform: "scale(0.6)",
        // fontWeight: "bold",
        },
        backdropStyle: {}
    },
    colors: {
        accent: "#007",
        accentContrast: "#fff",
        glow: "#cfffc2",
        wallpaper: "#eee",
        backgroundSecondary: "#fff6",
        backgroundPrimary: "#fff9",
        backgroundButton: "rgba(0,0,0,0.1)",
        text: "#222"
    }
};
console.log("[Legal notebook theme] initializing");
(_a = CONFIG.Investigator) === null || _a === void 0 ? void 0 : _a.installTheme("legal-notebook-theme", seed);
