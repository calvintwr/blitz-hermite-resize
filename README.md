# Blitz

Fast, non-blocking, promise-styled client-side image resize/resample using Hermite filter with JavaScript.

## Installation

```
npm install blitz-resize --save
```

## Usage

```js
const blitz = Blitz.create()

/* Promise */
blitz({
    source: DOM Image/DOM Canvas/jQuery/DataURL/FileReader Event,
    width: 400,
    height: 600
}).then(output => {
    // handle output
})catch(error => {
    // handle error
})

/* Await */
let resized = await blizt({...})

/* Old school callback */
const blitz = Blitz.create('callback')
blitz({...}, function(output) {
    // run your callback.
})

```

## Why use Blitz

Precipitously cut image upload time and server loads by doing client-side image resizing. Blitz is non-blocking so you will not experience UI freeze when it is resizing.


## Full options
```js
blitz({
    source: DOM Image/DOM Canvas/jQuery/DataURL/FileReader Event,
    width: 400,
    height: 600,

    // [optional] jpg, gif, png or raw. when not defined, assumes png.
    outputFormat: 'jpg',

    // [optional] `data`, `image` or `canvas`. If not entered output is same as input format.
    output: 'data',  

    // [optional] applicable for `image` or `data` output only
    quality: 0.7,

    // if you want to know how fast blitz resize       
    logPerformance: true/false
})
```
