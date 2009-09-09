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
	window.setTimeout(__prepareImage,1000,_imgId,_canvasId);
	return true;
    }
	window.status = "" + img.src;

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
    window.setTimeout(__prepareImage,500,'original_image','the_canvas');
    return true;
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
