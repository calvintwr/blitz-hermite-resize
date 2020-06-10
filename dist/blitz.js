(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Blitz = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//name: Blitz Image Resizer
//about: Fast, non-blocking client-side image resize/resample using Hermite filter with JavaScript.
//author: ViliusL
//forkedby: calvintwr
var Blitz = {
  resize: function resize(obj, callback) {
    if (_typeof(obj) !== 'object') throw Error('You need to provide options for Blitz as a `object`.');
    var self = this;
    var mandatory = ['source', 'width', 'height'];

    for (var i = 0; i < mandatory.length; i++) {
      var param = mandatory[i];

      if (typeof obj[param] === 'undefined') {
        throw Error('#resize() is expecting mandatory param `' + param + '`.');
      }
    }

    if (typeof callback !== 'function') {
      throw Error('#resize() is expecting `callback` to be a function.');
    }

    var sourceElement = this._extract(obj.source);

    var mimeType = this._mimeConverter(obj.outputFormat);

    obj.outputFormat = obj.mimeType = mimeType;
    var canvas;

    if (sourceElement.type === 'CANVAS') {
      canvas = sourceElement.source;
    } else if (sourceElement.type === 'IMG') {
      canvas = this._imageToCanvas(sourceElement.source);
    } else if (sourceElement.type === 'DATA') {
      if (!obj.output) obj.output = 'data';
      return this._dataToCanvas(sourceElement.source, obj, callback);
    } else if (sourceElement.type === 'FILE') {
      if (!obj.output) obj.output = 'file';
      return this._fileToCanvas(sourceElement.source, obj, callback);
    }

    if (!canvas) throw Error('Unable to detect source type.');
    var startTime;
    if (obj.logPerformance) startTime = Date.now();
    var originalWidth = canvas.width;
    var originalHeight = canvas.height;
    var resizeToWidth = Math.round(obj.width);
    var resizeToHeight = Math.round(obj.height);
    var original = canvas.getContext('2d').getImageData(0, 0, originalWidth, originalHeight);
    var resizedImage = canvas.getContext('2d').getImageData(0, 0, resizeToWidth, resizeToHeight);
    canvas.getContext('2d').clearRect(0, 0, originalWidth, originalHeight);
    var worker = new Worker(this._workerBlobURL(obj.filter)); // obj.filter allows other filter algo to be use in future

    worker.onmessage = function (event) {
      var resizedImage = event.data.data;
      if (obj.logPerformance) console.log('Resize completed in ' + Math.round(Date.now() - startTime) / 1000 + 's');
      canvas.getContext('2d').clearRect(0, 0, resizeToWidth, resizeToHeight);
      canvas.height = resizeToHeight;
      canvas.width = resizeToWidth;
      canvas.getContext('2d').putImageData(resizedImage, 0, 0);
      var output;

      if (obj.output === 'canvas') {
        output = canvas;
      } else if (['image', 'data'].indexOf(obj.output) > -1) {
        output = self._canvasToImageOrData(canvas, obj.mimeType, obj.quality, obj.output);
      } else if (obj.output === 'file') {
        output = self._canvasToFile(canvas, obj.mimeType, obj.quality, obj.output);
      } else if (obj.output === 'blob') {
        output = self._canvasToBlob(canvas, obj.mimeType, obj.quality, obj.output);
      } else if (obj.output === 'download') {
        output = self._download(self, canvas, obj);
      } else if (typeof obj.output === 'undefined') {
        // when not defined, assume whatever element type is the input, is the desired output
        var outputFormat;

        if (sourceElement.type === 'DATA') {
          outputFormat = 'data';
        } else if (sourceElement.type === 'IMG') {
          outputFormat = 'image';
        }

        if (outputFormat) {
          return output = self._canvasToImageOrData(canvas, obj.mimeType, obj.quality, outputFormat);
        } else {
          // else can only be canvas
          output = canvas;
        }
      } else {
        throw Error('`output` is not valid.');
      }

      callback(output);
    };

    worker.postMessage([original, originalWidth, originalHeight, resizeToWidth, resizeToHeight, resizedImage]);
  },
  create: function create(kind) {
    if (!kind || kind === 'promise') {
      var resizePromised = function resizePromised(options) {
        return new Promise(function (resolve, reject) {
          try {
            resize(options, function (output) {
              resolve(output);
            });
          } catch (err) {
            reject(err);
          }
        });
      };

      var descendant = Object.create(this);
      var resize = descendant.resize.bind(descendant);
      return resizePromised;
    }

    if (kind === 'callback') {
      var descendant = Object.create(this);
      return descendant.resize.bind(descendant);
    }
  },
  _extract: function _extract(source) {
    if (source instanceof File) {
      // File
      return {
        source: source,
        type: 'FILE'
      };
    } else if (typeof source === 'string' && source.indexOf('data') === 0) {
      // dataBlob
      return {
        source: source,
        type: 'DATA'
      };
    } else if (source.tagName) {
      // getElementById sources will pass this
      return {
        source: source,
        type: source.tagName
      };
    } else if (source[0].tagName) {
      return {
        source: source[0],
        type: source[0].tagName
      };
    }

    throw Error('#resize() found `source` element to be invalid.');
  },
  _imageToCanvas: function _imageToCanvas(image) {
    // create a off-screen canvas
    var c = document.createElement('canvas');
    var context = c.getContext('2d');
    c.height = image.height;
    c.width = image.width;
    context.drawImage(image, 0, 0, image.width, image.height);
    return c;
  },
  _dataToCanvas: function _dataToCanvas(data, obj, callback) {
    // create an off-screen image
    var image = new Image();
    var self = this;
    image.src = data;

    image.onload = function () {
      // create an off-screen canvas
      var c = document.createElement('canvas');
      var context = c.getContext('2d');
      c.height = image.height;
      c.width = image.width;
      context.drawImage(image, 0, 0, image.width, image.height);
      obj.output = obj.output ? obj.output : 'data';
      obj.source = c;
      self.resize(obj, callback);
    };
  },
  _fileToCanvas: function _fileToCanvas(file, obj, callback) {
    var self = this;
    var reader = new FileReader();
    reader.onload = readSuccess;

    function readSuccess(event) {
      obj.source = event.target.result;
      if (!obj.output) obj.output = 'file';
      self.resize(obj, callback);
    }

    reader.readAsDataURL(file);
  },
  _canvasToImageOrData: function _canvasToImageOrData(canvas, mimeType, quality, output) {
    var data = canvas.toDataURL(mimeType, quality);
    var image;

    if (output === 'data') {
      image = data;
    } else {
      var image = new Image();
      image.src = canvas.toDataURL(mimeType, quality);
    }

    return image;
  },
  _canvasToBlob: function _canvasToBlob(canvas, mimeType, quality, output) {
    // safari does not support canvas #toBlob, so need to convert from dataURI
    var data = this._canvasToImageOrData(canvas, mimeType, quality, 'data');

    var blob = this._dataURItoBlob(data);

    return blob;
  },
  _canvasToFile: function _canvasToFile(canvas, mimeType, quality, output) {
    console.log(mimeType);

    var blob = this._canvasToBlob(canvas, mimeType, quality);

    return new File([blob], 'resized', {
      type: mimeType,
      lastModified: Date.now()
    });
  },
  _dataURItoBlob: function _dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;

    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    } else {
      byteString = unescape(dataURI.split(',')[1]);
    } // separate out the mime component


    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]; // write the bytes of the string to a typed array

    var ia = new Uint8Array(byteString.length);

    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {
      type: mimeString
    });
  },
  _mimeConverter: function _mimeConverter(format) {
    // if undefined, assume no compression.
    if (typeof format === 'undefined') return 'image/png';
    var formats = ['raw', 'png', 'jpg', 'gif', 'image/raw', 'image/png', 'image/jpg', 'image/gif'];
    var index = formats.indexOf(format);
    if (index === -1) throw Error('#inputImage() outputType can only be `raw`, `png`, `jpg` or `gif`');
    if (index === 0 || index === 1) return 'image/png';
    if (index === 2) return 'image/jpg';
    if (index === 3) return 'image/gif';
    return format;
  },
  _download: function _download(self, canvas, obj) {
    return function () {
      var link = document.createElement('a');
      link.href = self._canvasToImageOrData(canvas, obj.mimeType, obj.quality, 'data');
      link.download = 'resized';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  },
  _workerBlobURL: function _workerBlobURL(filter) {
    if (filter) filter = this['_filter_' + filter];
    if (!filter) filter = this['_filter_hermite'];

    var _workerTaskString = this._workerTaskString(filter);

    return window.URL.createObjectURL(new Blob([_workerTaskString], {
      type: 'application/javascript'
    }));
  },
  _workerTaskString: function _workerTaskString(filter) {
    var task = '';
    task += '(';
    task += 'function () {';
    task += '    onmessage = function (event) {';
    task += '        var filter = ';
    task += filter.toString();
    task += '        ;var resized = filter(event)';
    task += '        ;postMessage({data: resized });';
    task += '    };';
    task += '}';
    task += ')()';
    return task;
  },
  _filter_hermite: function _filter_hermite(event) {
    var img = event.data[0];
    var data = img.data;
    var W = event.data[1];
    var H = event.data[2];
    var W2 = event.data[3];
    var H2 = event.data[4];
    var img2 = event.data[5];
    var data2 = img2.data;
    var ratio_w = W / W2;
    var ratio_h = H / H2;
    var ratio_w_half = Math.ceil(ratio_w / 2);
    var ratio_h_half = Math.ceil(ratio_h / 2);

    for (var j = 0; j < H2; j++) {
      for (var i = 0; i < W2; i++) {
        var x2 = (i + j * W2) * 4;
        var weight = 0;
        var weights = 0;
        var gx_r = gx_g = gx_b = gx_a = 0;
        var center_y = (j + 0.5) * ratio_h;

        for (var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++) {
          var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
          var center_x = (i + 0.5) * ratio_w;
          var w0 = dy * dy; //pre-calc part of w

          for (var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++) {
            var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
            var w = Math.sqrt(w0 + dx * dx);

            if (w >= -1 && w <= 1) {
              //hermite filter
              weight = 2 * w * w * w - 3 * w * w + 1;

              if (weight > 0) {
                dx = 4 * (xx + yy * W);
                gx_r += weight * data[dx];
                gx_g += weight * data[dx + 1];
                gx_b += weight * data[dx + 2];
                gx_a += weight * data[dx + 3];
                weights += weight;
              }
            }
          }
        }

        data2[x2] = gx_r / weights;
        data2[x2 + 1] = gx_g / weights;
        data2[x2 + 2] = gx_b / weights;
        data2[x2 + 3] = gx_a / weights;
      }
    }

    return img2;
  }
};
module.exports = Object.create(Blitz);
exports = module.exports;

},{}]},{},[1])(1)
});
