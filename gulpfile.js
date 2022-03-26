import chalk from "chalk";
import gulp from "gulp";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import rimraf from "rimraf";
import ts from 'gulp-typescript';
import {fileURLToPath} from "url";

////////////////////////////////////////////////////////////////////////////////
// Config

const manifestPath = "module.json"
const buildFolder = "build";
const staticPaths = [
  manifestPath,
  "assets"
];

////////////////////////////////////////////////////////////////////////////////
// Startup
const manifest = JSON.parse((await fs.readFile(manifestPath)).toString());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let config, linkDir;
try {
  config = await fs.readJSON("foundryconfig.json");
} catch (e) {
  console.log(chalk.magenta("foundryconfig.json not found - assuming CI"));
}
if (config?.dataPath) {
  linkDir = path.join(config.dataPath, "Data", "modules", manifest.name);
}


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
}


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
  if (!linkDir) {
    throw new Error("linkDir not set");
  }
  console.log(
    chalk.yellow(`Removing build link from ${chalk.blueBright(linkDir)}`),
  );
  return fs.remove(linkDir);
}

/**
 * Link build to foundrydata
 */
export async function link () {
  if (!linkDir) {
    throw new Error("linkDir not set");
  }
  if (!fs.existsSync(linkDir)) {
    console.log(
      chalk.green(`Linking dist to ${chalk.blueBright(linkDir)}`),
    );
    return fs.symlink(path.resolve(buildFolder), linkDir);
  } else {
    console.log(
      chalk.magenta(`${chalk.blueBright(linkDir)} already exists`),
    );
  }
}

const stripInitialv = (subject) => (
  subject.replace(
    /^v(\d+\.\d+\.\d+.*)/i, 
    (_, ...[match]) => match
  )
);

/**
 * Update the manifest in CI
 */
export async function setManifestFromCI () {
  const tag = process.env.CI_COMMIT_TAG;
  // const branch = process.env.CI_COMMIT_BRANCH;
  const path = process.env.CI_PROJECT_PATH;
  const jobName = process.env.CI_JOB_NAME;

  if (!path) {
    console.log(chalk.green("Not on CI, leaving manfest as-is"));
    return;
  }
  
  const version = tag ? stripInitialv(tag) : manifest.version;
  // const ref = tag ? tag : branch ? branch : "main";
  
  manifest.version = version
  manifest.url = `https://gitlab.com/${path}`;
  // manifest.download = `https://gitlab.com/${path}/-/jobs/artifacts/${ref}/raw/package/${manifest.name}.zip?job=${jobName}`;
  // manifest.manifest = `https://gitlab.com/${path}/-/jobs/artifacts/${ref}/raw/${manifestPath}?job=${jobName}`;

  console.log({tag, path, jobName, version, manifest});
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
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
      const zipName = `${manifest.name}.zip`;
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
