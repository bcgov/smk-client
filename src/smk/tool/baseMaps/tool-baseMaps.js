include.module( 'tool-baseMaps', [
    'tool.tool-base-js',
    'tool.tool-widget-js',
    'tool.tool-panel-js',
    'viewer',
    'leaflet',
    'tool-baseMaps.panel-base-maps-html'
], function ( inc ) {
    "use strict";

    Vue.component( 'baseMaps-widget', {
        extends: SMK.COMPONENT.ToolWidgetBase,
    } )

    Vue.component( 'baseMaps-panel', {
        extends: SMK.COMPONENT.ToolPanelBase,
        template: inc[ 'tool-baseMaps.panel-base-maps-html' ],
        props: [ 'current', 'basemaps', 'mapStyle' ]
    } )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    return SMK.TYPE.Tool.define( 'BaseMapsTool',
        function () {
            SMK.TYPE.ToolWidget.call( this, 'baseMaps-widget' )
            SMK.TYPE.ToolPanel.call( this, 'baseMaps-panel' )

            this.defineProp( 'current' )
            this.defineProp( 'basemaps' )
            this.defineProp( 'mapStyle' )
        },
        function ( smk ) {
            var self = this

            this.basemaps = Object.keys( smk.$viewer.basemap )
                .map( function ( id ) {
                    return Object.assign( { id: id }, smk.$viewer.basemap[ id ] )
                } )
                .filter( function ( bm ) {
                    if ( !self.choices || self.choices.length == 0 ) return true
                    if ( self.choices.indexOf( bm.id ) > -1 ) return true
                    if ( smk.viewer.baseMap == bm.id ) return true

                    return false
                } )
                .sort( function ( a, b ) { return a.order - b.order } )
                .map( function ( bm ) {
                    var m

                    bm.create = function ( el ) {
                        m = L.map( el, {
                            attributionControl: false,
                            zoomControl: false,
                            dragging: false,
                            keyboard: false,
                            scrollWheelZoom: false,
                            zoom: 10,
                            zoomSnap: 0
                        } );

                        var bmLayers = smk.$viewer.createBasemapLayer( bm.id )
                        m.addLayer( bmLayers[ 0 ] )
                    }

                    bm.update = function () {
                        var v = smk.$viewer.getView()
                        m.setView( [ v.center.latitude, v.center.longitude ], v.zoom )
                    }

                    return bm
                } )

            this.current = smk.viewer.baseMap

            this.changedActive( function () {
                if ( self.active ) {
                    if ( self.showPanel === false ) {
                        SMK.HANDLER.get( self.id, 'triggered' )( smk, self )
                    }
                    else {
                        SMK.HANDLER.get( self.id, 'activated' )( smk, self )

                        Vue.nextTick( function () {
                            self.basemaps.forEach( function ( bm ) {
                                bm.update()
                            } )
                        } )
                    }
                }
                else {
                    SMK.HANDLER.get( self.id, 'deactivated' )( smk, self )
                }
            } )

            smk.on( this.id, {
                'activate': function () {
                    if ( !self.enabled ) return

                    if ( self.showPanel === false ) {
                        self.active = false
                        var i = self.basemaps.findIndex( function ( b ) {
                            return b.id == self.current
                        } )
                        setBasemap( self.basemaps[ ( i + 1 ) % self.basemaps.length ] )
                    }
                },

                'set-base-map': function ( ev ) {
                    setBasemap( ev )
                }
            } )

            function setBasemap( basemap ) {
                smk.$viewer.setBasemap( basemap.id )
            }

            smk.$viewer.changedBaseMap( function ( ev ) {
                self.current = ev.baseMap
                var bm = self.basemaps.find( function ( b ) {
                    return b.id == self.current
                } )
                self.status = 'basemap-' + bm.id
                self.title = 'Base Map: ' + bm.title
            } )

            smk.$viewer.changedView( function ( ev ) {
                if ( !self.active ) return

                self.basemaps.forEach( function ( bm ) {
                    bm.update()
                } )
            } )

            smk.$viewer.setBasemap( smk.viewer.baseMap )
        }
    )
} )
