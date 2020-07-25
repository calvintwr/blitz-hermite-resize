## This is a complete re-write of viliusle's hermite resize.
![Black with Thunder Icon Basketball Logo-2](https://user-images.githubusercontent.com/6825277/87935398-9fffdb00-cac3-11ea-9daf-0139489853f9.png)

**Blitz is the most versatile, powerful, and fastest way to resize an image. It is fast, non-blocking (does not freeze windows), and async/await/promise compatible.**

**Blitz resizes high resolution DSLR images in a matter of seconds. Precipitously cut upload time by resizing your image on the client-side, yet achieve high quality and performace using Hermite filter.**

# Blitz
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

Precipitously cut image upload time and server loads by doing client-side image resizing. Blitz is non-blocking so you will not experience UI freeze when it is resizing. Advanced scaling options with max or min height/width.

## Full options
```js
blitz({
    source: DOM Image/DOM Canvas/jQuery/DataURL/Javscript #File,
    
    // when only 1 is defined, the other will be scaled proportionally by default.
    width: (number), // optional
    height: (number), // optional

    // if width/height is defined, all max and mins are ignored
    maxWidth: (number),
    maxHeight: (number),
    minWidth: (number),
    minHeight: (number),

    proportional: true (default)/false, // if set to false, resizing will not attempt to maintain proportions

    // [optional] jpg, gif, png or raw. when not defined, assumes png.
    outputFormat: 'jpg',

    // [optional] `image`, `canvas`, `data`, `download`, `blob`, or `flie` for Javascript #File.
    // If not entered output is same as input format.
    output: 'data',  

    // [optional] applicable for `image`, `file` or `data` output only
    quality: 0.7, // between 0 to 1.

    // [optional] if you want to know how fast blitz resize       
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

        // data to data (async/await style)
        var bAwait = Blitz.create()
        try {
            let output = await bAwait({
                source: evt.target.result,

                // image will be resized to strictly 400x600
                // `proportional: true` will be ignored as it cannot be enforced.
                width: 400,
                height: 600,

                outputFormat: 'jpg',
                output: 'data',
                quality: 0.7,
                logPerformance: true,

                proportional: true // this is ignored.
            })
            console.log('Resize using event successful')
            // data is a string you can attach to image src.
            var image = new Image()
            image.src = data
            document.getElementByTag('body').append(image)
        } catch(err) {
            console.log(err)
        }

        // image -> canvas (promise-style)
        var img = new Image()
        img.src = evt.target.result
        
        // using #Object.create and then the #resize method is similar to Blitz.create('callback')
        var bPromise = Blitz.create()
        img.onload = function() {
            bPromise.resize({
                source: img,

                // image will be resized to width 400, and height will be scalled proportionally (by default)
                width: 400,

                outputFormat: 'jpg',
                output: 'canvas',
                quality: 0.7,
                logPerformance: true
            }).then(canvas => {
                console.log('Resize using img to canvas successful')
                document.getElementByTag('body').append(canvas)
            })
        }

        // data -> image (callback-style)
        var bCallback = Object.create(Blitz)
        bCallback.resize({
            source: evt.target.result,

            // image will be scaled to maxWidth of 640, with minHeight of 400
            // if it cannot be constrained, it will break proportionality.
            maxWidth: 640,
            minHeight: 400,

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

    };
    reader.readAsDataURL(file);
}

document.getElementById('cameraInput').onchange = function(e) {

    // file -> file
    var b5 = Blitz.create()

    b5({
        source: e.srcElement.files[0],

        // image will be up or downscaled to always have minHeight of 600
        minHeight: 600,

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

## License

*Blitz* is MIT licensed.