Hermite-resize
==============

Fast, simple, and non-blocking client-side Javascript image resizer.


Introduction
==============

From the original Hermite-resize, modifications were made to spawn a single worker to do the resizing calculation. As documented by the original author, anything more than 2 workers slows down resizing as combining the data takes time.

Spawning workers frees up the main thread and prevent the browser from freezing when the resizing is ongoing. Additionally, a performance increase of up to 20% is noticeable.

Major refactoring to make it more user friendly.


Use
==============

```html

<script src="hermite.js"></script>

//specify the path of the worker file. Path is relative to your HTML document and NOT the script path
var h = Hermite.init('hermite-worker.js');

h.resize({
    source: document.getElementById('image'), // any canvas or image elements, jQuery or native
    width: 400,
    height: 600,
    output: 'image', // [optional] `image` or `canvas`. If not entered output is same as input element.
    quality: 0.7, // [optional] applicable for `image` output only
}, function(output) {
    //your callback
});

```