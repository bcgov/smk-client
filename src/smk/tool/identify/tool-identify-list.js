include.module( 'tool-identify.tool-identify-list-js', [
    'tool.tool-base-js',
    'tool.tool-widget-js',
    'tool.tool-feature-list-js',
    'tool.tool-internal-layers-js',
    'component-feature-list',
    'component-command-button',
    'component-enter-input',
    'tool-identify.panel-identify-html',
], function ( inc ) {
    "use strict";

    Vue.component( 'identify-widget', {
        extends: SMK.COMPONENT.ToolWidgetBase,
    } )

    Vue.component( 'identify-panel', {
        extends: SMK.COMPONENT.ToolPanelBase,
        template: inc[ 'tool-identify.panel-identify-html' ],
        props: [ 'tool', 'layers', 'highlightId', 'command', 'radius', 'radiusUnit' ],
        methods: {
            formatNumber: function ( value, fractionPlaces ) {
                var i = Math.floor( value ),
                    f = value - i

                return i.toString() + f.toFixed( fractionPlaces ).substr( 1 )
            }
        }
    } )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    return SMK.TYPE.Tool.define( 'IdentifyListTool', {
        construct: function () {
            SMK.TYPE.ToolWidget.call( this, 'identify-widget' )
            SMK.TYPE.ToolPanel.call( this, 'identify-panel' )
            SMK.TYPE.ToolFeatureList.call( this, function ( smk ) { return smk.$viewer.identified } )
            SMK.TYPE.ToolInternalLayers.call( this )

            this.defineProp( 'tool' )
            this.defineProp( 'command' )
            this.defineProp( 'radius' )
            this.defineProp( 'radiusUnit' )

            this.tool = {}
        },

        initialize: function ( smk ) {
            var self = this

            this.tool = smk.getToolTypesAvailable()

            this.changedGroup( function () {
                if ( self.group ) {
                    self.displaySearchArea()
                }
                else {
                    self.busy = false
                    self.searchArea = null
                    self.searchLocation = null
                    self.trackMouse = false
                    self.clearMarker()

                    self.setInternalLayerVisible( false )
                    smk.$viewer.identifyFeatures()

                    smk.$viewer.identified.clear()
                    smk.$viewer.identified.pick()
                }
            } )

            self.changedActive( function () {
                if ( self.active ) {
                    SMK.HANDLER.get( self.id, 'activated' )( smk, self )

                    if ( self.onActivate ) {
                        switch ( self.onActivate ) {
                        case 'current-location':
                            smk.emit( self.id, 'current-location' )
                            break
                        }
                    }
                }
                else {
                    SMK.HANDLER.get( self.id, 'deactivated' )( smk, self )
                }
            } )


            // fallback handler if nothing else uses pick
            smk.$viewer.handlePick( 0, function ( location ) {
                return self.startIdentify( location )
                    .then( function () { return true }, function () { return true } )
            } )

            smk.$viewer.handlePick( 2, function ( location ) {
                if ( !self.active ) return

                return self.startIdentify( location )
                    .then( function () { return true }, function () { return true } )
            } )

            this.getRadiusMeters = function () {
                return smk.$viewer.distanceToMeters( self.radius, self.radiusUnit )
            }

            this.setRadiusMeters = function ( radiusMeters ) {
                self.radius = smk.$viewer.distanceFromMeters( radiusMeters, self.radiusUnit )
            }

            this.identifyStarts = 0
            this.startIdentify = function ( location ) {
                if ( this.getRadiusMeters() < 0.1 ) {
                    self.showStatusMessage( 'Identify radius must be > 0', 'warning' )

                    this.busy = false
                    this.searchArea = null
                    this.searchLocation = null
                    this.trackMouse = false
                    this.clearMarker()

                    this.setInternalLayerVisible( false )
                    smk.$viewer.identifyFeatures()

                    smk.$viewer.identified.clear()
                    smk.$viewer.identified.pick()
                    return Promise.resolve()
                }

                self.busy = true
                this.searchLocation = location
                // console.warn('startIdentify')
                self.showStatusMessage( 'Fetching features', 'progress', null )
                this.displaySearchArea()
                this.identifyStarts += 1
                this.startedIdentify()

                var area = this.makeSearchLocationCircle( null, 16 )
                return smk.$viewer.identifyFeatures( location, area )
                    .then( function () {
                        self.busy = false

                        if ( smk.$viewer.identified.isEmpty() ) {
                            smk.$sidepanel.setExpand( 0 )
                            self.setInternalLayerVisible( false )
                            self.showStatusMessage( 'No features found', 'warning' )
                        }
                        else {
                            self.active = true

                            var stat = smk.$viewer.identified.getStats()
                            var sub = SMK.UTIL.grammaticalNumber( stat.layerCount, null, null, 'on {} layers' )
                            // if ( stat.vertexCount > stat.featureCount )
                            //     sub += ( sub == '' ? '' : ', ' ) + SMK.UTIL.grammaticalNumber( stat.vertexCount, null, null, 'with {} vertices' )
                            if ( sub != '' ) sub = '<div>' + sub + '</div>'
                            self.showStatusMessage( '<div>Identified ' + SMK.UTIL.grammaticalNumber( stat.featureCount, null, 'a feature', '{} features' ) + '</div>' + sub )

                            if ( stat.featureCount == 1 )
                                smk.$viewer.identified.pick( self.firstId )
                        }

                        self.finishedIdentify()
                    } )
                    .catch( function ( e ) {
                        console.warn( 'identify failed', e )
                        if ( e.discarded ) {
                            if ( self.identifyStarts == 1 )
                                self.showStatusMessage()

                            return
                        }

                        self.setInternalLayerVisible( false )
                        // self.showStatusMessage( '<div>Failed while finding features:</div><div>' + e + '</div>', 'error' )
                        self.showStatusMessage( e.toString(), 'error' )
                    } )
                    .finally( function () {
                        self.identifyStarts -= 1
                    } )
            }

            this.restartIdentify = function () {
                if ( self.searchLocation )
                    this.startIdentify( self.searchLocation )
            }

            smk.on( this.id, {
                'add-all': function ( ev ) {
                    var lyfts = self.layers.map( function ( ly ) {
                        return [ ly.id, ly.features.map( function ( ft ) {
                            return smk.$viewer.identified.get( ft.id )
                        } ) ]
                    } )

                    lyfts.forEach( function ( lf ) {
                        smk.$viewer.selected.add.apply( smk.$viewer.selected, lf )
                    } )
                },

                'clear': function ( ev ) {
                    self.showStatusMessage( 'Click on map to identify features.' )
                },

                'swipe-up': function ( ev ) {
                    smk.$sidepanel.setExpand( 2 )
                },

                'swipe-down': function ( ev ) {
                    smk.$sidepanel.incrExpand( -1 )
                },

                'change': function ( ev, comp ) {
                    Object.assign( self, ev )
                    self.restartIdentify()
                },

                'changeUnit': function ( ev, comp ) {
                    var d = self.getRadiusMeters()
                    Object.assign( self, ev )
                    self.setRadiusMeters( d )
                },

                'current-location': function () {
                    self.busy = true
                    self.showStatusMessage( 'Finding current location...', 'progress', null )

                    return smk.$viewer.getCurrentLocation()
                        .then( function ( res ) {
                            self.busy = false
                            self.showStatusMessage()
                            return self.startIdentify( { map: res } )
                                .then( function () {
                                    smk.$viewer.panToFeature( self.searchArea, true )
                                } )
                        } )
                        .catch( function () {
                            self.busy = false
                            self.showStatusMessage( 'Unable to get current location', 'error' )
                        } )
                }
            } )

            this.bufferDistance = function () {
                return smk.$viewer.distanceToMeters( 20, 'px' )
            }

            this.trackMouse = false
        },

        events: [
            'startedIdentify',
            'finishedIdentify'
        ],

        methods: {
            makeSearchLocationCircle: function ( radiusMeters, steps ) {
                return turf.circle(
                    [ this.searchLocation.map.longitude, this.searchLocation.map.latitude ],
                    ( radiusMeters || this.getRadiusMeters() ) / 1000,
                    { steps: steps || 64 }
                )
            },

            closestPointOnBoundary: function ( latLng ) {
                if ( !this.searchArea ) return

                var ls = turf.polygonToLine( this.searchArea )
                var pt = turf.nearestPointOnLine( ls, [ latLng.lng, latLng.lat ] )

                return [ pt.geometry.coordinates[ 1 ], pt.geometry.coordinates[ 0 ] ]
            },

            displaySearchArea: function () {
                this.trackMouse = false

                if ( !this.searchLocation ) return

                this.searchArea = this.makeSearchLocationCircle()

                this.setInternalLayerVisible( true )
                this.displayEditSearchArea()

                this.internalLayer[ '@identify-search-area' ].clear()
                this.internalLayer[ '@identify-search-area' ].load( this.searchArea )

                this.internalLayer[ '@identify-location' ].clear()
                this.internalLayer[ '@identify-location' ].load( turf.point( [ this.searchLocation.map.longitude, this.searchLocation.map.latitude ] ) )

                this.trackMouse = true
            },

            displayEditSearchArea: function ( editArea ) {
                this.internalLayer[ '@identify-edit-search-area' ].clear()
                if ( editArea )
                    this.internalLayer[ '@identify-edit-search-area' ].load( editArea )
            }
        }
    } )
} )
