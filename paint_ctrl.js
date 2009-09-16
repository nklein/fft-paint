function __normalPaintMode( _real, _imag, _result_m, _result_p,
			    _offset, _r_offset,
			    _clr_r, _clr_i, _alpha ) {
    for ( var kk=0; kk < 3; ++kk ) {
	var index = _offset + kk;
	_real[index] = (1.0 - _alpha) * _real[index] + _alpha * _clr_r[kk];
	_imag[index] = (1.0 - _alpha) * _imag[index] + _alpha * _clr_i[kk];

	_result_m[ _r_offset + kk ] = __clampPixel(_real[index],_imag[index]);
	_result_p[ _r_offset + kk ] = __clampPhase(_real[index],_imag[index]);
    }
}

function __addPaintMode( _real, _imag, _result_m, _result_p,
			 _offset, _r_offset,
			 _clr_r, _clr_i, _alpha ) {
    for ( var kk=0; kk < 3; ++kk ) {
	var index = _offset + kk;
	_real[index] += _alpha * _clr_r[kk];
	_imag[index] += _alpha * _clr_i[kk];

	_result_m[ _r_offset + kk ] = __clampPixel(_real[index],_imag[index]);
	_result_p[ _r_offset + kk ] = __clampPhase(_real[index],_imag[index]);
    }
}

function __multiplyPaintMode( _real, _imag, _result_m, _result_p,
			      _offset, _r_offset,
			      _clr_r, _clr_i, _alpha ) {
    for ( var kk=0; kk < 3; ++kk ) {
	var index = _offset + kk;
	var rr = _real[index];
	var ii = _imag[index];

	_real[index] = (1.0 - _alpha) * rr
	    + _alpha * ( rr * _clr_r[kk] - ii * _clr_i[kk] );
	_imag[index] = (1.0 - _alpha) * ii
	    + _alpha * ( rr * _clr_i[kk] + ii * _clr_r[kk] );

	_result_m[ _r_offset + kk ] = __clampPixel(_real[index],_imag[index]);
	_result_p[ _r_offset + kk ] = __clampPhase(_real[index],_imag[index]);
    }
}

var paint_hsv_r = Array( 0.0, 0.0, 1.0 );
var paint_hsv_i = Array( 0.0, 0.0, 0.0 );

var paint_color_r = Array( 1.0, 0.0, 0.0 );
var paint_color_i = Array( 0.0, 0.0, 0.0 );
var paint_opacity = 0.2;
var paint_mode = __normalPaintMode;
var paint_brush = false;

function selectPaintMode( _mode ) {
    if ( _mode == 'normal' ) {
	paint_mode = __normalPaintMode;
    }
    else if ( _mode == 'add' ) {
	paint_mode = __addPaintMode
    }
    else if ( _mode == 'multiply' ) {
	paint_mode = __multiplyPaintMode
    }
    else {
	return false;
    }
    return true;
}

function updatePaintColor( _hsv, _rgb, _patchId ) {
    var hh = _hsv[0];
    var ss = _hsv[1];
    var vv = _hsv[2];

    while ( hh < 0 ) {
	hh += 360;
    }

    var hi = Math.floor( hh / 60 ) % 6;
    var ff = hh / 60.0 - Math.floor( hh / 60 );

    var pp = vv * ( 1.0 - ss );
    var qq = vv * ( 1.0 - ff * ss );
    var tt = vv * ( 1.0 - (1.0 - ff) * ss);

    switch (hi) {
    case 0:  _rgb[0] = vv; _rgb[1] = tt; _rgb[2] = pp; break;
    case 1:  _rgb[0] = qq; _rgb[1] = vv; _rgb[2] = pp; break;
    case 2:  _rgb[0] = pp; _rgb[1] = vv; _rgb[2] = tt; break;
    case 3:  _rgb[0] = pp; _rgb[1] = qq; _rgb[2] = vv; break;
    case 4:  _rgb[0] = tt; _rgb[1] = pp; _rgb[2] = vv; break;
    case 5:  _rgb[0] = vv; _rgb[1] = pp; _rgb[2] = qq; break;
    }

    var rr = __clampPixel( _rgb[0], 0.0 );
    var gg = __clampPixel( _rgb[1], 0.0 );
    var bb = __clampPixel( _rgb[2], 0.0 );

    var patch = document.getElementById( _patchId );
    if ( !patch ) {
	return false;
    }
    var context = patch.getContext('2d');
    if ( ! context ) {
	return false;
    }
    context.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
    context.fillRect( 0, 0, patch.width, patch.height );

    return true;
}

