'use strict';

var $buenosUncss = require('..');

$buenosUncss.glob('./test/**/*.html', './test/**/*.css')
    .then(function (report) {
        console.log(JSON.stringify(report, null, 4));
    })
    .done();

$buenosUncss.glob('./test/resources/no-html/**/*.html', './test/resources/no-html/**/*.css')
    .then(function (report) {
        console.log(JSON.stringify(report, null, 4));
    }, function (err) {
        console.log(err);
    })
    .done();

$buenosUncss.glob('./test/resources/no-css/**/*.html', ['./test/resources/no-css/**/*.css'])
    .then(function (report) {
        console.log(JSON.stringify(report, null, 4));
    }, function (err) {
        console.log(err);
    })
    .done();
