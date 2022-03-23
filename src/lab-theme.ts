import { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";

const assetPath = "modules/investigator-fvtt-theme-lab-notebook/assets"

const seed: ThemeSeedV1 = {
    schemaVersion: "v1",
    displayName: "Lab Notebook",
    global: `
      @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand+SC&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
    `,
    largeSheetRootStyle: {
      backgroundImage: `url(${assetPath}/stil-wtqe5nd5MYk-unsplash.webp)`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    },
    // smallSheetRootStyle: {
    //   backgroundImage: `url(systems/${systemName}/assets/wallpaper/scott-webb-UjupleczBOY-unsplash.webp)`,
    // },
    bodyFont: "16px 'Patrick Hand SC', sans-serif",
    displayFont: "normal small-caps normal 1.1em 'Fredericka the Great', serif",
    logo: {
      fontScaleFactor: 14,
      frontTextElementStyle: {
        color: "#007",
        // textShadow: [
        //   "0.03em 0.03em 0px #fff",
        //   // "0.06em 0.06em 0px #000",
        //   "-0.03em -0.03em 0px #fff",
        //   // "-0.06em -0.06em 0px #000",
        // ].join(", "),
      },
      rearTextElementStyle: {
        display: "none",
      },
      textElementsStyle: {
        // transform: "scale(0.6)",
        // fontWeight: "bold",
      },
      backdropStyle: {
      },
    },
    colors: {
      accent: "#007",
      accentContrast: "#fff",
      glow: "#cfffc2",
      wallpaper: "#eee", //
      backgroundSecondary: "#fff6",
      backgroundPrimary: "#fff9",
      backgroundButton: "rgba(0,0,0,0.1)",
      text: "#222",
    },
};

console.log("[Lab Theme] initializing");
CONFIG.Investigator?.installTheme("Lab", seed);
