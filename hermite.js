//name: Hermite resize
//about: Fast image resize/resample using Hermite filter with JavaScript.
//author: ViliusL
//forkedby: calvintwr
var Hermite = {
    init: function(workerPath) {
        var copy = Object.create(this);
        if (!workerPath) throw new Error('Fail to provide worker\'s path when initializing.');
        copy._workerPath = workerPath;
        copy.init = undefined;
        return copy;
    },
    resize: function(obj, callback) {
        var self = this;

        var mandatory = ['source', 'width', 'height'];

        for(var i=0; i<mandatory.length; i++) {
            var param = mandatory[i];
            if(typeof obj[param] === 'undefined') {
                throw new Error('#resize() is expecting mandatory param `'+ param +'`.');
            }

        }

        if(typeof callback !== 'function') {
            throw new Error('#resize() is expecting `callback` to be a function.');
        }

        var sourceElement = this._extract(obj.source);
        var mimeType = this._mimeConverter(obj.format);
        var canvas = (sourceElement[1] === 'CANVAS') ? sourceElement[0] : this._imageToCanvas(sourceElement[0]);

        var startTime = Date.now();

        var originalWidth = canvas.width;
        var originalHeight = canvas.height;
        var resizeToWidth = Math.round(obj.width);
        var resizeToHeight = Math.round(obj.height);

        var original = canvas.getContext('2d').getImageData(0, 0, originalWidth, originalHeight);
        var resizedImage = canvas.getContext('2d').getImageData(0, 0, resizeToWidth, resizeToHeight);
        canvas.getContext('2d').clearRect(0, 0, originalWidth, originalHeight);

        var worker = new Worker(self._workerPath);

        worker.onmessage = function(event){

            resizedImage = event.data.data;    

            console.log('Hermite resize completed in ' + (Math.round(Date.now() - startTime)/1000) + 's');   
            canvas.getContext('2d').clearRect(0, 0, resizeToWidth, resizeToHeight);
            canvas.height = resizeToHeight;
            canvas.width = resizeToWidth;
            canvas.getContext('2d').putImageData(resizedImage, 0, 0);

            if (obj.output === 'canvas') {
                return callback(canvas);
            } else if (obj.output === 'image') {
                _makeIntoImage(self._canvas, self._mimeType, self._outputImageQuality, callback);   
            } else if (typeof obj.output === 'undefined') {
                // when not defined, assume whatever element type is the input, is the desired output
                if(sourceElement[1] === 'IMG') return callback( self._canvasToImage(canvas, obj.mimeType, obj.quality) );
                return callback(canvas);
            } else {
                throw new Error('`output` is not valid.');
            }

        };
        worker.postMessage([original, originalWidth, originalHeight, resizeToWidth, resizeToHeight, resizedImage]);

    },
    _extract: function(source) {

        var results;

        if (source.tagName) {
            // getElementById sources will pass this
            results = [source, source.tagName];
        } else if (source[0].tagName) {
            results = [source[0], source[0].tagName];
        } else {
            throw new Error('#resize() found `source` element to be invalid.');
        }

        if (['CANVAS','IMG'].indexOf(results[1]) === -1) throw new Error('#resize() expects element type of `img` or `canvas`.');

        return results;
    },
    _imageToCanvas: function(image) {

        // create a off-screen canvas
        var c = document.createElement('canvas');
        var context = c.getContext('2d');

        c.height = image.height;
        c.width = image.width;
        context.drawImage(image, 0, 0, image.width, image.height);

        return c;

    },
    _canvasToImage: function(canvas, mimeType, quality, callback) {
        var image = new Image();
        image.src = canvas.toDataURL(mimeType, quality);
        return image;
    },
    _mimeConverter: function(format) {

        // if undefined, assume no compression.
        if (typeof format === 'undefined') return 'image/png';

        var formats = ['raw', 'png', 'jpg', 'gif'];
        var index = formats.indexOf(format);

        if (index === -1) throw new Error('#inputImage() outputType can only be `raw`, `png`, `jpg` or `gif`');

        if (index === 0 || index === 1) return 'image/png';
        if (index === 2) return 'image/jpg';
        if (index === 3) return 'image/gif';

        throw new Error('#_mimeConverter fell through all cases!');
    }
};

