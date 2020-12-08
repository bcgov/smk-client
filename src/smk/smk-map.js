include.module( 'smk-map', [ 'libs', 'util', 'theme-base', 'sidepanel', 'status-message', 'vue-config.spinner-gif', 'merge-config', 'default-config' ], function ( inc ) {
    "use strict";

    function SmkMap( option ) {
        this.$option = option

        this.$dispatcher = new Vue()

        this.$group = {}
    }

    SMK.TYPE.SmkMap = SmkMap

    SmkMap.prototype.resolveAssetUrl = function ( url ) {
        return ( new URL( url, this.$option.baseUrl + 'assets/src/' ) ).toString()
    }

    SmkMap.prototype.initialize = function () {
        var self = this

        var container = $( this.$option.containerSel )
        if ( container.length != 1 )
            throw new Error( 'smk-container-sel "' + this.$option.containerSel + '" doesn\'t match a unique element' )

        container.empty()
        container.addClass( 'smk-map-frame smk-hidden' )

        var p = container.position()
        var spinner = $( '<img>' )
            .attr( 'src', inc[ 'vue-config.spinner-gif' ] )
            .insertAfter( container )
            .css( {
                zIndex:     99999,
                visibility: 'visible',
                position:   'absolute',
                width:      64,
                height:     64,
                left:       p.left + container.outerWidth() / 2 - 32,
                top:        p.top + container.outerHeight() / 2 - 32,
            } )

        container.empty()

        this.$container = container.get( 0 )

        return SMK.UTIL.resolved()
            .then( loadConfigs )
            .then( mergeConfigs )
            // .then( resolveConfig )
            .then( initMapFrame )
            .then( resolveDeviceConfig )
            .then( loadViewer )
            .then( loadTools )
            .then( initViewer )
            .then( initTools )
            .then( showMap )
            .finally( function () {
                return ( new Promise( function ( res ) {
                        container
                            .hide()
                            .removeClass( 'smk-hidden' )
                            .fadeIn( 1000, res )

                        spinner.fadeOut( 1000 )
                    } ) )
                    .then( function () {
                        spinner.remove()
                    } )
            } )

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        function loadConfigs() {
            return SMK.UTIL.waitAll( self.$option.parsedConfig.map( function ( c ) {
                if ( c.obj ) {
                    c.obj.$source = c.$source
                    return SMK.UTIL.resolved( c.obj )
                }

                var id = c.url.toLowerCase().replace( /[^a-z0-9]+/g, '-' ).replace( /^[-]|[-]$/g, '' )
                var tag = 'config-' + id
                try {
                    include.tag( tag, { loader: 'template', url: c.url } )
                }
                catch ( e ) {
                    console.warn( e )
                }

                return include( tag )
                    .then( function ( inc ) {
                        var obj = JSON.parse( inc[ tag ] )
                        obj.$source = c.$source
                        return obj
                    } )
                    .catch( function ( e ) {
                        console.warn( 'failed to load tag "' + tag + '" for ' + c.$source )
                        e.parseSource = c.$source
                        throw e
                    } )
            } ) )
        }

        function mergeConfigs( configs ) {
            Object.assign( self, inc[ 'merge-config' ]( configs ) )
        }

        function resolveConfig() {
            if ( !self.layers ) return

            return SMK.UTIL.waitAll( self.layers.map( function ( ly ) {
                if ( ly.type != 'esri-dynamic' ) return ly
                if ( ly.dynamicLayers ) return ly
                if ( !ly.mpcmId ) throw new Error( 'No mpcmId provided' )

                return SMK.UTIL.makePromise( function ( res, rej ) {
                    $.ajax( {
                        url: 'https://mpcm-catalogue.api.gov.bc.ca/catalogV2/PROD/' + ly.mpcmId,
                        dataType: 'xml'
                    } ).then( res, rej )
                } )
                .then( function ( data ) {
                    // debugger
                } )
                // console.log( ly )

            } ) )
        }

        function initMapFrame() {
            $( self.$container )
                .addClass( 'smk-viewer-' + self.viewer.type )

            var themes = [ 'base' ].concat( self.viewer.themes ).map( function ( th ) { return 'theme-' + th } )

            $( self.$container )
                .addClass( themes.map( function ( th ) { return 'smk-' + th } ).join( ' ' ) )

            self.detectDevice()

            if ( self.viewer.panelWidth )
                self.setVar( 'panel-width', self.viewer.panelWidth + 'px' )

            return include( themes )
        }

        function resolveDeviceConfig() {
            findProperty( self, 'tools', 'enabled', function ( val ) {
                if ( typeof val == 'string' ) return val == self.$device
            } )

            findProperty( self, 'tools', 'showTitle', function ( val ) {
                if ( typeof val == 'string' ) return val == self.$device
            } )

            findProperty( self, 'tools', 'control', function ( val ) {
                if ( typeof val == 'string' ) return val == self.$device
            } )
        }

        function loadViewer() {
            return include( 'viewer-' + self.viewer.type )
                .catch( function ( e ) {
                    e.message += ', viewer type ' + ( self.viewer.type ? '"' + self.viewer.type + '" ' : '' ) + 'is not defined'
                    throw e
                    // throw new Error( 'viewer type ' + ( self.viewer.type ? '"' + self.viewer.type + '" ' : '' ) + 'is not defined' )
                } )
        }

        function loadTools() {
            self.$tool = {}
            self.$toolType = {}

            if ( !self.tools ) return
            var enabledTools = self.tools.filter( function ( t ) { return t.enabled !== false && t.instance !== true } )
            if ( enabledTools.length == 0 ) return

            return SMK.UTIL.waitAll( enabledTools.map( function ( t ) {
                var tag = 'tool-' + t.type
                return include( tag )
                    .then( function ( inc ) {
                        return include( tag + '-' + self.viewer.type )
                            .catch( function () {
                                console.debug( tag + ' has no ' + self.viewer.type + ' subclass' )
                            } )
                            .then( function () {
                                return inc
                            } )
                    } )
                    .then( function ( inc ) {
                        var tools = inc[ tag ]( t )

                        tools.forEach( function ( tool ) {
                            if ( !tool.id )
                                throw Error( 'tool with no id' )

                            if ( tool.id in self.$tool )
                                throw Error( 'tool "' + tool.id + '" is defined more than once' )
                                // return

                            if ( !self.$toolType[ tool.type ] ) self.$toolType[ tool.type ] = []
                            self.$toolType[ tool.type ].push( tool )

                            self.$tool[ tool.id ] = tool
                        } )
                    } )
                    .catch( function ( e ) {
                        console.warn( 'Failed to create tool:' , e, t )
                } )
            } ) )
        }

        function initViewer() {
            if ( !( self.viewer.type in SMK.TYPE.Viewer ) )
                throw new Error( 'viewer type "' + self.viewer.type + '" not defined' )

            self.$viewer = new SMK.TYPE.Viewer[ self.viewer.type ]()
            return SMK.UTIL.resolved()
                .then( function () {
                    return self.$viewer.initialize( self )
                } )
                .then( function () {
                    return self.$viewer.initializeLayers( self )
                } )
        }

        function initTools() {
            var tools = Object.values( self.$tool )
                .sort( function ( a, b ) { return a.order - b.order } )

            return SMK.UTIL.waitAll( tools.map( function ( t ) {
                return SMK.UTIL.resolved()
                    .then( function () {
                        return t.initialize( self )
                    } )
                    .catch( function ( e ) {
                        console.error( 'tool "' + t.id + '" failed to initialize:', e )
                    } )
                    .then( function ( tool ) {
                        console.log( 'tool "' + t.id + '" initialized' )
                    } )
            } ) )
        }

        function showMap() {
            if ( !self.$viewer.isDisplayContext( 'layers' ) )
                self.$viewer.setDisplayContextItems( 'layers', self.$viewer.defaultLayerDisplay )

            return SMK.UTIL.resolved()
                .then( function () {
                    return self.$viewer.updateLayersVisible()
                } )
                .then( function () {
                    return self.$viewer.waitFinishedLoading()
                } )
                .then( function () {
                    if ( self.viewer.activeTool )
                        self.withTool( self.viewer.activeTool, function ( t ) {
                            console.log( 'activating tool:', t.id )
                            t.active = true
                        } )
                    return self
                } )


        }
    }

    SmkMap.prototype.destroy = function () {
        if ( this.$viewer )
            this.$viewer.destroy()

        delete SMK.MAP[ this.$option.id ]
    }

    SmkMap.prototype.addToContainer = function ( html, attr, prepend ) {
        return $( html )[ prepend ? 'prependTo' : 'appendTo' ]( this.$container ).attr( attr || {} ).get( 0 )
    }

    SmkMap.prototype.addToOverlay = function ( html ) {
        if ( !this.$overlay )
            this.$overlay = this.addToContainer( '<div class="smk-overlay">' )

        return $( html ).appendTo( this.$overlay ).get( 0 )
    }

    SmkMap.prototype.addToStatus = function ( html ) {
        if ( !this.$status )
            this.$status = this.addToOverlay( '<div class="smk-status smk-elastic-container">' )

        return $( html ).appendTo( this.$status ).get( 0 )
    }

    SmkMap.prototype.getSidepanel = function () {
        var self = this

        if ( this.$sidepanel ) return this.$sidepanel

        this.$sidepanel = new SMK.TYPE.Sidepanel( this )

        this.$sidepanel.changedVisible( function () {
            $( self.$container ).toggleClass( 'smk-sidepanel-active', self.$sidepanel.isPanelVisible() )

            // self.$viewer.mapResized()
        } )

        this.$sidepanel.changedSize( function () {
            // console.log( 'changedSize', self.getSidepanelPosition() )
        } )

        return this.$sidepanel
    }

    SmkMap.prototype.getSidepanelPosition = function () {
        if ( !this.$sidepanel || !this.$sidepanel.isPanelVisible() )
            return { left: 0, width: 0, top: 0, height: 0 }

        var overlayEl = this.$overlay
        var sidepanelEl = this.$sidepanel.vm.$el

        return {
            left: overlayEl.offsetLeft + sidepanelEl.offsetLeft,
            top: overlayEl.offsetTop + sidepanelEl.offsetTop,
            width: sidepanelEl.clientWidth,
            height: sidepanelEl.clientHeight,
        }
    }

    SmkMap.prototype.setEditFocus = function ( focus ) {
        $( this.$container ).toggleClass( 'smk-edit-focus', focus )
    }

    SmkMap.prototype.debugMessage = function ( opt ) {
        if ( !this.debugVm ) {
            this.debugVm = new Vue( {
                el: this.addToOverlay( '<div class="smk-debug"><div v-for="k in keys">{{ k }} : {{ status[ k ] }}</div></div>' ),
                data: {
                    status: {}
                },
                computed: {
                    keys: {
                        get: function () {
                            return Object.keys( this.status )
                        }
                    }
                }
            } )
        }

        opt.ts = (new Date()).toLocaleTimeString()
        var d = this.debugVm.$data
        Object.keys( opt || {} ).forEach( function ( k ) {
            Vue.set( d.status, k, opt[ k ] )
        } )

    }

    SmkMap.prototype.getVar = function ( cssVar ) {
        return $( this.$container ).css( '--' + cssVar )
    }

    SmkMap.prototype.setVar = function ( cssVar, value ) {
        return $( this.$container ).css( '--' + cssVar, value )
    }

    SmkMap.prototype.emit = function ( toolId, event, arg, comp ) {
        this.$dispatcher.$emit( toolId + '.' + event, arg, comp )

        return this
    }

    SmkMap.prototype.on = function ( toolId, handler ) {
        var self = this

        Object.keys( handler ).forEach( function ( k ) {
            self.$dispatcher.$on( toolId + '.' + k, handler[ k ] )
        } )

        return this
    }

    SmkMap.prototype.detectDevice = function () {
        var dev = this.viewer.device
        if ( dev == 'auto' ) {
            var w =  $( window ).width()
            // this.debugMessage( {
            //     width: w,
            //     height: $( window ).height(),
            //     iheight: window.innerHeight
            // } )
            dev = w >= this.viewer.deviceAutoBreakpoint ? 'desktop' : 'mobile'
        }

        // this.setVar( 'map-width', $( this.$container ).width() + 'px' )
        // this.setVar( 'map-height', $( this.$container ).height() + 'px' )

        // this.debugMessage( {
            // width: $( this.$container ).width(),
            // height: $( this.$container ).height(),
        // } )

        if ( dev == this.$device )
            return

        if ( this.$device )
            $( this.$container )
                .removeClass( 'smk-device-' + this.$device )

        this.$device = dev

        $( this.$container )
            .addClass( 'smk-device-' + this.$device )

        return this.$device
    }

    SmkMap.prototype.showFeature = function ( acetate, geometry, opt ) {
        if ( this.$viewer.temporaryFeature )
            this.$viewer.temporaryFeature( acetate, geometry, opt )
    }

    SmkMap.prototype.getToolGroup = function ( rootId ) {
        return this.$group[ rootId ]
    }

    SmkMap.prototype.setToolGroup = function ( rootId, ids ) {
        this.$group[ rootId ] = ids
    }

    SmkMap.prototype.getToolRootIds = function () {
        return Object.keys( this.$group )
    }

    SmkMap.prototype.getConfig = function () {
        var self = this

        var ks = [ 'name', 'viewer', 'tools' ]

        var cfg = ks.reduce( function ( acc, k ) {
            acc[ k ] = JSON.parse( JSON.stringify( self[ k ] ) )
            return acc
        }, {} )

        cfg.layers = this.$viewer.getLayerConfig()

        cfg.viewer.location = SMK.UTIL.projection( 'center', 'zoom', 'extent' )( this.$viewer.getView() )
        cfg.viewer.location.center = [ cfg.viewer.location.center.longitude, cfg.viewer.location.center.latitude ]

        cfg.viewer.displayContext = this.$viewer.getDisplayContextConfig()

        cfg.layers.forEach( function ( ly ) {
            var item = self.$viewer.getDisplayContextItem( ly.id )
            if ( item ) {
                ly.isVisible = self.$viewer.isDisplayContextItemVisible( ly.id )
                ly.class = item.class
            }
            else {
                ly.isVisible = false
            }
        } )

        return cfg
    }

    SmkMap.prototype.updateMapSize = function () {
        if ( this.$viewer.mapResized )
            this.$viewer.mapResized()
    }

    SmkMap.prototype.getStatusMessage = function () {
        var self = this

        if ( this.$statusMessage ) return this.$statusMessage

        this.$statusMessage = new SMK.TYPE.StatusMessage( this )

        return this.$statusMessage
    }

    SmkMap.prototype.getToolById = function ( id ) {
        if ( !id ) return
        return this.$tool[ id ]
    }

    SmkMap.prototype.getToolsByType = function ( type ) {
        if ( !type ) return []
        return this.$toolType[ type ] || []
    }

    SmkMap.prototype.hasToolType = function ( type ) {
        if ( !type ) return false
        return !!this.$toolType[ type ] && this.$toolType[ type ].length > 0
    }

    SmkMap.prototype.getToolTypesAvailable = function ( types ) {
        var self = this

        if ( !types || !Array.isArray( types ) || types.length == 0 )
            types = Object.keys( this.$toolType )

        return types.reduce( function ( acc, t ) {
            acc[ t ] = self.hasToolType( t )
            return acc
        }, {} )
    }

    SmkMap.prototype.forEachTool = function ( cb ) {
        return Object.values( this.$tool ).forEach( cb )
    }

    SmkMap.prototype.withTool = function ( toolIdOrType, action, context ) {
        var self = this

        if ( !toolIdOrType ) throw Error( 'no tool id or type' )

        var tool = this.getToolById( toolIdOrType )
        if ( tool ) {
            action.call( context || tool, tool )
            return
        }

        var tools = this.getToolsByType( toolIdOrType )
        if ( tools.length == 0 ) throw Error( 'tool type not defined' )
        if ( tools.length == 1 ) {
            action.call( context || tools[ 0 ], tools[ 0 ] )
            return
        }

        var rootId = tools.reduce( function ( acc, t ) {
            if ( acc === undefined ) return t.rootId
            if ( acc == t.rootId ) return acc
            return null
        }, undefined )
        if ( !rootId ) throw Error( 'tool type is ambiguous' )

        tool = this.getToolById( rootId )
        action.call( context || tool, tool )
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


    function findProperty( obj, collectionName, propName, cb ) {
        if ( !( collectionName in obj ) )
            throw new Error( collectionName + ' is not in obj' )

        if ( !Array.isArray( obj[ collectionName ] ) )
            throw new Error( collectionName + ' is not an array' )

        obj[ collectionName ].forEach( function ( item ) {
            if ( !( propName in item ) ) return

            var res = cb( item[ propName ] )
            if ( res === undefined ) return

            item[ propName ] = res
        } )
    }
} )
