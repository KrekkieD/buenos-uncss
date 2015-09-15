'use strict';

var $fs = require('fs');

var $q = require('q');
var $css = require('css');
var $unCss = require('uncss');
var $globby = require('globby');

module.exports = buenosUnCss;
module.exports.glob = glob;


function buenosUnCss (htmlFiles, options) {

    return unCss(htmlFiles, options);

}

function glob (htmlGlob, cssGlob) {

    return $q.all([
        _getHtmlFiles(htmlGlob),
        _getCssFiles(cssGlob)
    ]).then(function (result) {

        var htmlFiles = result.shift();
        var cssFiles = result.shift();

        // read and concat the cssFiles
        return _readCss(cssFiles)
            .then(function (rawCss) {

                // perform uncss
                var options = {
                    raw: rawCss,
                    report: true,
                    ignoreSheets: [/.*\*\.css.*/]
                };

                return unCss(htmlFiles, options);

            });

    });

}

function _getHtmlFiles (htmlGlob) {

    return $globby(htmlGlob);

}

function _getCssFiles (cssGlob) {

    return $globby(cssGlob);

}

function _readCss (files) {

    var deferreds = [];

    files.forEach(function (file) {

        deferreds.push($q.nfcall($fs.readFile, file));

    });

    return $q.all(deferreds)
        .then(function (sources) {

            // concat sources and return
            return Buffer.concat(sources).toString();

        });

}

function unCss (htmlFiles, options) {

    var deferred = $q.defer();

    $unCss(htmlFiles, options, function (err, output, report) {

        if (err) {
            throw err;
        }

        // attempt to extract original selectors
        var parsedCss = $css.parse(report.original);

        var allUniqueSelectors = [];

        parsedCss.stylesheet.rules.forEach(function (rule) {

            if (rule.selectors && rule.selectors.length) {
                rule.selectors.forEach(function (selector) {
                    if (allUniqueSelectors.indexOf(selector) === -1) {
                        allUniqueSelectors.push(selector);
                    }
                });
            }

        });


        // parse
        var usedUniqueSelectors = [];
        report.selectors.used.forEach(function (selector) {
            if (usedUniqueSelectors.indexOf(selector) === -1) {
                usedUniqueSelectors.push(selector);
            }
        });

        // match the used against the unused
        var remainingUniqueSelectors = [];
        allUniqueSelectors.forEach(function (selector) {

            if (usedUniqueSelectors.indexOf(selector) === -1) {
                remainingUniqueSelectors.push(selector);
            }

        });

        report.selectors.unused = remainingUniqueSelectors;

        deferred.resolve(report);

    });

    return deferred.promise;

}
