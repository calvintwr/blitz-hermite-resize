function resample_hermite(canvas, W, H, W2, H2, callback){

	if(typeof callback !== 'function') {
		console.log('Error: Expecting callback to be a function!');
	}

    var time1 = Date.now();
    var img = canvas.getContext("2d").getImageData(0, 0, W, H);
    var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
    //var data2 = img2.data;
    //var cores = 1;
    //var cpu_in_use = 0;
    canvas.getContext("2d").clearRect(0, 0, W, H);

    var my_worker = new Worker("assets/js/worker-hermite.js");
    my_worker.onmessage = function(event){

        img2 = event.data.data;    

        console.log("hermite resize completed in "+(Math.round(Date.now() - time1)/1000)+" s");   
        canvas.getContext("2d").clearRect(0, 0, W, H);
        canvas.height = H2;
        canvas.width = W2;
        canvas.getContext("2d").putImageData(img2, 0, 0);
        return callback(canvas);
        
    };
    my_worker.postMessage([img, W, H, W2, H2, img2]);

};
