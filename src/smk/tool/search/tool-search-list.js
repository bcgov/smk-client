include.module( 'tool-search.tool-search-list-js', [
    'tool.tool-base-js',
    'tool.tool-widget-js',
    'tool.tool-panel-js',
    'tool-search.widget-search-html',
    'tool-search.panel-search-html'
], function ( inc ) {
    "use strict";

    var request

    function doAddressSearch( text ) {
        if ( request )
            request.abort()

        var query = {
            ver:            1.2,
            maxResults:     10,
            outputSRS:      4326,
            addressString:  text,
            autoComplete:   true
        }

        return SMK.UTIL.resolved()
            .then( function () {
                return ( request = $.ajax( {
                    timeout:    10 * 1000,
                    dataType:   'json',
                    url:        'https://geocoder.api.gov.bc.ca/addresses.geojson',
                    data:       query,
                } ) )
            } )
            .then( function ( data ) {
                return $.map( data.features, function ( feature ) {
                    if ( !feature.geometry.coordinates ) return;

                    // exclude whole province match
                    if ( feature.properties.fullAddress == 'BC' ) return;

                    if ( feature.properties.intersectionName ) {
                        feature.title = feature.properties.intersectionName
                    }
                    else if ( feature.properties.streetName ) {
                        feature.title = [
                            feature.properties.civicNumber,
                            feature.properties.streetName,
                            feature.properties.streetQualifier,
                            feature.properties.streetType
                        ].filter( function ( x ) { return !!x } ).join( ' ' )
                    }
                    else if ( feature.properties.localityName ) {
                        feature.title = feature.properties.localityName
                    }

                    return feature
                } )
            } )
    }
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    Vue.component( 'search-widget', {
        extends: SMK.COMPONENT.ToolWidgetBase,
        template: inc[ 'tool-search.widget-search-html' ],
        props: [ 'initialSearch', 'results', 'highlightId' , 'showPanel' ],
        data: function () {
            return {
                search: null
            }
        },
        watch: {
            initialSearch: function ( val ) {
                this.search = val
            }
        },
        computed: {
            classes: function () {
                var c = {}
                c[ 'smk-' + this.type + '-tool' ] = true
                return Object.assign( c, {
                    'smk-tool-active': this.active,
                    'smk-tool-visible': this.visible,
                    'smk-tool-enabled': this.enabled
                } )
            }
        },
        methods: {
            widgetWidth: function () {
                return this.$refs.widget.clientWidth
            },
            focus: function () {
                var inp = this.$refs[ 'search-input' ]
                if ( !this.active )
                    inp.focus()
                    inp.setSelectionRange( 0, 0 )
                    inp.setSelectionRange( 0, inp.value.length )
            },
            isEmpty: function () {
                return !this.results || this.results.length == 0
            }
        }
    } )

    Vue.component( 'search-panel', {
        extends: SMK.COMPONENT.ToolPanelBase,
        template: inc[ 'tool-search.panel-search-html' ],
        props: [ 'results', 'highlightId' ],
        methods: {
            isEmpty: function () {
                return !this.results || this.results.length == 0
            }
        },
        data: function () {
            return {
                search: null
            }
        }
    } )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    return SMK.TYPE.Tool.define( 'SearchListTool',
        function () {
            SMK.TYPE.ToolWidget.call( this, 'search-widget' )
            SMK.TYPE.ToolPanel.call( this, 'search-panel' )

            this.defineProp( 'results' )
            this.defineProp( 'highlightId' )
            this.defineProp( 'initialSearch' )

            this.results = []
        },
        function ( smk ) {
            var self = this

            smk.$container.classList.add( 'smk-tool-search' )

            this.changedActive( function () {
                if ( self.active )
                    SMK.HANDLER.get( self.id, 'activated' )( smk, self )
                else
                    SMK.HANDLER.get( self.id, 'deactivated' )( smk, self )
            } )
    
            smk.on( this.id, {
                'activate': function ( ev ) {
                    if ( !ev.toggle )
                        self.active = true
                },

                'input-change': function ( ev ) {
                    smk.$viewer.searched.clear()

                    self.busy = true
                    //self.title = 'Locations matching <wbr>"' + ev.text + '"'
                    doAddressSearch( ev.text )
                        .then( function ( features ) {
                            self.active = true
                            smk.$viewer.searched.add( 'search', features, 'fullAddress' )
                            self.busy = false
                        } )
                        .catch( function ( e ) {
                            console.warn( 'search failure:', e )
                        } )
                },

                'hover': function ( ev ) {
                    smk.$viewer.searched.highlight( ev.result ? [ ev.result.id ] : [] )
                },

                'pick': function ( ev ) {
                    smk.$viewer.searched.pick( null )
                    smk.$viewer.searched.pick( ev.result.id )
                    if ( !self.showPanel ) {
                        self.active = false
                        self.initialSearch = ev.result.title
                    }
                },

                'clear': function ( ev ) {
                    smk.$viewer.searched.clear()
                    self.initialSearch = ' '
                    Vue.nextTick( function () {
                        self.initialSearch = ''
                    } )
                }
            } )

            // = : = : = : = : = : = : = : = : = : = : = : = : = : = : = : = : = : = : =

            smk.$viewer.searched.addedFeatures( function ( ev ) {
                self.results = ev.features
            } )

            // // smk.$viewer.selected.removedFeatures( function ( ev ) {
            // // } )

            smk.$viewer.searched.pickedFeature( function ( ev ) {
                self.highlightId = ev.feature && ev.feature.id
            } )

            // // smk.$viewer.selected.highlightedFeatures( function ( ev ) {
            // // } )

            smk.$viewer.searched.clearedFeatures( function ( ev ) {
                self.results = []
            } )
        }
    )
} )

