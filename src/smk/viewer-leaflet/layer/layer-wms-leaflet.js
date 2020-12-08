include.module( 'layer-leaflet.layer-wms-leaflet-js', [ 'layer.layer-wms-js' ], function () {
    "use strict";

    function WmsLeafletLayer() {
        SMK.TYPE.Layer[ 'wms' ].prototype.constructor.apply( this, arguments )
    }

    $.extend( WmsLeafletLayer.prototype, SMK.TYPE.Layer[ 'wms' ].prototype )

    SMK.TYPE.Layer[ 'wms' ][ 'leaflet' ] = WmsLeafletLayer
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    SMK.TYPE.Layer[ 'wms' ][ 'leaflet' ].create = function ( layers, zIndex ) {
        var serviceUrl  = layers[ 0 ].config.serviceUrl
        var layerNames  = layers.map( function ( c ) { return c.config.layerName } ).join( ',' )
        var styleNames  = layers.map( function ( c ) { return c.config.styleName } ).join( ',' )
        var version     = layers[ 0 ].config.version || '1.1.1'
        var attribution = layers[ 0 ].config.attribution
        var opacity     = layers[ 0 ].config.opacity
        var where       = layers.map( function ( c ) { return c.config.where || 'include' } ).join( ';' )

        return resolveSLD( this, layers[ 0 ].config.sld ).then( function ( sld ) {
            var layer = L.nonTiledLayer.wms( serviceUrl, {
                layers:         layerNames,
                styles:         styleNames,
                version:        version,
                attribution:    attribution,
                opacity:        opacity,
                format:         'image/png',
                transparent:    true,
                zIndex:         zIndex,
                cql_filter:     where
            } )
    
            if ( sld ) {
                layer.wmsParams.sld_body = sld
                delete layer.wmsParams.styles
            }
    
            layer.on( 'load', function ( ev ) {
                layers.forEach( function ( ly ) {
                    ly.loading = false
                } )
            } )
    
            layer.on( 'loading', function ( ev ) {
                layers.forEach( function ( ly ) {
                    ly.loading = true
                } )
            } )
    
            return layer    
        } )
    }

    function resolveSLD( viewer, sld ) {
        if ( !sld ) return Promise.resolve()

        if ( sld.startsWith( '@' ) ) {
            var url = sld.substr( 1 )
            return fetch( url )
                .then( function ( resp ) {
                    if ( resp.status !== 200 ) throw Error( 'fetching ' + url + ': ' + resp.statusText )
                    return resp.text()
                } )
                .then( function ( text ) {
                    return text.replace( /\s+/g, ' ' ).replace( /[>] [<]/g, '><' )
                } )
                .catch( function ( err ) {
                    console.warn( err )
                    return 
                } )
        }

        return Promise.resolve( sld )
    }
} )
