
var blurFilter_ir;
var blurFilter_ii;
var blurFilter_r;
var blurFilter_i;
var blurFilter_sr;
var blurFilter_si;
var blurFilter_or;
var blurFilter_oi;

function initBlurMode() {
    blurPreset( 'flat-3x3' );
    return true;
}

function __setCustomFilterMode() {
    var ss = document.getElementById( 'preset_filter' );
    if ( ! ss ) {
	return false;
    }

    ss.selectedIndex = 0;

    return true;
}

function __recalcOne( _canvas, _img, _ss, _oo ) {
    var context = _canvas.getContext( '2d' );
    if ( !context ) {
	return false;
    }

    var ww = _canvas.width;
    var hh = _canvas.height;

    context.clearStyle = 'rgb(0,0,0)';
    context.clearRect( 0, 0, ww, hh );

    var ox = Math.round( ( _canvas.width  - _img.naturalWidth ) / 2 );
    var oy = Math.round( ( _canvas.height - _img.naturalHeight ) / 2 );

    context.drawImage( _img, ox, oy );

    var raw = context.getImageData( 0, 0, ww, hh );
    var data = raw.data;

    var ret = new Array();
    ret.length = hh;

    for ( var jj=0; jj < hh; ++jj ) {
	ret[ jj ] = new Array();
	ret[ jj ].length = ww;
	for ( var ii=0; ii < ww; ++ii ) {
	    var offset = ( jj * ww + ii ) * 4;
	    var rr = data[ offset + 0 ] / 255.0;
	    var gg = data[ offset + 1 ] / 255.0;
	    var bb = data[ offset + 2 ] / 255.0;
	    var vv = 0.30 * rr + 0.59 * gg + 0.11 * bb;
	    ret[ jj ][ ii ] = vv * _ss + _oo;
	}
    }

    return ret;
}

function __recalcFilter() {
    var canvas = document.getElementById( 'temp_filter_canvas' );
    if ( !canvas ) {
	return false;
    }

    if ( !blurFilter_ir || !blurFilter_ii ) {
	return false;
    }

    var ww = Math.max(blurFilter_ir.naturalWidth, blurFilter_ii.naturalWidth );
    var hh = Math.max(blurFilter_ir.naturalHeight,blurFilter_ii.naturalHeight);

    canvas.width = ww;
    canvas.height = hh;

    return ( blurFilter_r = __recalcOne( canvas, blurFilter_ir,
					 blurFilter_sr, blurFilter_or ) )
	&& ( blurFilter_i = __recalcOne( canvas, blurFilter_ii,
					 blurFilter_si, blurFilter_oi ) )
	;
}

function __resetSelectedFilter( _id, _image ) {
    var div = document.getElementById( _id );
    if ( !div ) {
	return false;
    }

    var ret = false;

    var kids = div.children;
    for ( var ii=0; ii < kids.length; ++ii ) {
	var kid = kids[ ii ];
	if ( kid.tagName == "IMG" ) {
	    if ( kid.src.match( _image ) ) {
		kid.style.border = 'solid blue 2px';
		ret = kid;
	    }
	    else {
		kid.style.border = 'solid black 2px';
	    }
	}
    }

    return ret;
}

function setRealFilter( _value, _preset ) {
    return ( blurFilter_ir = __resetSelectedFilter( 'real_filter', _value ) )
	&& ( _preset || ( __setCustomFilterMode() && __recalcFilter() ) )
}

function setImagFilter( _value, _preset ) {
    return ( blurFilter_ii = __resetSelectedFilter( 'imag_filter', _value ) )
	&& ( _preset || ( __setCustomFilterMode() && __recalcFilter() ) )
}

function setRealScale( _value, _preset ) {
    blurFilter_sr = eval( _value ) + 0.0;

    var ctrl = document.getElementById( 'scale_real_filter' );
    if ( !ctrl ) {
	return false;
    }
    ctrl.value = _value;

    return _preset || ( __setCustomFilterMode() && __recalcFilter() );
}

function setRealOffset( _value, _preset ) {
    blurFilter_or = eval( _value ) + 0.0;

    var ctrl = document.getElementById( 'offset_real_filter' );
    if ( !ctrl ) {
	return false;
    }
    ctrl.value = _value;

    return _preset || ( __setCustomFilterMode() && __recalcFilter() );
}

