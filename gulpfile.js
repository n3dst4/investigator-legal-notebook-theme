import chalk from "chalk";
import gulp from "gulp";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import yargs from "yargs";
import rimraf from "rimraf";
import ts from 'gulp-typescript';
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = yargs.argv;

const srcPath = "src";
const manifestPath = path.join(srcPath, "system.json");


function getManifest () {
  const manifest = fs.readJSONSync(manifestPath);
  return manifest;
}

/********************/
/* BUILD */
/********************/

/**
 * Build TypeScript
 */
var tsProject = ts.createProject('tsconfig.json');
function buildTS () {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('build'));
};


/**
 * Copy static files
 */
async function copyFiles () {
  const staticPaths = [
    "lang",
    "fonts",
    "assets",
    "templates",
    "module.json",
    "system.json",
    "template.json",
    "packs",
    "babele-es",
  ];
  try {
    for (const staticPath of staticPaths) {
      if (fs.existsSync(staticPath)) {
        await fs.copy(
          staticPath,
          path.join("build", staticPath),
        );
      }
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}



/**
 * Watch for changes for each build step
 */
export function watch () {
  gulp.watch(
    ["src/assets", "src/fonts", "src/lang", "src/templates", "src/*.json", "src/babele-es"],
    { ignoreInitial: false },
    copyFiles,
  );
}

/********************/
/* CLEAN */
/********************/

/**
 * Remove built files from `dist` folder
 * while ignoring source files
 */
export function clean () {
  const distPath = path.join(__dirname, "build");

  return new Promise((resolve, reject) => {
    rimraf(distPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/********************/
/* LINK */
/********************/

/**
 * Get the path to link to `dist`
 */
function getLinkDir () {
  const name = require("./src/system.json").name;
  const config = fs.readJSONSync("foundryconfig.json");
  let destDir;

  // work out if we're linking to systems or modules
  if (
    fs.existsSync(path.resolve(".", "dist", "module.json")) ||
    fs.existsSync(path.resolve(".", "src", "module.json"))
  ) {
    destDir = "modules";
  } else if (
    fs.existsSync(path.resolve(".", "dist", "system.json")) ||
    fs.existsSync(path.resolve(".", "src", "system.json"))
  ) {
    destDir = "systems";
  } else {
    throw Error(
      `Could not find ${chalk.blueBright(
        "module.json",
      )} or ${chalk.blueBright("system.json")}`,
    );
  }

  let linkDir;
  if (config.dataPath) {
    if (!fs.existsSync(path.join(config.dataPath, "Data"))) {
      throw Error("User Data path invalid, no Data directory found");
    }
    linkDir = path.join(config.dataPath, "Data", destDir, name);
  } else {
    throw Error("No User Data path defined in foundryconfig.json");
  }

  return linkDir;
}

/**
 * Remove the link to foundrydata
 */
function unlink () {
  const linkDir = getLinkDir();
  console.log(
    chalk.yellow(`Removing build link from ${chalk.blueBright(linkDir)}`),
  );
  return fs.remove(linkDir);
}

/**
 * Link build to foundrydata
 */
function link () {
  const linkDir = getLinkDir();
  if (argv.clean || argv.c) {
    return unlink();
  } else if (!fs.existsSync(linkDir)) {
    console.log(
      chalk.green(`Linking dist to ${chalk.blueBright(linkDir)}`),
    );
    return fs.symlink(path.resolve("./dist"), linkDir);
  }
}

/*********************/
/* PACKAGE */
/*********************/

/**
 * Package build
 */
async function bundlePackage () {
  const manifest = getManifest();

  return new Promise((resolve, reject) => {
    try {
    // Remove the package dir without doing anything else
      if (argv.clean || argv.c) {
        console.log(chalk.yellow("Removing all packaged files"));
        fs.removeSync("package");
        return;
      }

      // Ensure there is a directory to hold all the packaged versions
      fs.ensureDirSync("package");

      // Initialize the zip file
      const zipName = `${manifest.file.name}-v${manifest.file.version}.zip`;
      const zipFile = fs.createWriteStream(path.join("package", zipName));
      const zip = archiver("zip", { zlib: { level: 9 } });

      zipFile.on("close", () => {
        console.log(chalk.green(zip.pointer() + " total bytes"));
        console.log(
          chalk.green(`Zip file ${zipName} has been written`),
        );
        return resolve();
      });

      zip.on("error", (err) => {
        throw err;
      });

      zip.pipe(zipFile);

      // Add the directory with the final code
      zip.directory("build/", manifest.file.name);

      zip.finalize();
    } catch (err) {
      return reject(err);
    }
  });
}


function setProd () {
  process.env.NODE_ENV = "production";
  return Promise.resolve();
}


const buildAll = gulp.parallel(buildTS, copyFiles);

export const build = gulp.series(clean, buildAll);
export default build;
export const packidge = gulp.series([setProd, clean, buildAll, bundlePackage]);
