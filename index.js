/* jshint node: true */
'use strict';

var Promise   = require('ember-cli/lib/ext/promise');
var fs        = require('fs');
var path      = require('path');
var minimatch = require('minimatch');

var chalk     = require('chalk');
var blue      = chalk.blue;
var red       = chalk.red;

var validateConfig = require('./lib/utilities/validate-config');

module.exports = {
  name: 'ember-cli-deploy-manifest',

  createDeployPlugin: function(options) {
    function _generateManifest(distDir, distFiles, filePattern, manifestPath, ui) {
      var filesToInclude = distFiles.filter(minimatch.filter(filePattern, { matchBase: true }));
      filesToInclude.sort();
      var outputPath = path.join(distDir, manifestPath);
      fs.writeFileSync(outputPath, filesToInclude.join('\n'));
      _successMessage(ui, filesToInclude.length);
    }

    function _beginMessage(ui, manifestPath) {
      ui.write(blue('|      '));
      ui.write(blue('- generating manifest at `' + manifestPath + '`\n'));

      return Promise.resolve();
    }

    function _successMessage(ui, count) {
      ui.write(blue('|      '));
      ui.write(blue('- generated manifest including ' + count + ' files ok\n'));
    }

    function _errorMessage(ui, error) {
      ui.write(blue('|      '));
      ui.write(red('- ' + error + '`\n'));

      return Promise.reject(error);
    }

    return {
      name: options.name,

      willDeploy: function(context) {
        var deployment = context.deployment;
        var ui         = deployment.ui;
        var config     = deployment.config[this.name] = deployment.config[this.name] || {};

        return validateConfig(ui, config)
          .then(function() {
            ui.write(blue('|    '));
            ui.writeLine(blue('- config ok'));
          });
      },

      willUpload: function(context) {
        var deployment = context.deployment;
        var ui         = deployment.ui;
        var config     = deployment.config[this.name] || {};

        var filePattern  = config.filePattern;
        var distDir      = context.distDir;
        var distFiles    = context.distFiles || [];
        var manifestPath = config.manifestPath;

        return _beginMessage(ui, manifestPath)
          .then(function() {
            _generateManifest.call(this, distDir, distFiles, filePattern, manifestPath, ui);
            return { manifestPath: manifestPath };
          })
          .catch(_errorMessage.bind(this, ui));
      }
    };
  }
};