function setImagScale( _value, _preset ) {
    blurFilter_si = eval( _value ) + 0.0;

    var ctrl = document.getElementById( 'scale_imag_filter' );
    if ( !ctrl ) {
	return false;
    }
    ctrl.value = _value;

    return _preset || ( __setCustomFilterMode() && __recalcFilter() );
}

function setImagOffset( _value, _preset ) {
    blurFilter_oi = eval( _value ) + 0.0;

    var ctrl = document.getElementById( 'offset_imag_filter' );
    if ( !ctrl ) {
	return false;
    }
    ctrl.value = _value;

    return _preset || ( __setCustomFilterMode() && __recalcFilter() );
}

var blurPresets = {
    'flat-3x3': {
	real_filter: 'flat-3x3.png',
	imag_filter: 'flat-3x3.png',
	scale_real_filter: '1/9',
	offset_real_filter: '0',
	scale_imag_filter: '0',
	offset_imag_filter: '0',
    },
    'gauss-5x5': {
	real_filter: 'gauss-5x5.png',
	imag_filter: 'gauss-5x5.png',
	scale_real_filter: '1/8.513725',
	offset_real_filter: '0',
	scale_imag_filter: '0',
	offset_imag_filter: '0',
    },
    'laplace-3x3': {
	real_filter: 'laplace-3x3.png',
	imag_filter: 'laplace-3x3.png',
	scale_real_filter: '7/6',
	offset_real_filter: '-1/6',
	scale_imag_filter: '0',
	offset_imag_filter: '0',
    },
    'sobel-x': {
	real_filter: 'sobel-x.png',
	imag_filter: 'sobel-x.png',
	scale_real_filter: '4',
	offset_real_filter: '-2',
	scale_imag_filter: '0',
	offset_imag_filter: '0',
    },
    'sobel-y': {
	real_filter: 'sobel-y.png',
	imag_filter: 'sobel-y.png',
	scale_real_filter: '4',
	offset_real_filter: '-2',
	scale_imag_filter: '0',
	offset_imag_filter: '0',
    },
};

function blurPreset( _preset ) {
    var setting = blurPresets[ _preset ];
    return !setting
	|| (   setRealFilter( setting.real_filter, true )
	    && setImagFilter( setting.imag_filter, true )
	    && setRealScale(  setting.scale_real_filter, true )
	    && setRealOffset( setting.offset_real_filter, true )
	    && setImagScale(  setting.scale_imag_filter, true )
	    && setImagOffset( setting.offset_imag_filter, true )
	    && __recalcFilter()
	   );
}

function performBlur() {
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

    var ww = fftData.width;
    var hh = fftData.height;
    var real = fftData.real;
    var imag = fftData.imag;

    var bw = blurFilter_r[0].length;
    var bh = blurFilter_r.length;

    var bw2 = Math.floor( bw/2 );
    var bh2 = Math.floor( bh/2 );

    var real_out = new Array();
    var imag_out = new Array();

    real_out.length = ww*hh*4;
    imag_out.length = ww*hh*4;

    // naive convolution... no attempt to optimize
    for ( var jj=0; jj < hh; ++jj ) {
	for ( var ii=0; ii < ww; ++ii ) {
	    for ( var kk=0; kk < 3; ++kk ) {
		var ss_r = 0;
		var ss_i = 0;

		for ( var vv = 0; vv < bh; ++vv ) {
		    var yy = ( jj - vv + bh2 + hh ) % hh;
		    for ( var uu = 0; uu < bw; ++uu ) {
			var xx = ( ii - uu + bw2 + ww ) % ww;
			var aa = real[( yy * ww + xx )*4 + kk];
			var bb = imag[( yy * ww + xx )*4 + kk];
			var cc = blurFilter_r[vv][uu];
			var dd = blurFilter_i[vv][uu];

			ss_r += aa * cc - bb * dd;
			ss_i += aa * dd + bb * cc;
		    }
		}

		real_out[ (jj * ww + ii) * 4 + kk ] = ss_r;
		imag_out[ (jj * ww + ii) * 4 + kk ] = ss_i;
	    }
	}
    }

    fftData.real = real_out;
    fftData.imag = imag_out;

    __fillCanvasesFromFFTData( 'canvas_m', 'canvas_p', fftData );

    return true;
}
