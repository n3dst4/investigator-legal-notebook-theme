import { ThemeSeedV1, CssFn } from "investigator-fvtt-types";

const assetPath = "modules/investigator-fvtt-theme-lab-notebook/assets"

const makeLabTheme = (css: CssFn): ThemeSeedV1 =>  {
  return {
    schemaVersion: "v1",
    displayName: "Lab Notebook",
    global: css`
      @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand+SC&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');
    `,
    largeSheetRootStyle: {
      backgroundImage: `url(${assetPath}/wallpaper/scott-webb-UjupleczBOY-unsplash.webp)`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    },
    // smallSheetRootStyle: {
    //   backgroundImage: `url(systems/${systemName}/assets/wallpaper/scott-webb-UjupleczBOY-unsplash.webp)`,
    // },
    bodyFont: "16px 'Patrick Hand SC', sans-serif",
    displayFont: "normal small-caps normal 1.1em 'IM Fell English', serif",
    logo: {
      fontScaleFactor: 24,
      frontTextElementStyle: {
        color: "#000",
        maskImage: `url(${assetPath}/wallpaper/annie-spratt-UR2DMIFuc5c-unsplash.webp)`,
        maskMode: "luminance",
        maskRepeat: "repeat",
        maskSize: "contain",
        textShadow: [
          "0.03em 0.03em 0px #fff",
          // "0.06em 0.06em 0px #000",
          "-0.03em -0.03em 0px #fff",
          // "-0.06em -0.06em 0px #000",
        ].join(", "),
      },
      rearTextElementStyle: {
        display: "none",
      },
      textElementsStyle: {
        transform: "scale(0.6)",
        fontWeight: "bold",
      },
      backdropStyle: {
        backgroundImage: `url(${assetPath}/wallpaper/tailpiece9-768.webp), url(${assetPath}/wallpaper/tailpiece9-768.webp)`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom, top",
        backgroundSize: "19%",
        maskImage: `url(${assetPath}/wallpaper/annie-spratt-UR2DMIFuc5c-unsplash.webp)`,
        maskMode: "luminance",
        maskRepeat: "repeat",
        maskSize: "contain",
        opacity: 0.7,
      },
    },
    colors: {
      accent: "#f00",
      accentContrast: "#fff",
      glow: "#cfffc2",
      wallpaper: "#eee", //
      backgroundSecondary: "#fff6",
      backgroundPrimary: "#fff9",
      backgroundButton: "rgba(0,0,0,0.1)",
      text: "#222",
    },

  };
}

console.log("[Lab Theme] initializing");
CONFIG.Investigator?.installTheme("Lab", makeLabTheme);