function selectHueAndSaturation( _ctrl, _real, _event ) {
    var rect = __getBoundingClientRect( _ctrl );
    var xx = Math.round(_event.clientX - rect.left - _ctrl.width/2);
    var yy = Math.round(_event.clientY - rect.top  - _ctrl.height/2);

    var hh = Math.round( 180.0 * Math.atan2( yy, xx ) / pi );
    var rr = Math.sqrt( xx*xx + yy*yy ) / (_ctrl.width/2);
    var ss = Math.min( rr, 1.0 );

    if ( _real ) {
	paint_hsv_r[ 0 ] = hh;
	paint_hsv_r[ 1 ] = ss;
	updatePaintColor( paint_hsv_r, paint_color_r, 'real_color' );
    }
    else {
	paint_hsv_i[ 0 ] = hh;
	paint_hsv_i[ 1 ] = ss;
	updatePaintColor( paint_hsv_i, paint_color_i, 'imag_color' );
    }

    return true;
}

function selectLuminance( _ctrl, _real ) {
    var ll = parseFloat( _ctrl.value ) + 0.0;
    _ctrl.value = ll;
    if ( _real ) {
	paint_hsv_r[ 2 ] = ll;
	updatePaintColor( paint_hsv_r, paint_color_r, 'real_color' );
    }
    else {
	paint_hsv_i[ 2 ] = ll;
	updatePaintColor( paint_hsv_i, paint_color_i, 'imag_color' );
    }
    return true;
}

function selectOpacity( _ctrl ) {
    var oo = parseFloat( _ctrl.value ) + 0.0;
    _ctrl.value = oo;
    paint_opacity = oo;
    return true;
}

function setPaintBrush( _img ) {
    var brush = document.getElementById( 'paint_brush' );
    if ( !_img || !brush ) {
	return false;
    }

    var context = brush.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    var ww = _img.naturalWidth;
    var hh = _img.naturalHeight;

    if ( ww < 1 || hh < 1 ) {
	return false;
    }

    if ( ww > brush.width || hh > brush.height ) {
	var aspect = 1.0 * ww / hh;
	if ( aspect * brush.height <= brush.width ) {
	    ww = aspect * brush.height;
	    hh = brush.height;
	}
	else {
	    ww = brush.width;
	    hh = brush.width / aspect;
	}
    }

    var ox = Math.round( (brush.width - ww)/2 );
    var oy = Math.round( (brush.height - hh)/2 );

    context.fillStyle = '#fff';
    context.fillRect( 0, 0, brush.width, brush.height );

    context.drawImage( _img, ox, oy, ww, hh );

    var rawData = context.getImageData( ox, oy, ww, hh );
    var pix = rawData.data;

    paint_brush = new Array();

    for ( var jj=0; jj < hh; ++jj ) {
	var row = new Array();
	for ( var ii=0; ii < ww; ++ii ) {
	    var index = ( jj * ww + ii ) * 4;
	    var rr = 1.0 - pix[ index + 0 ] / 255.0;
	    var gg = 1.0 - pix[ index + 1 ] / 255.0;
	    var bb = 1.0 - pix[ index + 2 ] / 255.0;
	    row[ii] = 0.30 * rr + 0.59 * gg + 0.11 * bb;
	}
	paint_brush[jj] = row;
    }

    return true;
}

var transform_checkboxes = new Array(
    'mirror_x',
    'mirror_y',
    'mirror_d1',
    'mirror_d2',
    'mirror_r'
);
var known_transforms = {
    'identity':  new Array( new Array(  1,  0 ), new Array(  0,  1 ) ),
    'mirror_x':  new Array( new Array( -1,  0 ), new Array(  0,  1 ) ),
    'mirror_y':  new Array( new Array(  1,  0 ), new Array(  0, -1 ) ),
    'mirror_d1': new Array( new Array(  0,  1 ), new Array(  1,  0 ) ),
    'mirror_d2': new Array( new Array(  0, -1 ), new Array( -1,  0 ) ),
    'mirror_r':  new Array( new Array( -1,  0 ), new Array(  0, -1 ) ),
};
var transforms = new Array( known_transforms['identity'] );


function __transformedX( _transform, _xx, _yy ) {
    return _transform[0][0] * _xx + _transform[0][1] * _yy;
}
function __transformedY( _transform, _xx, _yy ) {
    return _transform[1][0] * _xx + _transform[1][1] * _yy;
}

function __multiplyTransforms( _aa, _bb ) {
    var row1 = new Array( _aa[0][0] * _bb[0][0] + _aa[0][1] * _bb[1][0],
			  _aa[0][0] * _bb[0][1] + _aa[0][1] * _bb[1][1] );
    var row2 = new Array( _aa[1][0] * _bb[0][0] + _aa[1][1] * _bb[1][0],
			  _aa[1][0] * _bb[0][1] + _aa[1][1] * _bb[1][1] );
    return new Array( row1, row2 );
}

function __sameTransform( _aa, _bb ) {
    var delta = Math.abs( _aa[0][0] - _bb[0][0] )
	      + Math.abs( _aa[0][1] - _bb[0][1] )
	      + Math.abs( _aa[1][0] - _bb[1][0] )
	      + Math.abs( _aa[1][1] - _bb[1][1] )
	      ;
    return delta < 0.00001;
}

