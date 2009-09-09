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
	    result[ index ] = __clampPixel( real[ index ], imag[ index ] );
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
