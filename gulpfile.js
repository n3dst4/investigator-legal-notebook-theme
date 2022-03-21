import chalk from "chalk";
import gulp from "gulp";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import yargs from "yargs";
import rimraf from "rimraf";
import ts from 'gulp-typescript';
import {fileURLToPath} from "url";

////////////////////////////////////////////////////////////////////////////////
// Config

const manifestPath = "module.json"
const buildFolder = "build";
const staticPaths = [
  manifestPath,
];

////////////////////////////////////////////////////////////////////////////////
// Startup
const manifest = JSON.parse((await fs.readFile(manifestPath)).toString());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = yargs.argv;
const config = await fs.readJSON("foundryconfig.json");
if (!config.dataPath) {
  throw new Error("No dataPath found in foundryConfig.json");
}
const linkDir = path.join(config.dataPath, "Data", "modules", manifest.name);


/**
 * Remove built files from `build` folder
 * while ignoring source files
 */
export function clean () {
  const distPath = path.join(__dirname, buildFolder);
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

/**
 * Build TypeScript
 */
export function buildCode () {
  var tsProject = ts.createProject('tsconfig.json');
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('build'));
};


/**
 * Copy static files
 */
export async function copyFiles () {
  for (const staticPath of staticPaths) {
    await fs.copy(
      staticPath,
      path.join("build", staticPath),
    );
  }
}


/**
 * Watch for changes for each build step
 */
export function watch () {
  gulp.watch(
    staticPaths,
    { ignoreInitial: false },
    copyFiles,
  );
  gulp.watch(
    ["src", "tsconfig.json"],
    { ignoreInitial: false },
    buildCode,
  );
}


/**
 * Remove the link to foundrydata
 */
export async function unlink () {
  console.log(
    chalk.yellow(`Removing build link from ${chalk.blueBright(linkDir)}`),
  );
  return fs.remove(linkDir);
}

/**
 * Link build to foundrydata
 */
export async function link () {
  if (argv.clean || argv.c) {
    return unlink();
  } else if (!fs.existsSync(linkDir)) {
    console.log(
      chalk.green(`Linking dist to ${chalk.blueBright(linkDir)}`),
    );
    return fs.symlink(path.resolve("./dist"), linkDir);
  }
}


/**
 * Package build
 */
export async function bundlePackage () {
  return new Promise((resolve, reject) => {
    try {
      // Ensure there is a directory to hold all the packaged versions
      fs.ensureDirSync("package");
      // Initialize the zip file
      const zipName = `${manifest.name}-v${manifest.version}.zip`;
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
      zip.directory("build/", manifest.name);
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


const buildAll = gulp.parallel(buildCode, copyFiles);

export const build = gulp.series(clean, buildAll);
export const packidge = gulp.series([setProd, clean, buildAll, bundlePackage]);
export default build;
