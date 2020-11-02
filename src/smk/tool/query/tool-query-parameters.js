include.module( 'tool-query.tool-query-parameters-js', [
    'component-toggle-button',
    'component-parameter',
    'component-command-button',
    'tool-query.panel-query-html',
], function ( inc ) {
    "use strict";

    Vue.component( 'query-widget', {
        extends: SMK.COMPONENT.ToolWidgetBase,
    } )

    Vue.component( 'query-panel', {
        extends: SMK.COMPONENT.ToolPanelBase,
        template: inc[ 'tool-query.panel-query-html' ],
        props: [ 'description', 'parameters', 'within', 'command' ],
    } )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    return SMK.TYPE.Tool.define( 'QueryParametersTool',
        function () {
            SMK.TYPE.ToolWidget.call( this, 'query-widget' )
            SMK.TYPE.ToolPanel.call( this, 'query-panel' )

            this.defineProp( 'description' )
            this.defineProp( 'parameters' )
            this.defineProp( 'within' )
            this.defineProp( 'command' )
        },
        function ( smk ) {
            var self = this

            if ( !this.instance )
                throw new Error( 'query tool needs an instance' )

            if ( !( this.instance in smk.$viewer.query ) )
                throw new Error( '"' + this.instance + '" is not a defined query' )

            this.featureSet = smk.$viewer.queried[ this.instance ]
            this.featureSet.instance = this.instance

            this.query = smk.$viewer.query[ this.instance ]

            this.title = this.query.title
            this.description = this.query.description
            this.parameters = this.query.getParameters( smk.$viewer )

            if ( !this.query.canUseWithExtent( smk.$viewer ) )
                this.within = null

            function focusFirstParameter() {
                self.parameters[ 0 ].focus()
            }

            self.changedActive( function () {
                if ( self.active ) {

                    focusFirstParameter()
                    SMK.UTIL.makeDelayedCall( function () {
                        focusFirstParameter()
                    }, { delay: 100 } )()

                    if ( self.onActivate ) {
                        switch ( self.onActivate ) {
                        case 'execute':
                            smk.emit( self.id, 'execute' )
                            break
                        }
                        self.onActivate = null
                    }
                }
            } )

            self.changedGroup( function () {
                if ( !self.group ) {
                    // console.log('clear')
                    self.featureSet.clear()
                    self.featureSet.pick()
                }
            } )

            smk.on( this.id, {
                'parameter-input': function ( ev ) {
                    self.parameters[ ev.index ].prop.value = ev.value
                },

                'parameter-mounted': function ( ev ) {
                    // console.log( 'parameter-mounted', ev.index )
                    self.parameters[ ev.index ].mounted()
                },

                'parameter-reset': function ( ev ) {
                    self.parameters[ ev.index ].prop.value = self.query.parameters[ ev.index ].value
                },

                'parameter-change': function ( ev ) {
                    smk.setEditFocus( ev.active )
                },
                // 'active', function ( ev ) {
                //     smk.$viewer[ self.featureSetProperty ].pick( ev.featureId )
                // } )

                // 'hover', function ( ev ) {
                //     smk.$viewer[ self.featureSetProperty ].highlight( ev.features && ev.features.map( function ( f ) { return f.id } ) )
                // } )

                'reset': function ( ev ) {
                    self.featureSet.clear()
                    self.showStatusMessage()

                    self.parameters.forEach( function ( p, i ) {
                        p.prop.value = self.query.parameters[ i ].value
                    } )
                },

                'execute': function ( ev ) {
                    self.featureSet.clear()
                    self.busy = true
                    self.showStatusMessage( 'Searching for features', 'progress' )

                    var param = {}
                    self.parameters.forEach( function ( p, i ) {
                        param[ p.prop.id ] = $.extend( {}, p.prop )
                    } )

                    return SMK.UTIL.resolved()
                        .then( function () {
                            return self.query.queryLayer( param, { within: self.within }, smk.$viewer )
                        } )
                        .then( function ( features ) {
                            self.showStatusMessage()
                            return asyncIterator(
                                function () {
                                    return features.length > 0
                                },
                                function () {
                                    var chunk = features.splice( 0, 50 )
                                    self.featureSet.add( self.query.layerId, chunk )
                                },
                                5
                            )
                        } )
                        .catch( function ( err ) {
                            console.warn( err )
                            self.showStatusMessage( 'No features found', 'warning' )
                        } )
                        .finally( function () {
                            self.busy = false
                        } )

                },

                'add-all': function ( ev ) {
                    self.layers.forEach( function ( ly ) {
                        smk.$viewer.selected.add( ly.id, ly.features.map( function ( ft ) {
                            return self.featureSet.get( ft.id )
                        } ) )
                    } )
                },

                'change': function ( ev, comp ) {
                    Object.assign( self, ev )

                    comp.$forceUpdate()
                },
            } )
        }
    )

    function asyncIterator( test, body, delay ) {
        return SMK.UTIL.makePromise( function ( res, rej ) {
            try {
                if ( !test() ) return res( false )
                body()

                setTimeout( function () {
                    res( true )
                }, delay )
            }
            catch ( e ) {
                return rej( e )
            }
        } )
        .then( function ( cont ) {
            if ( !cont ) return

            return asyncIterator( test, body )
        } )
    }
} )
