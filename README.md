# buenos-uncss

Load up HTML files, load up CSS files, and find out which CSS selectors are not hitting anything. 

## Installing

```bash
$ npm install --save-dev buenos-uncss
```

## Using

```javascript
var $buenosUncss = require('buenos-uncss');

var htmlGlob = './**/*.html';
var cssGlob = './**/*.css';

$buenosUncss.glob(htmlGlob, cssGlob)
    .then(function (report) {

    });

```

Basically, `$buenosUncss.glob` takes a glob of html files and a glob of css files. 
It uses [`globby`](//npmjs.com/package/globby) so check that out in terms of glob options.
 
It returns a `promise`, from [`q`](//npmjs.com/package/q). Bind on the promise with `.then()` and stuff in a callback function to get the report.
 
The `report` is an object much like returned by [`uncss`](//npmjs.com/package/uncss) but a bit more usable. Or at least I think so. It is formatted like so:

```
{
    // css string of all rendered CSS combined
    original: '', 
    
    selectors: {
        // a list of all selectors, includes pseudo's, unmodified from uncss
        all: [],
        
        // another list of selectors, appears to have cleared some pseudo's.
        // honestly I cannot tell you what it contains. also unmodified from uncss
        used: [],
        
        // list of unused selectors! find these in your CSS and remove them.
        // note that pseudo classes may have been removed! see below.
        unused" []
    }
}
```

### Pseudo classes

Not every CSS selector that contains a pseudo class is a valid selector for `document.querySelector`, as a result some pseudo classes are removed from the selectors. This is done so that the selector is updated to find the un-pseudo-classed version of the selector, which generally gives a good indication. 

Example, `:after`. Not a valid selector for the querySelector, but remove the pseudo and BAM, it hits the element you're targeting. Nice.

### Errors

In case you write crappy CSS it'll log an error to the console but continue functionality with all the other files that are properly written. The reason for file exclusion is that the files are actually concatenated. As a result, the file appended to the bundle after a syntactically flawed CSS file may actually sort of make it valid again. See here:

```css
/* syntaxerror.css, last selector .booger is incomplete */

p { color: red }
.booger 
```

```css
/* proper.css, nothing wrong here */

.dingles { color: blue; }
```

```css
/* d result, .dingles is now appended to .booger, messing up the result */

p { color: red }
.booger .dingles { color: blue; }
```
