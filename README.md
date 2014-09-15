Hermite-resize
==============

From the original Hermite-resize, modifications were made to spawn a single worker to do the resizing calculation. As documented by the original author, anything more than 2 workers slows down the calculation as combining the data takes up alot of processing power.

Spawning workers frees up the main thread and prevent the browser from freezing when the resizing is ongoing.

Additionally, a performance increase of up to 20% is noticeable.

Also added a callback handler to allow asynchronous callback when the worker thread completes the resizing.

Use worker-single-handler.js and worker-single-hermite.js.

Use
==============

resample_hermite(canvas, W, H, W2, H2, workerPath, callback)

canvas: a canvas with your image drawn on it.

W, H: source width/heights.

W2, H2: destination width/heights.

workerPath: the path to your worker-single-hermite.js

callback: [function]

Original Text
==============

Fast image resize/resample using Hermite filter with JavaScript.

demo: http://viliusle.github.io/miniPaint/
### Single core:
<b>hermite.js</b> - main function, fastest way.

### Multi-core*:
<b>worker-handler.js</b> - function that splits image, sends each peace to resize and combines results<br />
<b>worker-hermite.js</b> - worker, must be in same domain

* slower than single core, because sharing resources, combining takes additional time. And there are no ways to get CPU count with JS.
