var tools = new Array(
    'file_controls',
    'fft_controls',
    'paint_controls',
    'gradient_controls',
    'blur_controls',
    'curve_controls'
);

var fftData = false;

function selectTool( _id ) {
    var success = true;

    for ( var ii=0; ii < tools.length; ++ii ) {
	var ctrl = document.getElementById( tools[ii] );
	var button = document.getElementById( tools[ii] + '_button' );
	success = success && ( ctrl && button );

	if ( ctrl && button ) {
	    if ( tools[ii] == _id ) {
		ctrl.style.visibility = 'visible';
		button.src = 'true.png';
	    }
	    else {
		ctrl.style.visibility = 'hidden';
		button.src = 'false.png';
	    }
	}
    }

    return success;
}

function __nextPowerOfTwo( _nn ) {
    for ( var pp = 1; pp < _nn; pp += pp ) {
	/* do nothing */
    }
    return pp;
}

function __prepareImage( _imgId, _canvasId ) {
    var img = document.getElementById( _imgId );
    var canvas = document.getElementById( _canvasId );
    if ( !img || !canvas ) {
	return false;
    }

    if ( !img.complete ) {
	setTimeout("__prepareImage('"+ _imgId +"','"+ _canvasId +"');", 1000);
	return true;
    }

    var iw = img.naturalWidth;
    var ih = img.naturalHeight;

    if ( iw < 1 || ih < 1 ) {
	return false;
    }

    //
    // round the image width and height up to the next power of two
    // (after clamping to make sure our result is neither too small
    // nor too large)
    //
    var ww = __nextPowerOfTwo( Math.min( Math.max( iw, 128 ), 512 ) );
    var hh = __nextPowerOfTwo( Math.min( Math.max( ih, 128 ), 512 ) );

    canvas.width = ww;
    canvas.height = hh;

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    context.fillStyle = '#333';
    context.fillRect( 0, 0, ww, hh );

    //
    // if our image got bigger than we're letting our canvas get,
    // then we're going to scale the image down.
    //
    if ( iw > ww || ih > hh ) {
	var aspect = (iw * 1.0) / (ih * 1.0);
	if ( aspect * hh <= ww ) {
	    iw = aspect * hh;
	    ih = hh;
	}
	else {
	    iw = ww;
	    ih = ww / aspect;
	}
    }

    var ox = (ww - iw)/2;
    var oy = (hh - ih)/2;

    //
    // blit the image into the canvas
    //
    context.drawImage( img,  0,  0, img.naturalWidth, img.naturalHeight,
		            ox, oy, iw,               ih );

    return true;
}

function changeImage( _url ) {
    var img = document.getElementById( 'original_image' );
    fftData = false;
    img.src = _url;
    return __prepareImage( 'original_image', 'the_canvas' );
}

function copyCanvas( _canvasId ) {
    var canvas = document.getElementById( _canvasId );

    if ( ! canvas ) {
	return false;
    }

    window.open(
	canvas.toDataURL(),
        "_blank",
        "width=" + canvas.width + ",height=" + canvas.height
    );

    return true;
}

function initGUI() {
    var success = selectTool( tools[0] );
    success = success && __prepareImage( 'original_image', 'the_canvas' );
    return success;
}

function __createFFTDataFromCanvas( _canvasId ) {
    var canvas = document.getElementById( _canvasId );

    if ( ! canvas ) {
	return false;
    }

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    var ww = canvas.width;
    var hh = canvas.height;

    var real = new Array();
    var imag = new Array();

    real.length = ww * hh * 4;
    imag.length = ww * hh * 4;

    var rawResult = context.getImageData( 0, 0, ww, hh );
    var result = rawResult.data;

    for ( var pp=0; pp < result.length; ++pp ) {
	real[ pp ] = result[ pp ] / 255.0;
	imag[ pp ] = 0.0;
    }

    return {
	width: ww,
	height: hh,
	real: real,
	imag: imag,
	level: 1
   };
}

function __fillCanvasFromFFTData( _canvasId, _fftData ) {
    var canvas = document.getElementById( _canvasId );

    var ww = _fftData.width;
    var hh = _fftData.height;
    var real = _fftData.real;
    var imag = _fftData.imag;

    canvas.width = ww;
    canvas.height = hh;

    var context = canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    var rawResult = context.getImageData( 0, 0, ww, hh );
    var result = rawResult.data;

    //
    // then, we fill the canvas with the magnitude of
    // the complex FFT data
    //
    for ( var pp=0; pp < result.length; pp += 4 ) {
	//
	// here, we do the red, green, and blue, but just
	// hardcode the alpha
	//
	for ( var kk=0; kk < 3; ++kk ) {
	    var index = pp + kk;
	    var rr = real[ index ];
	    var ii = imag[ index ];
	    result[ index ] = Math.round( 255.0 * Math.sqrt( rr*rr + ii*ii ) );
	}
	result[ pp + 3 ] = 255;
    }

    //
    // then, we blit our representation back to the canvas
    //
    context.putImageData( rawResult, 0, 0 );

    return true;
}

function doFFT( _canvasId, _inverse ) {
    if ( !fftData ) {
	fftData = __createFFTDataFromCanvas( _canvasId );
	if ( !fftData ) {
	    return false;
	}
    }

    var success;
    if ( _inverse ) {
	success = IFFT( fftData );
    }
    else {
	success = FFT( fftData );
    }

    if ( success ) {
	__fillCanvasFromFFTData( _canvasId, success );
	fftData = success;
    }

    return success;
}

