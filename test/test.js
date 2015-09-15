'use strict';

var $buenosUncss = require('..');

$buenosUncss.glob('./test/**/*.html', './test/**/*.css')
    .then(function (report) {
        console.log(JSON.stringify(report, null, 4));
    })
    .done();