function __addTransform( _aa ) {
    for ( var ii=0; ii < transforms.length; ++ii ) {
	if ( __sameTransform( _aa, transforms[ii] ) ) {
	    return false;
	}
    }

    transforms[ transforms.length ] = _aa;
    for ( var ii=0; ii < transforms.length; ++ii ) {
	var cc = __multiplyTransforms( _aa, transforms[ii] );
	__addTransform( cc );
    }
    return true;
}

function reloadTransforms() {
    transforms = new Array( known_transforms['identity'] );
    for ( var ii=0; ii < transform_checkboxes.length; ++ii ) {
	var name = transform_checkboxes[ii];
	var checkbox = document.getElementById( name );
	if ( !checkbox ) {
	    return false;
	}
	if ( checkbox.checked ) {
	    __addTransform( known_transforms[ name ] );
	}
    }
    return true;
}

function __paintAtPoint( _canvas_m, _canvas_p, _context_m, _context_p,
			 _mx_orig, _my_orig, _transform )
{
    //
    // transform the brush location based on the symmetry transform
    //
    var _mx2_orig = _mx_orig - _canvas_m.width/2;
    var _my2_orig = _my_orig - _canvas_m.height/2;

    var mx = __transformedX( _transform, _mx2_orig, _my2_orig )
	            + canvas_m.width/2;
    var my = __transformedY( _transform, _mx2_orig, _my2_orig )
	            + canvas_m.height/2;

    var bw_orig = paint_brush[0].length;
    var bh_orig = paint_brush.length;

    var bw = Math.abs( __transformedX( _transform, bw_orig, bh_orig ) );
    var bh = Math.abs( __transformedY( _transform, bw_orig, bh_orig ) );

    var bound_xx = Math.max(mx - Math.round(bw/2), 0);
    var bound_ww = Math.min(mx + Math.round(bw/2), canvas_m.width) - bound_xx;
    var bound_yy = Math.max(my - Math.round(bh/2), 0);
    var bound_hh = Math.min(my + Math.round(bh/2),canvas_m.height) - bound_yy;

    if ( bound_ww < 1 || bound_hh < 1 ) {
	return false;
    }
    var raw_m = _context_m.getImageData(bound_xx,bound_yy,bound_ww,bound_hh);
    var result_m = raw_m.data;
    var raw_p = _context_p.getImageData(bound_xx,bound_yy,bound_ww,bound_hh);
    var result_p = raw_p.data;

    var real = fftData.real;
    var imag = fftData.imag;

    for ( var bj = 0, r_index = 0; bj < bh; ++bj ) {
	var bj_orig = bj - (bh-1)/2;
	var yy = my + Math.round(bj_orig - 0.5);
	if ( 0 <= yy && yy < canvas_m.height ) {
	    for ( var bi = 0; bi < bw; ++bi ) {
		var bi_orig = bi - (bw-1)/2;
		var xx = mx + Math.round(bi_orig - 0.5);
		if ( 0 <= xx && xx < canvas_m.width ) {
		    var bit = Math.round(
				 __transformedX( _transform, bi_orig, bj_orig )
				 + (bw-1)/2
			      );
		    var bjt = Math.round(
				 __transformedY( _transform, bi_orig, bj_orig )
				 + (bh-1)/2
			      );
		    var index = ( yy * canvas_m.width + xx ) * 4;
		    paint_mode( real, imag, result_m, result_p,
				index, r_index,
				paint_color_r, paint_color_i,
				paint_opacity * paint_brush[bjt][bit] );
		    r_index += 4;
		}
	    }
	}
    }

    _context_m.putImageData( raw_m, bound_xx, bound_yy );
    _context_p.putImageData( raw_p, bound_xx, bound_yy );

    return true;
}

function paintAtMouse( _event ) {
    var canvas_m = document.getElementById( 'canvas_m' );
    var canvas_p = document.getElementById( 'canvas_p' );
    if ( !canvas_m || !canvas_p ) {
	return false;
    }

    if ( !fftData ) {
	fftData = __createFFTDataFromCanvas( canvas_m.id, canvas_p.id );
	if ( !fftData ) {
	    return false;
	}
    }

    var context_m = canvas_m.getContext('2d');
    var context_p = canvas_p.getContext('2d');
    if ( !context_m || !context_p ) {
	return false;
    }

    var canvas = _event.target;
    var rect = __getBoundingClientRect( canvas );

    var mx = Math.round(_event.clientX - rect.left);
    var my = Math.round(_event.clientY - rect.top);

    for ( var ii=0; ii < transforms.length; ++ii ) {
	__paintAtPoint( canvas_m, canvas_p, context_m, context_p,
			mx, my, transforms[ii] );
    }

    return true;
}

//
// set up paint-mode event handlers
//
modes.paint_controls = {
    handleMouseDown: paintAtMouse,
    handleMouseDrag: paintAtMouse,
};
