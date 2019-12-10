include.module( 'tool-directions.router-api-js', [], function ( inc ) {
    "use strict";

    var baseUrl = 'https://router.api.gov.bc.ca/'

    var apiKey
    function setApiKey( key ) {
        apiKey = key
    }

    var request
    function fetchDirections( points, option ) {
        option = Object.assign( {
            criteria:           'shortest',
            roundTrip:          false,
            optimal:            false,
            truck:              false,  
            correctSide:        null,
            height:             null,
            weight:             null,
            distanceUnits:      'km',
            followTruckRoute:   null,
            truckRouteMultiplier:null,
            disable:            null,
            outputSRS:          4326,            
        }, option )

        if ( request )
            request.abort()

        var optimal = !!option.optimal
        delete option.optimal

        var truck = !!option.truck
        delete option.truck

        var endPoint = [
            'directions',
            'optimalDirections',
            'truck/directions',
            'truck/optimalDirections',
        ][ optimal + 2 * truck ] + '.json'

        var query = Object.fromEntries( Object.entries( option ).filter( function( kv ) { return !!kv[ 1 ] } ) )
        query.points = points.map( function ( w ) { return w.longitude + ',' + w.latitude } ).join( ',' )

        var ajaxOpt = {
            timeout:    10 * 1000,
            dataType:   'json',
            url:        baseUrl + endPoint,
            data:       query,
            headers: {
                apikey: apiKey
            }
        }

        var result = SMK.UTIL.makePromise( function ( res, rej ) {
            ( request = $.ajax( ajaxOpt ) ).then( res, rej )
        } )
        .then( function ( data ) {
            if ( !data.routeFound ) throw new Error( 'failed to find route' )

            if ( data.directions ) {
                data.directions = data.directions.map( function ( dir, i ) {
                    dir.instruction = dir.text.replace( /^"|"$/g, '' ).replace( /\s(?:for|and travel)\s((?:\d+.?\d*\s)?k?m)\s[(](\d+).+?((\d+).+)?$/, function ( m, a, b, c, d ) {
                        dir.distance = a

                        if ( d )
                            dir.time = ( '0' + b ).substr( -2 ) + ':' + ( '0' + d ).substr( -2 )
                        else
                            dir.time = '00:' + ( '0' + b ).substr( -2 )

                        return ''
                    } )

                    return dir
                } )
            }

            data.request = ajaxOpt

            return data
        } )

        if ( !apiKey ) return result

        return result.catch( function () {
            return {
                distance: '10',
                timeText: '10 mins',
                route: points.map( function ( p ) { return [ p.longitude, p.latitude ] } ),
                directions: points
                    .map( function ( p ) {
                        return { instruction: 'waypoint: ' + p.longitude + ', ' + p.latitude, point: [ p.longitude, p.latitude ] }
                    } )
                    .reduce( function ( accum, v ) {
                        if ( accum.length == 0 ) {
                            accum.push( v )
                            return accum
                        }

                        var prev = accum[ accum.length - 1 ]

                        accum.push( { instruction: 'turn left for 1km (1:00)', point: interpolate( prev.point, v.point, 0.2 ) } )
                        accum.push( { instruction: 'go straight for 2km (2:00)', point: interpolate( prev.point, v.point, 0.4 ) } )
                        accum.push( { instruction: 'turn right for 3km (3:00)', point: interpolate( prev.point, v.point, 0.6 ) } )
                        accum.push( { instruction: 'go backwards for 4km (4:00)', point: interpolate( prev.point, v.point, 0.8 ) } )
                        accum.push( v )

                        return accum 
                    }, [] )
            }
        } )
    }

    function interpolate( p1, p2, t ) {
        return [
            p1[ 0 ] + ( p2[ 0 ] - p1[ 0 ] ) * t,
            p1[ 1 ] + ( p2[ 1 ] - p1[ 1 ] ) * t
        ]
    }

    return {
        setApiKey: setApiKey,
        fetchDirections: fetchDirections
    }
} )

 