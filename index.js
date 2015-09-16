'use strict';

var $fs = require('fs');

var $q = require('q');
var $css = require('css');
var $unCss = require('uncss');
var $globby = require('globby');
var $cssBeautify = require('cssbeautify');

module.exports = buenosUnCss;
module.exports.glob = glob;

function buenosUnCss (htmlFiles, options) {

    return unCss(htmlFiles, options);

}

function glob (htmlGlob, cssGlob) {

    return $q.allSettled([
        _getHtmlFiles(htmlGlob),
        _getCssFiles(cssGlob)
    ]).then(function (result) {

        var htmlFiles = result.shift().value;
        var cssFiles = result.shift().value;

        if (htmlFiles.length === 0) {
            throw 'No HTML files found using glob:\n' + JSON.stringify(htmlGlob, null, 4);
        }
        if (cssFiles.length === 0) {
            throw 'No CSS files found using glob:\n' + JSON.stringify(cssGlob, null, 4);
        }

        // read and concat the cssFiles
        return _readCss(cssFiles)
            .then(function (rawCss) {

                // perform uncss
                var options = {
                    raw: rawCss,
                    report: true,
                    ignoreSheets: [/.*\.css.*/]
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

        deferreds.push($q.nfcall($fs.readFile, file)
            .then(function (source) {

                // validate proper format for each file
                try {
                    $css.parse(source.toString());
                    return source;
                } catch (e) {
                    console.log('Error while parsing css, skipping file: ' + file);
                    console.log(e);
                    throw e;
                }


            }));

    });

    return $q.allSettled(deferreds)
        .then(function (promises) {

            var validatedSources = [];
            promises.forEach(function (promise) {

                if (promise.state === 'fulfilled') {
                    validatedSources.push(promise.value);
                }

            });

            // concat sources and return
            return Buffer.concat(validatedSources).toString();

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

                    // remove pseudos that won't work in the querySelector to prevent false positives
                    selector = _removePseudos(selector);

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

        // sort the selectors, makes it more usable
        report.selectors.all = report.selectors.all.sort();
        report.selectors.used = report.selectors.used.sort();
        report.selectors.unused = report.selectors.unused.sort();

        report.original = $cssBeautify(report.original);

        deferred.resolve(report);

    });

    return deferred.promise;

}

function _removePseudos (selector) {

    // the pseudos that are commented out appear to be working in the querySelector
    var pseudos = [
        ':active',
        ':after',
        ':before',
        ':checked',
        //':disabled',
        ':empty',
        //':enabled',
        //':first-child',
        //':first-of-type',
        ':focus',
        ':hover',
        ':in-range',
        //':invalid',
        //':last-child',
        //':last-of-type',
        //':link',
        //':only-of-type',
        //':only-child',
        //':optional',
        ':out-of-range',
        //':read-only',
        //':read-write',
        //':required',
        //':root',
        ':target',
        //':valid',
        ':visited'
    ];

    pseudos = '(' + pseudos.join('|') + ')';

    var regex = new RegExp(pseudos, 'g');
    return selector.replace(regex,'');

}
