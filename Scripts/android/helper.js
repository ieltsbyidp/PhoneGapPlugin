var fs = require("fs");
var path = require("path");

function rootBuildGradleExists() {
  var target = path.join("platforms", "android", "build.gradle");
  return fs.existsSync(target);
}

/*
 * Helper function to read the build.gradle that sits at the root of the project
 */
function readRootBuildGradle() {
  var target = path.join("platforms", "android", "build.gradle");
  return fs.readFileSync(target, "utf-8");
}

/*
 * Adds a dependency on 'com.google.gms' and 'com.android.tools.build' if it's not found.
 */
function addDependencies(buildGradle) {
  // find the known line to match
  var match = buildGradle.match(/^(\s*)classpath 'com.android.tools.build(.*)/m);
  var googlePlayDependency = "classpath 'com.google.gms:google-services:4.1.0'"; // Google Play services dependency
  var androidToolsDependency = "classpath 'com.android.tools.build:gradle:8.0.0'"; // Update this version if needed

  if (match) {
    var whitespace = match[1];
    var modifiedLine = match[0] + '\n' + whitespace + googlePlayDependency;
    return buildGradle.replace(/^(\s*)classpath 'com.android.tools.build(.*)/m, modifiedLine);
  } else {
    // If 'com.android.tools.build' isn't found, add it at the top of the dependencies section
    return buildGradle.replace(
      /dependencies {/,
      `dependencies {\n        ${androidToolsDependency}\n        ${googlePlayDependency}`
    );
  }
}

/*
 * Add 'google()' to the repository repo list
 */
function addRepos(buildGradle) {
  var match = buildGradle.match(/^(\s*)jcenter\(\)/m);
  var googlesMavenRepo = "google()"; // Google's Maven repository

  if (match) {
    var whitespace = match[1];
    var modifiedLine = match[0] + '\n' + whitespace + googlesMavenRepo;
    buildGradle = buildGradle.replace(/^(\s*)jcenter\(\)/m, modifiedLine);
  }

  // Add google() to allprojects if it's not already there
  var allProjectsIndex = buildGradle.indexOf('allprojects');
  if (allProjectsIndex > 0) {
    var firstHalfOfFile = buildGradle.substring(0, allProjectsIndex);
    var secondHalfOfFile = buildGradle.substring(allProjectsIndex);
    match = secondHalfOfFile.match(/^(\s*)jcenter\(\)/m);
    if (match) {
      modifiedLine = match[0] + '\n' + googlesMavenRepo;
      secondHalfOfFile = secondHalfOfFile.replace(/^(\s*)jcenter\(\)/m, modifiedLine);
    }
    buildGradle = firstHalfOfFile + secondHalfOfFile;
  }
  return buildGradle;
}

/*
 * Helper function to write to the build.gradle that sits at the root of the project
 */
function writeRootBuildGradle(contents) {
  var target = path.join("platforms", "android", "build.gradle");
  fs.writeFileSync(target, contents);
}

module.exports = {
  modifyRootBuildGradle: function() {
    if (!rootBuildGradleExists()) {
      return;
    }
    var buildGradle = readRootBuildGradle();
    buildGradle = addDependencies(buildGradle);
    buildGradle = addRepos(buildGradle);
    writeRootBuildGradle(buildGradle);
  },

  restoreRootBuildGradle: function() {
    if (!rootBuildGradleExists()) {
      return;
    }
    var buildGradle = readRootBuildGradle();
    buildGradle = buildGradle.replace(/(?:^|\r?\n)(.*)Marketo SDK*?(?=$|\r?\n)/g, '');
    writeRootBuildGradle(buildGradle);
  }
};
