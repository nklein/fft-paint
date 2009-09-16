function __nextPowerOfTwo( _nn ) {
    for ( var pp = 1; pp < _nn; pp += pp ) {
	/* do nothing */
    }
    return pp;
}

function __prepareImage( _imgId, _canvasId_m, _canvasId_p ) {
    var img = document.getElementById( _imgId );
    var canvas_m = document.getElementById( _canvasId_m );
    var canvas_p = document.getElementById( _canvasId_p );
    var canvas_m_o = document.getElementById( _canvasId_m + '_o' );
    var canvas_p_o = document.getElementById( _canvasId_p + '_o' );
    if ( !img || !canvas_m || !canvas_p || !canvas_m_o || !canvas_p_o ) {
	return false;
    }

    if ( !img.complete ) {
	window.setTimeout(__prepareImage,1000,_imgId,_canvasId);
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

    canvas_m.width = ww;
    canvas_m.height = hh;
    canvas_m_o.width = ww;
    canvas_m_o.height = hh;
    canvas_m.parentNode.style.width = ww;
    canvas_m.parentNode.style.height = hh;

    canvas_p.width = ww;
    canvas_p.height = hh;
    canvas_p_o.width = ww;
    canvas_p_o.height = hh;
    canvas_p.parentNode.style.width = ww;
    canvas_p.parentNode.style.height = hh;

    var context_m = canvas_m.getContext( '2d' );
    var context_p = canvas_p.getContext( '2d' );
    if ( !context_m || !context_p ) {
	return false;
    }

    context_m.fillStyle = '#333';
    context_m.fillRect( 0, 0, ww, hh );

    context_p.fillStyle = '#808080';
    context_p.fillRect( 0, 0, ww, hh );

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
    context_m.drawImage( img,  0,  0, img.naturalWidth, img.naturalHeight,
			      ox, oy, iw,               ih );

    return __clearOverlays();
}

function changeImage( _url ) {
    var img = document.getElementById( 'original_image' );
    fftData = false;
    img.src = _url;
    window.setTimeout( __prepareImage, 500,
		      'original_image',
		      'canvas_m', 'canvas_p');
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
