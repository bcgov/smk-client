include.module( 'tool.tool-panel-feature-js', [
    'tool.tool-panel-js',
    'component-tool-panel-feature'
], function ( inc ) {
    "use strict";

    SMK.TYPE.ToolPanelFeature = function ( featureSetCallback ) {
        this.defineProp( 'feature' )
        this.defineProp( 'layer' )
        this.defineProp( 'attributeComponent' )
        this.defineProp( 'tool' )
        this.defineProp( 'resultPosition' )
        this.defineProp( 'resultCount' )
        this.defineProp( 'instance' )
        this.defineProp( 'attributeMode' )
        this.defineProp( 'command' )
        this.defineProp( 'attributes' )

        this.tool = {}

        this.$propFilter.attributes = false

        this.$initializers.push( function ( smk ) {
            this.featureSet = featureSetCallback.call( this, smk )

            this.tool = smk.getToolTypesAvailable()
            delete this.tool[ this.type ]

            smk.on( this.id, {
                'swipe-up': function ( ev ) {
                    smk.$sidepanel.setExpand( 2 )
                },

                'swipe-down': function ( ev ) {
                    smk.$sidepanel.incrExpand( -1 )
                }
            } )

            // TODO remove, attributeView deprecated
            if ( this.attributeView ) 
                this.attributeMode = this.attributeView
        } )

        this.setAttributeComponent = function ( layer, feature ) {
            if ( layer.config.popupTemplate ) {
                var template

                if ( layer.config.popupTemplate.startsWith( '@' ) ) {
                    this.attributeComponent = layer.config.popupTemplate.substr( 1 )
                }
                else {
                    this.attributeComponent = 'feature-template-' + layer.config.id
                    template = layer.config.popupTemplate
                }

                if ( !Vue.component( this.attributeComponent ) ) {
                    if ( template ) {
                        try {
                            Vue.component( this.attributeComponent, {
                                template:   template,
                                extends:    SMK.COMPONENT.FeatureBase,
                            } )
                        }
                        catch ( e ) {
                            console.warn( 'failed compiling template:', this.attributeComponent, e )
                            layer.config.popupTemplate = null
                        }
                    }
                    else {
                        console.warn( 'component not found:', this.attributeComponent )
                        layer.config.popupTemplate = null
                    }
                }

                if ( Vue.component( this.attributeComponent ) )
                    return
            }

            if ( feature.properties.description ) {
                this.attributeComponent = 'feature-description'
                return
            }

            if ( layer.config.attributes ) {
                this.attributeComponent = 'feature-attributes'
                return
            }

            this.attributeComponent = 'feature-properties'
        }
    }
} )
