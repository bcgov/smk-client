include.module( 'tool-menu', [ 'tool', 'widgets', 'tool-menu.panel-menu-html' ], function ( inc ) {
    "use strict";

    Vue.component( 'menu-widget', {
        extends: inc.widgets.toolButton,
    } )

    Vue.component( 'menu-panel', {
        extends: inc.widgets.toolPanel,
        template: inc[ 'tool-menu.panel-menu-html' ],
        props: [ 'visible', 'enabled', 'active', 'subWidgets', 'activeTool' ]
    } )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    function MenuTool( option ) {
        this.makePropWidget( 'icon', 'menu' )

        this.makePropPanel( 'subWidgets', [] )
        this.makePropPanel( 'activeTool', null )

        SMK.TYPE.Tool.prototype.constructor.call( this, $.extend( {
            title:          null,
            position:       'toolbar',
            widgetComponent:'menu-widget',
            panelComponent: 'menu-panel',
            container:      true
        }, option ) )

        this.containedId = {}
    }

    SMK.TYPE.MenuTool = MenuTool

    $.extend( MenuTool.prototype, SMK.TYPE.Tool.prototype )
    MenuTool.prototype.afterInitialize = []
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    MenuTool.prototype.afterInitialize.push( function ( smk ) {
        var self = this

        smk.on( this.id, {
            'activate': function () {
                if ( !self.enabled ) return

                self.active = !self.active
            }
        } )

        self.changedActive( function () {
            // console.log('menu active',self.active,self.selectedTool && self.selectedTool.id)
            if ( self.selectedToolId )
                smk.$tool[ self.selectedToolId ].active = self.active
        } )

        smk.$sidepanel.changedTool( function ( tool ) {
            if ( tool.id in self.containedId ) {
                self.activeTool = tool
                self.selectedToolId = tool.id
            }
            else {
                self.activeTool = null
            }
        } )
    } )
    // _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
    //
    MenuTool.prototype.addTool = function ( tool, smk ) {
        var self = this

        if ( !this.selectedToolId && !tool.subPanel )
            this.selectedToolId = tool.id

        tool.subPanel = tool.subPanel + 1

        smk.getSidepanel().addTool( tool, smk, false )

        if ( tool.widgetComponent )
            this.subWidgets.push( {
                id: tool.id,
                type: tool.type,
                widgetComponent: tool.widgetComponent,
                widget: tool.widget
            } )

        this.containedId[ tool.id ] = true

        return true
    }

    return MenuTool
} )

