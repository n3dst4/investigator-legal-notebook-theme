import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import rimraf from "rimraf";
import {fileURLToPath} from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { exec }from "child_process";
import chokidar from "chokidar";
import globWithCallback from "glob";

////////////////////////////////////////////////////////////////////////////////
// Config

const manifestName = "module.json"
const srcPath = "src";
const buildPath = "build";
const staticPaths = [
  manifestName,
  "assets"
];
const tsGlobPattern = `${srcPath}/**/*.ts?(x)`;

////////////////////////////////////////////////////////////////////////////////
// Startup
const manifestPath = path.join(srcPath, manifestName);
const manifest = JSON.parse((await fs.readFile(manifestPath)).toString());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let config, linkDir;
try {
  config = await fs.readJSON("foundryconfig.json");
} catch (e) {
  log(chalk.magenta("foundryconfig.json not found - assuming CI"));
}
if (config?.dataPath) {
  const linkRoot = manifestName === "system.json" ? "systems" : "modules";
  linkDir = path.join(config.dataPath, "Data", linkRoot, manifest.name);
}

/// ////////////////////////////////////////////////////////////////////////////
// Utilities

// promisified version of glob
function glob (pattern, options) {
  return new Promise((resolve, reject) => {
    globWithCallback(pattern, options, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

// logging function
const log = console.log.bind(console, chalk.green("[task] "));
// const error = console.log.bind(console, chalk.red("[error] "));

// if subject is a semver string beginning with a v, remove the v
const stripInitialv = (subject) =>
  subject.replace(/^v(\d+\.\d+\.\d+.*)/i, (_, ...[match]) => match);

// given a path in the src folder, map it to the equivalent build folder path
function srcToBuild (inPath) {
  const outPath = path.join(buildPath, path.relative(srcPath, inPath));
  return outPath;
}


/**
 * Remove built files from `build` folder
 * while ignoring source files
 */
/**
 * Remove built files from `build` folder
 * while ignoring source files
 */
async function clean () {
  const distPath = path.join(__dirname, buildPath);
  log("Cleaning...");
  await new Promise((resolve, reject) => {
    rimraf(distPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  log("Done.");
}

/**
 * Build TypeScript
 */
async function buildCode () {
  await new Promise((resolve, reject) => {
    exec("tsc", (error, stdout, stderr) => {
      log(`stdout: ${stdout}`);
      error(`stderr: ${stderr}`);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  })
}


/**
 * Copy static files
 */
async function copyFiles (paths) {
  if (paths === undefined) {
    paths = staticPaths.map((p) => path.join(srcPath, p));
  }
  for (const fromPath of paths) {
    const toPath = srcToBuild(fromPath);
    log("Copying", chalk.cyan(fromPath), "to", chalk.cyan(toPath));
    await fs.copy(fromPath, toPath);
  }
}


/**
 * Watch for changes for each build step
 */
export function watch () {
  chokidar
    .watch(staticPaths.map((x) => path.join(srcPath, x)), { ignoreInitial: true })
    .on("add", (path) => copyFiles([path]))
    .on("change", (path) => copyFiles([path]));
  const tsFiles = await glob(tsGlobPattern);
  chokidar
    .watch(tsFiles, { ignoreInitial: true })
    .on("add", () => buildCode)
    .on("change", () => buildCode);
}


/**
 * Remove the link to foundrydata
 */
async function unlink () {
  if (!linkDir) {
    throw new Error("linkDir not set");
  }
  log(chalk.yellow(`Removing build link from ${chalk.blueBright(linkDir)}`));
  return fs.remove(linkDir);
}

/**
 * Link build to foundrydata
 */
async function link () {
  if (!linkDir) {
    throw new Error("linkDir not set");
  }
  if (!fs.existsSync(linkDir)) {
    log(`Linking ${buildPath} to ${chalk.blueBright(linkDir)}`);
    return fs.symlink(path.resolve(buildPath), linkDir);
  } else {
    log(chalk.magenta(`${chalk.blueBright(linkDir)} already exists`));
  }
}

/**
 * Update the manifest in CI
 */
export async function updateManifestFromCITagPush () {
  const tag = process.env.CI_COMMIT_TAG;
  const path = process.env.CI_PROJECT_PATH;
  if (!tag) {
    throw new Error(`This task should only be run from a CI tag push, but $CI_COMMIT_TAG was empty or undefined`);
  }
  if (stripInitialv(tag) !== manifest.version) {
    throw new Error(`Manifest version (${manifest.version}) does not match tag (${tag})`);
  }
  manifest.download = `${process.env.CI_API_V4_URL}/projects/${encodeURIComponent(path)}/packages/generic/${manifest.name}/${tag}/${manifest.name}.zip`
  console.log({tag, path, manifest});
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
      const zipName = process.env.ZIP_FILE_NAME ?? `${manifest.name}.zip`;
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

async function build () {
  await clean();
  await Promise.all([buildCode, copyFiles]);
} 

async function packidge () {
  await setProd();
  await build();
  await bundlePackage();
}

// yargs turns this into a usable script
yargs(hideBin(process.argv))
  .command(
    "link",
    "Create link to your Foundry install",
    () => {},
    () => link(),
  )
  .command(
    "unlink",
    "Remove link to your Foundry install",
    () => {},
    () => unlink(),
  )
  .command(
    "buildCode",
    "Build Typescript",
    () => {},
    () => buildCode(),
  )
  .command(
    "clean",
    "Remove all generated files",
    () => {},
    () => clean(),
  )
  .command(
    "build",
    "Build everything into output folder",
    () => {},
    () => build(),
  )
  .command(
    "bundlePackage",
    "Create package .zip",
    () => {},
    () => bundlePackage(),
  )
  .command(
    "packidge",
    "Build package file from scratch",
    () => {},
    () => packidge(),
  )
  .command(
    "watch",
    "Build-on-chnage mode",
    () => {},
    () => watch(),
  )
  .command(
    "updateManifestFromCITagPush",
    "",
    () => {},
    () => updateManifestFromCITagPush(),
  )
  .completion()
  .demandCommand(1)
  .parse();

