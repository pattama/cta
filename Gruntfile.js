'use strict';

// require('load-grunt-tasks')(grunt);
const eslintformat = require('./lib/eslintformat');
const _ = require('lodash');
const config = require('./config');
const tools = require('./lib/tools');
const path = require('path');
const reporter = require('./lib/reporter');
const data = {};

global.testData = {};

const base = config.sources;
const mochaTest = {};
const eslintTargets = [];
data.projects = tools.explore(config.sources);
data.projects.forEach((dir) => {
  const testDir = base + path.sep + dir + path.sep + 'test';
  if (tools.isDir(testDir)) {
    const src = testDir + path.sep + '**' + path.sep + '*.js';
    mochaTest[dir] = {
      options: {
        reporter: reporter,
        project: dir,
        clearRequireCache: true,
        timeout: 10000,
      },
      src: [src],
    };
  }
  eslintTargets.push(path.join(base, dir, 'test'));
  eslintTargets.push(path.join(base, dir, 'lib'));
});
// const keys = Object.keys(result).sort();
// console.log(`Testing ${keys.length} projects:`);
// console.log(keys);
// target specific project
// return {'cta-flowcontrol': result['cta-flowcontrol']};

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.initConfig({
    mochaTest: mochaTest,
    eslint: {
      options: {
        format: eslintformat,
      },
      target: eslintTargets.slice(0, 1),
    },
  });
  grunt.registerTask('testResult', '', function() {
    const done = this.async();
    setTimeout(function() {
      grunt.log.writeln('# --------------------------------------------------------------- #');
      grunt.log.writeln('# Summary:');
      grunt.log.writeln('# --------------------------------------------------------------- #');
      for (const key in global.testData) {
        if (!global.testData.hasOwnProperty(key)) {
          continue;
        }
        const o = global.testData[key];
        grunt.log.writeln(`${key}: total: ${o.total}, passed: ${o.passed}, failed: ${o.failed}`);
      }
      grunt.log.writeln('# --------------------------------------------------------------- #');
      grunt.log.error('# Failures:');
      grunt.log.writeln('# --------------------------------------------------------------- #');
      const skipped = _.difference(data.projects, Object.keys(global.testData));
      if (skipped.length) {
        grunt.log.error('Skipped tests (see above logs for reasons): ' + skipped.join(', '));
      }
      for (const key in global.testData) {
        if (!global.testData.hasOwnProperty(key)) {
          continue;
        }
        const o = global.testData[key];
        o.failures.forEach(function(failure) {
          grunt.log.error(`${key}: ${failure}`);
        });
      }
      grunt.log.writeln('# --------------------------------------------------------------- #');
      done();
    }, 1000);
  });
  grunt.registerTask('test', ['mochaTest', 'testResult']);
  grunt.registerTask('lint', ['eslint']);
};
