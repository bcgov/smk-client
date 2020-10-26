include.module( 'tool-config.tool-panel-feature-config-js', [], function ( inc ) {
    "use strict";

    return function ( cfg ) {
        cfg.command = Object.assign( {
            navigator: true,
            zoom: true,
            select: true,
            attributeMode: false,
        }, cfg.command )

        return Object.assign( {
            attributeMode: 'default',
        }, cfg )
    }
} )
