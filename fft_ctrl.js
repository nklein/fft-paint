function __createFFTDataFromCanvas( _canvasId_m, _canvasId_p ) {
    var canvas_m = document.getElementById( _canvasId_m );
    var canvas_p = document.getElementById( _canvasId_p );

    if ( !canvas_m || !canvas_p ) {
	return false;
    }

    var context_m = canvas_m.getContext( '2d' );
    var context_p = canvas_p.getContext( '2d' );
    if ( !context_m || !context_p ) {
	return false;
    }

    var ww = canvas_m.width;
    var hh = canvas_m.height;

    var real = new Array();
    var imag = new Array();

    real.length = ww * hh * 4;
    imag.length = ww * hh * 4;

    var raw_m = context_m.getImageData( 0, 0, ww, hh );
    var result_m = raw_m.data;

    var raw_p = context_p.getImageData( 0, 0, ww, hh );
    var result_p = raw_p.data;

    for ( var pp=0; pp < result_m.length; ++pp ) {
	var mag = result_m[ pp ] / 255.0;
	var phase = ( result_p[pp] - 128 ) * pi / 128.0;
	real[ pp ] = mag * Math.cos( phase );
	imag[ pp ] = mag * Math.sin( phase );
    }

    return {
	width: ww,
	height: hh,
	real: real,
	imag: imag,
	level: 1
   };
}

function __fillCanvasesFromFFTData( _canvasId_m, _canvasId_p, _fftData ) {
    var canvas_m = document.getElementById( _canvasId_m );
    var canvas_p = document.getElementById( _canvasId_p );

    if ( !canvas_m || !canvas_p ) {
	return false;
    }

    var ww = _fftData.width;
    var hh = _fftData.height;
    var real = _fftData.real;
    var imag = _fftData.imag;

    canvas_m.width = ww;
    canvas_m.height = hh;

    canvas_p.width = ww;
    canvas_p.height = hh;

    var context_m = canvas_m.getContext( '2d' );
    var context_p = canvas_p.getContext( '2d' );
    if ( !context_m || !context_p ) {
	return false;
    }

    var raw_m = context_m.getImageData( 0, 0, ww, hh );
    var result_m = raw_m.data;

    var raw_p = context_p.getImageData( 0, 0, ww, hh );
    var result_p = raw_p.data;

    //
    // then, we fill the canvas with the magnitude of
    // the complex FFT data
    //
    for ( var pp=0; pp < result_m.length; pp += 4 ) {
	//
	// here, we do the red, green, and blue, but just
	// hardcode the alpha
	//
	for ( var kk=0; kk < 3; ++kk ) {
	    var index = pp + kk;
	    result_m[ index ] = __clampPixel( real[ index ], imag[ index ] );
	    result_p[ index ] = __clampPhase( real[ index ], imag[ index ] );
	}
	result_m[ pp + 3 ] = 255;
	result_p[ pp + 3 ] = 255;
    }

    //
    // then, we blit our representation back to the canvas
    //
    context_m.putImageData( raw_m, 0, 0 );
    context_p.putImageData( raw_p, 0, 0 );

    return true;
}

function doFFT( _canvasId_m, _canvasId_p, _inverse ) {
    if ( !fftData ) {
	fftData = __createFFTDataFromCanvas( _canvasId_m, _canvasId_p );
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
	__fillCanvasesFromFFTData( _canvasId_m, _canvasId_p, success );
	fftData = success;
    }

    return success;
}
