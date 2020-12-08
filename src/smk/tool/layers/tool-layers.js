include.module( 'tool-layers', [
    'tool.tool-base-js',
    'tool.tool-widget-js',
    'tool.tool-panel-js',
    'tool-layers.panel-layers-html',
    'tool-layers.layer-display-html',
    'component-enter-input',
    'component-toggle-button'
], function ( inc ) {
    "use strict";

    Vue.component( 'layer-display', {
        mixins: [ SMK.COMPONENT.ToolEmit ],
        template: inc[ 'tool-layers.layer-display-html' ],
        props: {
            id:      { type: String },
            display: { type: Object },
            glyph:   { type: Object },
            inGroup: { type: Boolean, default: false }
        },
    } )

    Vue.component( 'layers-widget', {
        extends: SMK.COMPONENT.ToolWidgetBase,
    } )

    Vue.component( 'layers-panel', {
        extends: SMK.COMPONENT.ToolPanelBase,
        template: inc[ 'tool-layers.panel-layers-html' ],
        props: [ 'contexts', 'allVisible', 'glyph', 'command', 'filter', 'legend' ],
    } )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    return SMK.TYPE.Tool.define( 'LayersTool',
        function () {
            SMK.TYPE.ToolWidget.call( this, 'layers-widget' )
            SMK.TYPE.ToolPanel.call( this, 'layers-panel' )

            this.defineProp( 'contexts' )
            this.defineProp( 'allVisible' )
            this.defineProp( 'glyph' )
            this.defineProp( 'command' )
            this.defineProp( 'filter' )
            this.defineProp( 'legend' )

            this.contexts = []
            this.allVisible = true
            this.legend = false
        },
        function ( smk ) {
            var self = this

            if ( this.display )
                smk.$viewer.setDisplayContextItems( this.type, this.display )

            self.changedActive( function () {
                if ( self.active ) {
                    self.contexts = smk.$viewer.getDisplayContexts()
                    SMK.HANDLER.get( self.id, 'activated' )( smk, self )
                }
                else {
                    SMK.HANDLER.get( self.id, 'deactivated' )( smk, self )
                }
            } )

            smk.on( this.id, {
                'activate': function () {
                    if ( !self.enabled ) return
                    if ( !self.active ) return

                    smk.$viewer.setDisplayContextLegendsVisible( true )

                    if ( !self.legend ) Vue.nextTick( function () {
                        smk.$viewer.setDisplayContextLegendsVisible( false )
                    } )
                },

                'change': function ( ev ) {
                    Object.assign( self, ev )

                    smk.$viewer.setDisplayContextLegendsVisible( self.legend )

                    var re
                    if ( !self.filter || !self.filter.trim() )
                        re = /.*/;
                    else {
                        var f = self.filter.trim()
                        re = new RegExp( f.toLowerCase().split( /\s+/ ).map( function ( part ) { return '(?=.*' + part + ')' } ).join( '' ), 'i' )
                    }
                    smk.$viewer.displayContext.layers.setFilter( re )
                },

                'set-all-layers-visible': function ( ev ) {
                    smk.$viewer.displayContext.layers.setItemVisible( smk.$viewer.displayContext.layers.root.id, ev.visible, ev.deep )
                    smk.$viewer.updateLayersVisible()
                },

                'set-item-visible': function ( ev ) {
                    smk.$viewer.displayContext.layers.setItemVisible( ev.id, ev.visible, ev.deep )
                    smk.$viewer.updateLayersVisible()
                },

                'layer-click': function ( ev ) {
                    if ( ev.metadataUrl )
                        window.open( ev.metadataUrl, '_blank' )
                },

                'folder-click': function ( ev ) {
                    smk.$viewer.setDisplayContextFolderExpanded( ev.id, !ev.isExpanded )
                },

                'group-click': function ( ev ) {
                    // console.log( 'group item-click', ev )
                },

                'swipe-up': function ( ev ) {
                    smk.$sidepanel.setExpand( 2 )
                },

                'swipe-down': function ( ev ) {
                    smk.$sidepanel.incrExpand( -1 )
                }
            } )


            smk.$viewer.changedLayerVisibility( function () {
                self.allVisible = smk.$viewer.displayContext.layers.isItemVisible( smk.$viewer.displayContext.layers.root.id )
            } )

            smk.$viewer.startedLoading( function ( ev ) {
                self.busy = true
            } )

            smk.$viewer.finishedLoading( function ( ev ) {
                self.busy = false
            } )
        }
    )
} )
