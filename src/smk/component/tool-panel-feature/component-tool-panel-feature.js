include.module( 'component-tool-panel-feature', [ 
    'component', 
    'component-tool-panel',
    'component-feature-attributes',
    'component-feature-properties',
    'component-feature-description',
    'component-command-button',
    'component-tool-panel-feature.component-tool-panel-feature-html' 
], function ( inc ) {
    "use strict";

    Vue.component( 'tool-panel-feature', {
        extends: SMK.COMPONENT.ToolPanelBase,
        template: inc[ 'component-tool-panel-feature.component-tool-panel-feature-html' ],
        props: [ 
            'feature', 
            'layer', 
            'attributeComponent', 
            'tool', 
            'resultPosition', 
            'resultCount', 
            'instance', 
            'command',
            'attributeMode'
        ],
        computed: {
            attributes: {
                get: function () {
                    var ft = this.feature
                    if ( !this.layer.attributes ) return []
                    return this.layer.attributes
                        .filter( function ( at ) { return at.visible !== false } )
                        .map( function ( at ) {
                            return {
                                id: at.name || at.title,
                                name: at.name,
                                title: at.title,
                                value: at.name ? ft.properties[ at.name ] : at.value,
                                format: at.format || 'simple'
                            } 
                        } )
                }
            }
        }
    } )
} )
