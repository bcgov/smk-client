( function () {
    "use strict";

    if ( !window.SMK ) window.SMK = {}

    if ( !window.SMK.ON_FAILURE )
        window.SMK.ON_FAILURE = function ( err, el ) {
            if ( err.parseSource )
               err.message += ', while parsing ' + err.parseSource

            console.error( err )

            var message = document.createElement( 'div' )
            message.classList.add( 'smk-failure' )

            message.innerHTML =
                '<h1>Simple Map Kit</h1>' +
                '<h2>Initialization of SMK failed</h2>' +
                '<p>' + err + '</p>'

            if ( !el )
                el = document.querySelector( 'body' )

            el.appendChild( message )

            if ( !document.getElementById( window.SMK.ON_FAILURE.STYLE_ID ) ) {
                var style = document.createElement( 'style' )
                style.id = window.SMK.ON_FAILURE.STYLE_ID
                style.textContent = window.SMK.ON_FAILURE.STYLE
                document.getElementsByTagName( 'head' )[ 0 ].appendChild( style )
            }
        }

    if ( !window.SMK.ON_FAILURE.STYLE_ID )
        window.SMK.ON_FAILURE.STYLE_ID = 'smk-on-failure-style'

    if ( !window.SMK.ON_FAILURE.STYLE )
        window.SMK.ON_FAILURE.STYLE = [
            '.smk-failure {',
                'box-shadow: inset 0px 0px 25px -1px #cc0000;',
                'background-color: white;',
                'font-family: sans-serif;',
                'position: absolute;',
                'top: 0;',
                'left: 0;',
                'right: 0;',
                'bottom: 0;',
                'padding: 20px;',
                'display: flex;',
                'flex-direction: column;',
                'align-items: stretch;',
                'justify-content: center;',
            '}',
            '.smk-failure h1 { margin: 0; }',
            '.smk-failure h2 { margin: 0; font-size: 1.2em; }',
            '.smk-failure p { font-size: 1.1em; }'
        ].join( '' )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    if ( navigator.userAgent.indexOf( "MSIE " ) > -1 || navigator.userAgent.indexOf( "Trident/" ) > -1 ) {
        var err = new Error( 'SMK will not function in Internet Explorer 11.' )

        var scripts = document.getElementsByTagName( 'script' )
        var script

        var stack
        try {
            /* jshint -W030 */ // Expected an assignment or function call and instead saw an expression.
            /* jshint -W117 */ // omgwtf is not defined
            omgwtf
        } catch( e ) {
            stack = e.stack
        }

        if ( stack ) {
            var entries = stack.split( /\s+at\s+/ )
            var last = entries[ entries.length - 1 ]
            var m = last.match( /[(](.+?)(?:[:]\d+)+[)]/ )
            if ( m )
                for ( var i = 0; i < scripts.length; i += 1 ) {
                    if ( scripts[ i ].src != m[ 1 ] ) continue

                    script = scripts[ i ]
                    break
                }
        }

        window.SMK.INIT = function ( option ) {
            var containerSelector = option[ 'containerSel' ] || option[ 'smk-container-sel' ]

            setTimeout( function () {
                window.SMK.ON_FAILURE( err, document.querySelector( containerSelector ) )
            }, 2000 )
        }

        if ( script && script.attributes && script.attributes[ 'smk-container-sel' ] )
            window.SMK.INIT( { containerSel: script.attributes[ 'smk-container-sel' ].value } )

        window.SMK.FAILURE = err
        throw err
    }
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    try {
        setupGlobalSMK()

        // for esri3d
        window.dojoConfig = {
            has: {
                "esri-promise-compatibility": 1
            }
        }

        var scriptEl = document.currentScript
        if ( !SMK.BASE_URL ) {
            var path = scriptEl.src.replace( /([/]?)[^/?]+([?].+)?$/, function ( m, a ) { return a } )
            SMK.BASE_URL = ( new URL( path, document.location ) ).toString()
            console.debug( 'Default base path from', scriptEl.src, 'is', SMK.BASE_URL )
        }

        if ( scriptEl &&
            scriptEl.attributes &&
            scriptEl.attributes[ 'smk-container-sel' ] ) {
                var sel = scriptEl.attributes[ 'smk-container-sel' ].value

                SMK.INIT = function () {
                    SMK.BOOT = ( SMK.BOOT || Promise.resolve() )
                        .then( function () {
                            var e = Error( 'Cannot call SMK.INIT if map initialized from <script> element' )
                            SMK.ON_FAILURE( e, document.querySelector( sel ) )
                            throw e
                        } )

                    return SMK.BOOT
                }

                SmkInit( null, scriptEl )
        }
    }
    catch ( e ) {
        SMK.FAILURE = e
        throw e
    }
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    function SmkInit( option, scriptEl ) {
        if ( SMK.FAILURE ) throw SMK.FAILURE

        var attr = {}

        function defineAttr( name, attrName, defaultFn, filterFn ) {
            if ( !defaultFn ) defaultFn = function () {}
            if ( !filterFn ) filterFn = function ( val ) { return val }
            var scriptVal = scriptEl && scriptEl.attributes[ attrName ] && scriptEl.attributes[ attrName ].value
            var optionVal = option && ( option[ attrName ] || option[ name ] )
            var valFn = function () {
                if ( optionVal ) {
                    console.debug( 'attr', name, 'from INIT arguments:', optionVal )
                    return optionVal
                }

                if ( scriptVal ) {
                    console.debug( 'attr', name, 'from script element attribute:', scriptVal )
                    return scriptVal
                }

                var d = defaultFn()
                console.debug( 'attr', name, 'from default:', d )
                return d
            }
            var val
            Object.defineProperty( attr, name, {
                get: function () {
                    if ( valFn ) val = filterFn( valFn() )
                    valFn = null
                    return val
                }
            } )
        }

        defineAttr( 'id', 'smk-id', function () {
            return Object.keys( SMK.MAP ).length + 1
        } )

        defineAttr( 'containerSel', 'smk-container-sel' )

        defineAttr( 'config', 'smk-config', function () { return '?smk-' }, function ( val ) {
            if ( Array.isArray( val ) ) return val
            return val.split( /\s*[|]\s*/ ).filter( function ( i ) { return !!i } )
        } )

        defineAttr( 'baseUrl', 'smk-base-url', function () {
            return SMK.BASE_URL
        } )

        var timer = 'SMK "' + attr.id + '" initialize'
        console.time( timer )
        console.groupCollapsed( timer )

        SMK.BOOT = ( SMK.BOOT || Promise.resolve() )
            .then( function () {
                return parseConfig( attr.config )
            } )
            .then( function ( parsedConfig ) {
                attr.parsedConfig = parsedConfig
                return initializeSmkMap( attr )
            } )
            .catch( function ( e ) {
                try {
                    SMK.ON_FAILURE( e, document.querySelector( attr.containerSel ) )
                }
                catch ( ee ) {
                    console.error( 'failure showing failure:', ee )
                }
                throw e
            } )
            .finally( function () {
                console.groupEnd()
                console.timeEnd( timer )
            } )

        return SMK.BOOT
    }
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    function parseConfig( config ) {
        return config.reduce( function ( acc, c, i ) {
            var addParse = function ( source, getParse ) {
                source += ' in config[' + i + ']'

                try {
                    var parse = getParse()
                    if ( !parse ) return true

                    parse.$source = source
                    acc.push( parse )

                    return true
                }
                catch ( e ) {
                    if ( !e.parseSource)
                        e.parseSource = source

                    throw e
                }
            }

            if ( parseObject( c, addParse ) ) return acc
            if ( parseDocumentArguments( c, addParse ) ) return acc
            if ( parseLiteralJson( c, addParse ) ) return acc
            if ( parseOption( c, addParse ) ) return acc
            if ( parseUrl( c, addParse ) ) return acc

            return acc
        }, [] )
    }

    function parseObject( config, addParse ) {
        if ( typeof config != 'object' || Array.isArray( config ) || config === null ) return

        return addParse( 'object', function () {
            return { obj: config }
        } )
    }

    function parseDocumentArguments( config, addParse ) {
        if ( !/^[?]/.test( config ) ) return

        var paramPattern = new RegExp( '^' + config.substr( 1 ) + '(.+)$', 'i' )

        var params = location.search.substr( 1 ).split( '&' )

        params.forEach( function ( p, i ) {
            var addParamParse = function ( source, getParse ) {
                return addParse( source + ' in arg[' + config + ',' + i + ']', getParse )
            }

            var m
            try {
                var d = decodeURIComponent( p )
                m = d.match( paramPattern )
            }
            catch ( e ) {
                return
            }
            if ( !m ) return

            parseOption( m[ 1 ], addParamParse )
        } )

        return true
    }

    function parseLiteralJson( config, addParse ) {
        if ( !/^[{].+[}]$/.test( config ) ) return

        return addParse( 'json', function () {
            return { obj: JSON.parse( config ) }
        } )
    }

    function parseOption( config, addParse ) {
        var m = config.match( /^(.+?)([=](.+))?$/ )
        if ( !m ) return

        var option = m[ 1 ].toLowerCase()
        if ( !( option in optionHandler ) ) return

        return addParse( 'option[' + option + ']', function () {
            var res = optionHandler[ option ]( m[ 3 ], function ( source, getParse ) {
                return addParse( source + ' in option[' + option + ']', getParse )
            } )
            if ( res ) return { obj: res }
        } )
    }

    function parseUrl( config, addParse ) {
        return addParse( 'url[' + config + ']', function () {
            return { url: config }
        } )
    }

    var optionHandler = {
        'config': function ( arg, addParse ) {
            // return
            if ( parseLiteralJson( arg, addParse ) ) return
            if ( parseUrl( arg, addParse ) ) return
        },

        'theme': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length != 1 ) throw new Error( '-theme needs at least 1 argument' )
            return {
                viewer: {
                    themes: args
                }
            }
        },

        'device': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length != 1 ) throw new Error( '-device needs 1 argument' )
            return {
                viewer: {
                    device: args[ 0 ]
                }
            }
        },

        'extent': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length != 4 ) throw new Error( '-extent needs 4 arguments' )
            return {
                viewer: {
                    location: {
                        extent: args,
                        center: null,
                        zoom: null,
                    }
                }
            }
        },

        'center': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 2 || args.length > 3 ) throw new Error( '-center needs 2 or 3 arguments' )

            var loc = {
                center: [ args[ 0 ], args[ 1 ] ],
            }

            if ( args[ 2 ] )
                loc.zoom = args[ 2 ]

            return {
                viewer: {
                    location: loc
                }
            }
        },

        'viewer': function ( arg ) {
            return {
                viewer: {
                    type: arg
                }
            }
        },

        'active-tool': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length != 1 && args.length != 2 ) throw new Error( '-active-tool needs 1 or 2 arguments' )

            var toolId = args[ 0 ]
            if ( args[ 1 ] )
                toolId += '--' + args[ 1 ]

            return {
                viewer: {
                    activeTool: toolId
                }
            }
        },

        'query': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 3 && args.length != 1 ) throw new Error( '-query needs at least 3 arguments, or exactly 1' )

            var queryId = 'makeshift'

            var layerId = args[ 0 ]
            if ( args.length == 1 )
                return {
                    viewer: {
                        activeTool: 'QueryParametersTool--' + layerId + '--' + queryId,
                    },
                    tools: [
                        {
                            type: 'query',
                            instance: layerId + '--' + queryId,
                            enabled: true,
                            position: 'toolbar',
                            command: { attributeMode: true },
                            onActivate: 'execute'
                        },
                        {
                            type: 'toolbar',
                            enabled: true,
                        }
                    ],
                    layers: [ {
                        id: layerId,
                        queries: [ {
                            id: queryId,
                            title: 'Querying ' + layerId,
                            description: 'Created using: ' + arg,
                            parameters: [ { id: 'p1', type: 'constant', value: 1 } ],
                            predicate: {
                                operator: 'equals',
                                arguments: [ { operand: 'parameter', id: 'p1' }, { operand: 'parameter', id: 'p1' } ]
                            }
                        } ]
                    } ]
                }

            var conj = args[ 1 ].trim().toLowerCase()
            if ( conj != 'and' && conj != 'or' ) throw new Error( '-query conjunction must be one of: AND, OR' )

            var parameters = []
            var opName = {
                '~':  ' contains',
                '^~': ' starts with',
                '$~': ' ends with',
                '=':  ' is equal to',
                '>':  ' is greater than',
                '<':  ' is less than',
                '>=': ' is greater than or equal to',
                '<=': ' is less than or equal to',
            }
            function parameter( value, op, field ) {
                var id = 'p' + ( parameters.length + 1 )
                if ( value == '?' ) {
                    parameters.push( {
                        id: id,
                        type: 'input',
                        title: field + opName[ op ]
                    } )
                }
                else if ( value == '@' ) {
                    parameters.push( {
                        id: id,
                        type: 'select-unique',
                        title: field + opName[ op ],
                        uniqueAttribute: field
                    } )
                }
                else {
                    parameters.push( {
                        id: id,
                        type: 'constant',
                        value: JSON.parse( value )
                    } )
                }

                return id
            }

            var clauses = args.slice( 2 ).map( function ( p ) {
                var m = p.trim().match( /^(\w+)\s*([$^]?~|=|<=?|>=?)\s*(.+?)$/ )
                if ( !m ) throw new Error( '-query expression is invalid' )

                var args = [
                    { operand: 'attribute', name: m[ 1 ] },
                    { operand: 'parameter', id: parameter( m[ 3 ], m[ 2 ], m[ 1 ] ) }
                ]

                switch ( m[ 2 ].toLowerCase() ) {
                    case '~':  return { operator: 'contains', arguments: args }
                    case '^~': return { operator: 'starts-with', arguments: args }
                    case '$~': return { operator: 'ends-with', arguments: args }
                    case '=':  return { operator: 'equals', arguments: args }
                    case '>':  return { operator: 'greater-than', arguments: args }
                    case '<':  return { operator: 'less-than', arguments: args }
                    case '>=': return { operator: 'not', arguments: [ { operator: 'less-than', arguments: args } ] }
                    case '<=': return { operator: 'not', arguments: [ { operator: 'greater-than', arguments: args } ] }
                }
            } )

            return {
                viewer: {
                    activeTool: 'QueryParametersTool--' + layerId + '--' + queryId
                },
                tools: [
                    {
                        type: 'query',
                        instance: layerId + '--' + queryId,
                        enabled: true,
                        position: 'toolbar',
                        command: { attributeMode: true },
                        onActivate: 'execute'
                    },
                    {
                        type: 'toolbar',
                        enabled: true,
                    }
                ],
                layers: [ {
                    id: layerId,
                    queries: [ {
                        id: queryId,
                        title: 'Querying ' + layerId,
                        description: 'Created using: ' + arg,
                        parameters: parameters,
                        predicate: {
                            operator: conj,
                            arguments: clauses
                        }
                    } ]
                } ]
            }
        },

        'layer': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 2 ) throw new Error( '-layer needs at least 2 arguments' )

            var layerId = 'layer-' + arg.replace( /[^a-z0-9]+/ig, '-' ).replace( /(^[-]+)|([-]+$)/g, '' ).toLowerCase()

            var type = args[ 0 ].trim().toLowerCase()
            switch ( type ) {
                case 'esri-dynamic':
                    if ( args.length < 3 ) throw new Error( '-layer=esri-dynamic needs at least 3 arguments' )
                    return {
                        layers: [ {
                            id:         layerId,
                            type:       'esri-dynamic',
                            isVisible:  true,
                            serviceUrl: args[ 1 ],
                            mpcmId:     args[ 2 ],
                            title:      args[ 3 ] || ( 'ESRI Dynamic ' + args[ 2 ] ),
                        } ]
                }

                case 'wms':
                    if ( args.length < 3 ) throw new Error( '-layer=wms needs at least 3 arguments' )
                    return {
                        layers: [ {
                            id:         layerId,
                            type:       'wms',
                            isVisible:  true,
                            serviceUrl: args[ 1 ],
                            layerName:  args[ 2 ],
                            styleName:  args[ 3 ],
                            title:      args[ 4 ] || ( 'WMS ' + args[ 2 ] ),
                        } ]
                }

                case 'vector':
                    return {
                        layers: [ {
                            id:         layerId,
                            type:       'vector',
                            isVisible:  true,
                            dataUrl:    args[ 1 ],
                            title:      args[ 2 ] || ( 'Vector ' + args[ 1 ] ),
                        } ]
                    }

                default: throw new Error( 'unknown layer type: ' + type )
            }
        },

        'show-tool': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 1 ) throw new Error( '-show-tool needs at least 1 argument' )

            return {
                tools: args.map( function ( type ) {
                    if ( type == 'all' ) type = '*'
                    return {
                        type: type,
                        enabled: true
                    }
                } )
            }
        },

        'hide-tool': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 1 ) throw new Error( '-hide-tool needs at least 1 argument' )

            return {
                tools: args.map( function ( type ) {
                    if ( type == 'all' ) type = '*'
                    return {
                        type: type,
                        enabled: false
                    }
                } )
            }
        },

        'show-layer': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 1 ) throw new Error( '-show-layer needs at least 1 argument' )

            return {
                layers: args.map( function ( id ) {
                    if ( id == 'all' ) id = '**'
                    return {
                        id: id,
                        isVisible: true
                    }
                } )
            }
        },

        'hide-layer': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 1 ) throw new Error( '-hide-layer needs at least 1 argument' )

            return {
                layers: args.map( function ( id ) {
                    if ( id.toLowerCase() == 'all' ) id = '**'
                    return {
                        id: id,
                        isVisible: false
                    }
                } )
            }
        },

        'storage': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length < 1 ) throw new Error( '-storage needs at least 1 argument' )

            return args.map( function ( key ) {
                return JSON.parse( window.sessionStorage.getItem( key ) )
            } )
        },

        // Options below are for backward compatibility with DMF

        'll': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length != 2 ) throw new Error( '-ll needs 2 arguments' )

            return {
                viewer: {
                    location: {
                        center: [ args[ 0 ], args[ 1 ] ]
                    }
                }
            }
        },

        'z': function ( arg ) {
            var args = arg.split( ',' )
            if ( args.length != 1 ) throw new Error( '-z needs 1 argument' )

            return {
                viewer: {
                    location: {
                        zoom: args[ 0 ]
                    }
                }
            }
        },

    }
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    function initializeSmkMap( attr ) {
        include.option( { baseUrl: attr.baseUrl + 'assets/src/' } )

        if ( attr.id in SMK.MAP )
            throw new Error( 'An SMK map with smk-id "' + attr.id + '" already exists' )

        return include( 'smk-map' ).then( function () {
            console.log( 'Creating map "' + attr.id + '":', JSON.parse( JSON.stringify( attr ) ) )

            var map = SMK.MAP[ attr.id ] = new SMK.TYPE.SmkMap( attr )
            return map.initialize()
        } )
    }
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    function setupGlobalSMK() {
        return ( window.SMK = Object.assign( {
            INIT: SmkInit,
            MAP: {},
            VIEWER: {},
            TYPE: {},
            UTIL: {},
            COMPONENT: {},

            CONFIG: {
                name: 'SMK Default Map',
                viewer: {
                    type: "leaflet",
                    device: "auto",
                    deviceAutoBreakpoint: 500,
                    themes: [],
                    location: {
                        extent: [ -139.1782, 47.6039, -110.3533, 60.5939 ],
                    },
                    baseMap: 'Topographic',
                    clusterOption: {
                        showCoverageOnHover: false
                    }
                },
                tools: []
            },

            BOOT: Promise.resolve(),
            TAGS_DEFINED: false,

            BUILD: {
                commit:     '<%= gitinfo.local.branch.current.SHA %>',
                branch:     '<%= gitinfo.local.branch.current.name %>',
                lastCommit: '<%= gitinfo.local.branch.current.lastCommitTime %>',
                origin:     '<%= gitinfo.remote.origin.url %>',
                version:    '<%= package.version %>',
            },

            HANDLER: {
                handler: {},
                set: function ( id, method, handler ) {
                    if ( !this.handler[ id ] ) this.handler[ id ] = {}
                    this.handler[ id ][ method ] = handler
                },
                get: function ( id, method ) {
                    if ( this.handler[ id ] && this.handler[ id ][ method ] ) return this.handler[ id ][ method ]

                    return function () {
                        console.warn( 'handler ' + id + '.' + method + ' invoked' )
                    }
                },
                has: function ( id, method ) {
                    return !!( this.handler[ id ] && this.handler[ id ][ method ] )
                }
            },

            PROJECTIONS: [
                {
                    name: 'urn:ogc:def:crs:EPSG::3005',
                    def: '+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 +x_0=1000000 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs'
                },
                {
                    name: 'bc-albers',
                    alias: 'urn:ogc:def:crs:EPSG::3005',
                }
            ]

        }, window.SMK ) )
    }

} )();

