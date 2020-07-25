//name: Blitz Image Resizer
//about: Fast, non-blocking client-side image resize/resample using Hermite filter with JavaScript.
//author: ViliusL
//forkedby: calvintwr
var Blitz = {
    resize: function(opts, callback) {

        if(typeof opts !== 'object') throw Error('You need to provide options for Blitz as a `object`.')

        var mandatory = ['source'];

        for(var i=0; i<mandatory.length; i++) {
            var param = mandatory[i];
            if(typeof opts[param] === 'undefined') {
                throw Error('#resize() is expecting mandatory param `'+ param +'`.');
            }
        }

        if(typeof callback !== 'function') {
            throw Error('#resize() is expecting `callback` to be a function.');
        }

        var sourceElement = this._extract(opts.source);
        var mimeType = this._mimeConverter(opts.outputFormat);
        opts.outputFormat = opts.mimeType = mimeType

        var canvas;
        if (sourceElement.type === 'CANVAS') {
            canvas = sourceElement.source;
        } else if (sourceElement.type === 'IMG') {
            canvas = this._imageToCanvas(sourceElement.source);
        } else if (sourceElement.type === 'DATA') {
            if (!opts.output) opts.output = 'data'
            return this._dataToCanvas(sourceElement.source, opts, callback);
        } else if (sourceElement.type === 'FILE') {
            if (!opts.output) opts.output = 'file'
            return this._fileToCanvas(sourceElement.source, opts, callback);
        }
        if (!canvas) throw Error('Unable to detect source type.')

        var startTime;
        if (opts.logPerformance) startTime = Date.now();

        var originalWidth = canvas.width;
        var originalHeight = canvas.height;

        var resizedDimens = this._heightWidthCalc(
            originalHeight,
            originalWidth,
            opts.height,
            opts.width,
            opts.maxHeight,
            opts.maxWidth,
            opts.minHeight,
            opts.minWidth,
            opts.proportional
        )

        var resizeToWidth = resizedDimens.width
        var resizeToHeight = resizedDimens.height

        if (resizedDimens.width === originalWidth && resizedDimens.height === originalHeight) {
            this._output(null, canvas, opts, resizedDimens, startTime, callback)
        } else {
            var original = canvas.getContext('2d').getImageData(0, 0, originalWidth, originalHeight);
            var resizedImage = canvas.getContext('2d').getImageData(0, 0, resizeToWidth, resizeToHeight);
            canvas.getContext('2d').clearRect(0, 0, originalWidth, originalHeight);

            var worker = new Worker(this._workerBlobURL(opts.filter)); // opts.filter allows other filter algo to be use in future

            worker.onmessage = event => {
                this._output(event, canvas, opts, resizedDimens, startTime, callback)
            }
            worker.postMessage(
                [
                    original.data.buffer,
                    originalWidth,
                    originalHeight,
                    resizeToWidth,
                    resizeToHeight,
                    resizedImage.data.buffer
                ], [
                    original.data.buffer,
                    resizedImage.data.buffer
                ]
            )
        }

    },  
    create: function(kind) {

        if (!kind || kind === 'promise') {
            var descendant = Object.create(this)
            var resize = descendant.resize.bind(descendant)

            function resizePromised(options) {
                return new Promise((resolve, reject) => {
                    try {
                        resize(options, output => {
                            resolve(output)
                        })
                    } catch (err) {
                        reject(err)
                    }
                })
            }
            return resizePromised
        }

        if (kind === 'callback') {
            var descendant = Object.create(this)
            return descendant.resize.bind(descendant)
        }
    },
    _output: function(event, canvas, opts, resizedDimens, startTime, callback){
        let resizeToWidth = resizedDimens.width
        let resizeToHeight = resizedDimens.height

        if (event) {
            var resizedImage = new ImageData(
                new Uint8ClampedArray(event.data.data),
                resizeToWidth,
                resizeToHeight
            )
    
            if (opts.logPerformance) console.log('Resize completed in ' + (Math.round(Date.now() - startTime)/1000) + 's');
    
            canvas.getContext('2d').clearRect(0, 0, resizeToWidth, resizeToHeight);
            canvas.height = resizeToHeight;
            canvas.width = resizeToWidth;
            canvas.getContext('2d').putImageData(resizedImage, 0, 0);
        }

        var output;

        if (opts.output === 'canvas') {
            output = canvas
        } else if (['image', 'data'].indexOf(opts.output) > -1) {
            output = this._canvasToImageOrData(canvas, opts.mimeType, opts.quality, opts.output)
        } else if (opts.output === 'file') {
            output = this._canvasToFile(canvas, opts.mimeType, opts.quality, opts.output)
        } else if (opts.output === 'blob') {
            output = this._canvasToBlob(canvas, opts.mimeType, opts.quality, opts.output)
        } else if (opts.output === 'download') {
            output = this._download(this, canvas, opts)
        } else if (typeof opts.output === 'undefined') {
            // when not defined, assume whatever element type is the input, is the desired output
            var outputFormat;
            if(sourceElement.type === 'DATA') {
                outputFormat = 'data';
            } else if(sourceElement.type === 'IMG') {
                outputFormat = 'image';
            }
            if(outputFormat) {
                return output = this._canvasToImageOrData(canvas, opts.mimeType, opts.quality, outputFormat)
            } else {
                // else can only be canvas
                output = canvas;
            }

        } else {
            throw Error('`output` is not valid.');
        }
        if (typeof callback === 'function') return callback(output)
        return output
    },
    _heightWidthCalc: function(imgH, imgW, resizeToH, resizeToW, maxH, maxW, minH, minW, proportional) {

        // set to original image size.
        let resizeTo = {
            height: imgH,
            width: imgW
        }

        // if both height or width are supplied.
        if (resizeToH && resizeToW ) {
            // warnings if maxH or maxW were supplied
            if (maxH || maxW || minH || minH) console.warn('Warn: `min/maxHeight` or `min/maxWidth` are ignored when `height` and/or `width` are supplied.')
            if (proportional) console.warn('Warn: `proportional` is ignored when both `height` and `width` are provided.')
            return {
                height: resizeToH,
                width: resizeToW
            }
        }

        //pass this point, proportional is set to "defaulted true"
        //this differentiates from `true`, which is when it is defined by users.
        if (proportional === undefined || proportional === null) proportional = "defaulted true"

        // if width is supplied
        if (resizeToW) {
            if (maxH || maxW || minH || minH) console.warn('Warn: `min/maxHeight` or `min/maxWidth` are ignored when `height` and/or `width` are supplied.')
            return {
                width: resizeToW,
                height: proportional ? this._scale(imgW, imgH, resizeToW) : imgH
            }
        }

        // if height is supplied
        if (resizeToH) {
            if (maxH || maxW || minH || minH) console.warn('Warn: `min/maxHeight` or `min/maxWidth` are ignored when `height` and/or `width` are supplied.')
            return {
                height: resizeToH,
                width: proportional ? this._scale(imgH, imgW, resizeToH) : imgW
            }
        }

        let errors = []
        if (minH && maxH && minH > maxH) errors.push('`minHeight` cannot be larger than `maxHeight.')
        if (minW && maxW && minW > maxW) errors.push('`minWidth` cannot be larger than `maxWidth.')
        if (errors.length > 0) throw Error(errors.join(' '))

        // if both maxWidth and maxHeight are supplied
        if (maxW && maxH) {

            // if both maxH and maxW are smaller.
            if (maxW < imgW && maxH < imgH) {

                if (proportional === false) {
                    return {
                        width: maxW,
                        height: maxH
                    }
                }

                // scale using either and see which produces a smaller image
                let scaledbyMaxW = {
                    width: maxW,
                    height: this._scale(imgW, imgH, maxW)
                }

                let scaledbyMaxH = {
                    width: this._scale(imgH, imgW, maxH),
                    height: maxH
                }

                let maxWidthIsSmaller = (scaledbyMaxW.width * scaledbyMaxW.height) < (scaledbyMaxH.width * scaledbyMaxH.height)

                if (maxWidthIsSmaller) {
                    // we want to check it against minH for diametrically opposed constrains.
                    return _enforceMinMaxLayer(scaledbyMaxW, { minH }, proportional)
                }
                return _enforceMinMaxLayer(scaledbyMaxH, { minW }, proportional)
            }

        }

        // if ONLY maxWidth is supplied and it is smaller than imgW
        if (maxW && maxW < imgW) {
            let scaled = {
                width: maxW,
                height: proportional ? this._scale(imgW, imgH, maxW) : imgH
            }
            return _enforceMinMaxLayer(scaled, { minH }, proportional)
        }

        // if ONLY maxHeight is supplied and it is smaller than imgH
        if (maxH && maxH < imgH) {
            let scaled = {
                width: proportional ? this._scale(imgH, imgW, maxH) : imgW,
                height: maxH
            }
            return _enforceMinMaxLayer(scaled, { minW }, proportional)
        }

        // if both minWidth and minHeight are supplied
        if (minW && minH) {

            // if both minH and minW are larger.
            if (minW > imgW && minH > imgH) {

                if (proportional === false) {
                    return {
                        width: minW,
                        height: minH
                    }
                }

                // scale using either and see which produces a larger image
                let scaledbyMinW = {
                    width: minW,
                    height: this._scale(imgW, imgH, minW)
                }

                let scaledbyMinH = {
                    width: this._scale(imgH, imgW, minH),
                    height: minH
                }

                let minWidthIsLarger = (scaledbyMinW.width * scaledbyMinW.height) > (scaledbyMinH.width * scaledbyMinH.height)

                if (minWidthIsLarger) {
                    // we want to check it against maxH for diametrically opposed constrains.
                    return _enforceMinMaxLayer(scaledbyMinW, { maxH }, proportional)
                }
                return _enforceMinMaxLayer(scaledbyMinH, { maxW }, proportional)
            }

        }

        // if ONLY minWidth is supplied and it is larger than imgW
        if (minW && minW > imgW) {
            let scaled = {
                width: minW,
                height: proportional ? this._scale(imgW, imgH, minW) : imgH
            }
            return _enforceMinMaxLayer(scaled, { maxH }, proportional)
        }

        // if ONLY minHeight is supplied and it is larger than imgH
        if (minH && minH > imgH) {
            let scaled = {
                width: proportional ? this._scale(imgH, imgW, minH) : imgW,
                height: minH
            }
            return _enforceMinMaxLayer(scaled, { maxW }, proportional)
        }

        // nothing is the limiting factor, or nothing is suppled
        return resizeTo

        // if user wants it to be proportional
        // but also defined potentially diametrically opposing min/max
        function _enforceMinMaxLayer(scaled, minMax, proportional) {

            let { minH, minW, maxH, maxW } = minMax

            // we only warn if user deliberately sets proportional to true.
            let warn = 'Warn: Unable to maintain image proportionality.'

            // when scaled by maxWidth, if image height is smaller than minHeight
            if (minH) {
                if (scaled.height < minH) {
                    if (proportional === true) console.warn(`${warn} Enforcing minHeight of ${minH} as scaling image to maxWidth of ${scaled.width} gives scaled height of ${scaled.height}.`)
                    return {
                        height: minH,
                        width: scaled.width
                    }
                }
                return scaled
            }

            // when scaled by maxHeight, if image width is smaller than minWidth
            if (minW) {
                if (scaled.width < minW) {
                    if (proportional === true) console.warn(`${warn} Enforcing minWidth of ${minW} as scaling image to maxHeight of ${scaled.height} gives scaled width of ${scaled.width}.`)
                    return {
                        height: scaled.height,
                        width: minW
                    }
                }
                return scaled
            }

            // when scaled by minWidth, if image height is larger than maxHeight
            if (maxH) {
                if (scaled.height > maxH) {
                    if (proportional === true) console.warn(`${warn} Enforcing maxHeight of ${maxH} as scaling image to minWidth of ${scaled.width} gives scaled height of ${scaled.height}.`)
                    return {
                        height: maxH,
                        width: scaled.width
                    }
                }
                return scaled
            }

            // when scaled by minHeight, if image width is larger than maxWidth
            if (maxW) {
                if (scaled.width > maxW) {
                    if (proportional === true) console.warn(`${warn} Enforcing maxWidth of ${maxW} as scaling image to minHeight of ${scaled.height} gives scaled width of ${scaled.width}.`)
                    return {
                        height: scaled.height,
                        width: maxW
                    }
                }
                return scaled
            }
            return scaled
        }

    },
    _scale: function(dimen1, dimen2, resizedDimen1) {
        return Math.round( resizedDimen1 / (dimen1/dimen2) )
    },
    _extract: function(source) {
        if (source instanceof File) {
            // File
            return {
                source: source,
                type: 'FILE'
            }
        } else if (typeof source === 'string' && source.indexOf('data') === 0) {
            // dataBlob
            return {
                source: source,
                type: 'DATA'
            }
        } else if (source.tagName) {
            // getElementById sources will pass this
            return {
                source: source,
                type: source.tagName
            }
        } else if (source[0].tagName) {
            return {
                source: source[0],
                type: source[0].tagName
            }
        }

        throw Error('`source` element to be invalid.');
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
    _dataToCanvas: function(data, opts, callback) {

        // create an off-screen image
        var image = new Image();

        image.src = data;
        image.onload = () => {
            // create an off-screen canvas
            var c = document.createElement('canvas');
            var context = c.getContext('2d');

            c.height = image.height;
            c.width = image.width;
            context.drawImage(image, 0, 0, image.width, image.height);

            opts.output = opts.output ? opts.output : 'data';
            opts.source = c;

            this.resize(opts, callback);
        }

    },
    _fileToCanvas: function(file, opts, callback) {
        var reader = new FileReader();
        reader.onload = event => {
            opts.source = event.target.result
            if (!opts.output) opts.output = 'file'
            this.resize(opts, callback)
        }
        reader.readAsDataURL(file);
    },
    _canvasToImageOrData: function(canvas, mimeType, quality, output) {
        var data = canvas.toDataURL(mimeType, quality);
        var image;
        if (output === 'data') {
            image = data
        } else {
            var image = new Image();
            image.src = canvas.toDataURL(mimeType, quality);
        }
        return image;
    },
    _canvasToBlob: function(canvas, mimeType, quality, output) {
        // safari does not support canvas #toBlob, so need to convert from dataURI
        var data = this._canvasToImageOrData(canvas, mimeType, quality, 'data')
        var blob = this._dataURItoBlob(data)
        return blob
    },
    _canvasToFile: function(canvas, mimeType, quality, output) {
        var blob = this._canvasToBlob(canvas, mimeType, quality)
        return new File([blob], 'resized', { type: mimeType, lastModified: Date.now() })
    },
    _dataURItoBlob: function(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0) {
            byteString = atob(dataURI.split(',')[1]);
        } else {
            byteString = unescape(dataURI.split(',')[1]);
        }
        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ia], {type:mimeString});
    },
    _mimeConverter: function(format, reversed) {

        // if undefined, assume no compression.
        if (typeof format === 'undefined') return 'image/png';

        var formats = [
            'raw',
            'png',
            'jpg',
            'gif',
            'image/raw',
            'image/png',
            'image/jpeg',
            'image/gif',
        ];
        
        var index = formats.indexOf(format);

        if (index === -1) throw Error('mimeType can only be `raw`, `png`, `jpg` or `gif`');

        if (index === 0 || index === 1) return 'image/png';
        if (index === 2) return 'image/jpeg';
        if (index === 3) return 'image/gif';

        return format
    },
    _download: function(self, canvas, opts) {
        return function() {
            var link = document.createElement('a');
            link.href = self._canvasToImageOrData(canvas, opts.mimeType, opts.quality, 'data');
            link.download = opts.mimeType === 'image/jpeg' ? 'resized.jpg' : 'resized';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },
    _workerBlobURL: function(filter) {

        if (filter) filter = this['_filter_' + filter]
        if (!filter) filter = this['_filter_hermite']

        var _workerTaskString = this._workerTaskString(filter)

        return window.URL.createObjectURL(new Blob(
            [ _workerTaskString ],
            {type: 'application/javascript'}
        ))
    },
    _workerTaskString: function(filter) {
        var task = ''
        task += '('
        task += 'function () {';
        task += '    onmessage = function (event) {';
        task += '        var filter = ';
        task += filter.toString();
        task += '        ;var resized = filter(event)';
        task += '        ;postMessage({data: resized }, [ resized ]);';
        task += '    };';
        task += '}';
        task += ')()'
        return task
    },
    addFilter: function(filter) {
        let name = `_filter_${filter.name}`
        if (this[name]) throw Error(`Filter name already exist for ${filter.name}. Please use another name.`)
        this[name] = filter.filter
        return this
    }
};

module.exports = Blitz
exports = module.exports
