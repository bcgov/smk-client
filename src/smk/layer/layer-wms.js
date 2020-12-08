include.module( 'layer.layer-wms-js', [ 'layer.layer-js' ], function () {
    "use strict";

    function WmsLayer() {
        SMK.TYPE.Layer.prototype.constructor.apply( this, arguments )
    }

    $.extend( WmsLayer.prototype, SMK.TYPE.Layer.prototype )

    SMK.TYPE.Layer[ 'wms' ] = WmsLayer
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    // WmsLayer.prototype.canMergeWith = function ( other ) {
        // if ( this.config.type != other.config.type ) return false
        // if ( this.config.serviceUrl != other.config.serviceUrl ) return false
        // if ( this.config.opacity != other.config.opacity ) return false

        // return true
    // }

    WmsLayer.prototype.initLegends = function () {
        var url =  this.config.serviceUrl + '?' + $.param( {
            SERVICE:    'WMS',
            VERSION:    '1.1.1',
            REQUEST:    'getlegendgraphic',
            FORMAT:     'image/png',
            LAYER:      this.config.layerName,
            STYLE:      this.config.styleName
        } )

        return SMK.UTIL.makePromise( function ( res, rej ) {
            try {
                var i = $( '<img>' )
                    .on( 'load', function () {
                        res( [ { url: url } ] )
                    } )
                    .on( 'error', function ( ev ) {
                        rej( new Error( 'Unable to load: ' + url ) )
                    } )
                    .attr( 'src', url )

                if ( i.get( 0 ).complete ) {
                    res( [ { url: url } ] )
                }
            }
            catch ( e ) {
                rej( e )
            }
        } )
    }

    WmsLayer.prototype.getFeaturesAtPoint = function ( location, view, option ) {
        var self = this

        var serviceUrl  = this.config.serviceUrl
        var layerName   = this.config.layerName
        var styleName   = this.config.styleName
        var version     = '1.1.1'

        var params = {
            service:       "WMS",
            version:       version,
            request:       "GetFeatureInfo",
            bbox:          view.extent.join( ',' ),
            feature_count: 20,
            height:        view.screen.height,
            width:         view.screen.width,
            info_format:   'application/json',
            layers:        layerName,
            query_layers:  layerName,
            styles:        styleName,
            buffer:        option.tolerance
        }

        if ( version == '1.3.0' ) {
            params.crs = 'EPSG:4326'
            params.i =   parseInt( location.screen.x )
            params.j =   parseInt( location.screen.y )
        }
        else {
            params.srs = 'EPSG:4326'
            params.x =   parseInt( location.screen.x )
            params.y =   parseInt( location.screen.y )
        }

        var options = {
            method:    'GET',
            url:       serviceUrl,
            data:      params,
            xhrFields: {},
        };

        return SMK.UTIL.makePromise( function ( res, rej ) {
            $.ajax( options ).then( res, rej )
        } )
        .then( function ( geojson ) {
            if ( !geojson || !geojson.features || geojson.features.length == 0 ) throw new Error( 'no features' )

            if ( !geojson.crs ) return geojson

            if ( geojson.crs.properties )
                if ( !geojson.crs.properties.name )
                    throw new Error( 'unable to determine CRS from: ' + JSON.stringify( geojson.crs ) )

            return SMK.UTIL.getProjection( geojson.crs.properties.name )
                .then( function ( projection ) {
                    return SMK.UTIL.reprojectGeoJSON( geojson, projection )
                } ) 
            // return SMK.UTIL.reproject( geojson, geojson.crs )
        } )
        .then( function ( geojson ) {
            return geojson.features
        } )

        // if ( queryLayer.withCreds )
        //     options.xhrFields.withCredentials = true
    }

    WmsLayer.prototype.getFeaturesInArea = function ( area, view, option ) {
        var self = this

        var filter = '<Filter xmlns:gml="http://www.opengis.net/gml"><Intersects><PropertyName></PropertyName><gml:Polygon srsName="http://www.opengis.net/gml/srs/epsg.xml#4326" xmlns:gml="http://www.opengis.net/gml"><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates decimal="." cs="," ts=" ">' +
            area.geometry.coordinates[ 0 ].map( function ( c ) { return c.join( ',' ) } ).join( ' ' ) +
        '</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon></Intersects></Filter>'

        var data = {
            service:        "WFS",
            version:        '1.0.0',
            request:        "GetFeature",
            srsName:        'EPSG:4326',
            typename:       this.config.layerName,
            outputformat:   "application/json",
            filter:         filter,
        }

        return SMK.UTIL.makePromise( function ( res, rej ) {
            $.ajax( {
                url:        self.config.serviceUrl,
                method:     'GET',
                data:       data,
                dataType:   'json',
            } ).then( res, rej )
        } )
        .then( function ( data ) {
            // console.log( data )

            if ( !data ) throw new Error( 'no features' )
            if ( !data.features || data.features.length == 0 ) throw new Error( 'no features' )

            return data.features.map( function ( f, i ) {
                if ( self.config.titleAttribute )
                    f.title = f.properties[ self.config.titleAttribute ]
                else
                    f.title = 'Feature #' + ( i + 1 )

                return f
            } )
        } )
    }

} )
