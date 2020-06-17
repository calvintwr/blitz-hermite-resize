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
    source: DOM Image/DOM Canvas/jQuery/DataURL/File,
    width: 400,
    height: 600
}).then(output => {
    // handle output
}).catch(error => {
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
    source: DOM Image/DOM Canvas/jQuery/DataURL/Javscript #File,
    width: 400,
    height: 600,

    // [optional] jpg, gif, png or raw. when not defined, assumes png.
    outputFormat: 'jpg',

    // [optional] `image`, `canvas`, `data`, `download`, `blob`, or `flie` for Javascript #File.
    // If not entered output is same as input format.
    output: 'data',  

    // [optional] applicable for `image`, `file` or `data` output only
    quality: 0.7,

    // if you want to know how fast blitz resize       
    logPerformance: true/false
}).then(output => {
    // outputs:

    // 'image' -- Image <Object: Image>: This will be the Image DOM, which you can append to your DOM.
    // 'canvas' -- HTML Canvas
    // 'data' -- DataURL <String>: You can attach it to <img src> or just redirect to it to show on browser.
    // 'download' -- <Function>: You need to call this function to run the download.
    // 'blob' -- Blob <Function>: Javascript Blob object
    // 'file' -- File <Object>: Javascript File object


}).catch(err => {
    // handle err
})
```

## Examples
```html
<input type="file" capture="camera" accept="image/*" id="cameraInput" name="cameraInput">
<script>
function readFile(file) {
    var reader = new FileReader();
    reader.onload = readSuccess;

    function readSuccess(evt) {

        // data to data
        var b1 = Blitz.create()
        b1({
            source: evt.target.result,
            width: 400,
            height: 600,
            outputFormat: 'jpg',
            output: 'data',
            quality: 0.7,
            logPerformance: true
        }).then(data => {
            console.log('Resize using event successful')
            // data is a string you can attach to image src.
            var image = new Image()
            image.src = data
            document.getElementByTag('body').append(image)
        }).catch(err => {
            console.log(err)
        })

        // image -> canvas
        var img = new Image()
        img.src = evt.target.result
        var b2 = Object.create(Blitz)
        img.onload = function() {
            b2.resize({
                source: img,
                width: 400,
                height: 600,
                outputFormat: 'jpg',
                output: 'canvas',
                quality: 0.7,
                logPerformance: true
            }, function(canvas) {
                console.log('Resize using img to canvas successful')
                document.getElementByTag('body').append(canvas)
            })
        }

        // data -> image
        var b3 = Object.create(Blitz)
        b3.resize({
            source: evt.target.result,
            width: 400,
            height: 600,
            outputFormat: 'jpg',
            output: 'image',
            quality: 0.7,
            logPerformance: true
        }, function(image) {
            console.log('Resize using data successful')
            // output is just a standard image DOM.
            // you can append it to your DOM.
            document.getElementByTag('body').append(image)
        })


        // canvas -> image
        var img2 = new Image()
        img2.src = evt.target.result
        var b4 = Object.create(Blitz)

        img2.onload = function() {

            var canvas = b4._imageToCanvas(img2)

            b4.resize({
                source: canvas,
                width: 400,
                height: 600,
                outputFormat: 'jpg',
                output: 'image',
                quality: 0.7,
                logPerformance: true
            }, function(output) {
                console.log('Resize using canvas successful')

                // output is just a standard image DOM.
                // you can append it to your DOM.
                document.getElementByTag('body').append(image)
            })
        }

    };
    reader.readAsDataURL(file);
}

document.getElementById('cameraInput').onchange = function(e) {

    // file -> file
    var b5 = Blitz.create()

    b5({
        source: e.srcElement.files[0],
        width: 400,
        height: 600,
        outputFormat: 'jpg',
        quality: 0.7,        
        logPerformance: true
    }).then(download => {
        console.log('Resize using file successful')
        // output is a download function.

        // run some operations

        // then call #download to download the file.
        download()

    }).catch(err => {
        console.log(err)
    })

    readFile(e.srcElement.files[0]);
};
</script>
```
