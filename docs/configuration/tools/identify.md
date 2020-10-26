{% include_relative include/breadcrumbs.md %}

# Identify Tool

If this tool is enabled, clicking on the map will try to identify all features under the click, within [radius](#radius-property) pixels (default [radius unit](#radiusunit-property)).
The results of this search will be display in the panel, if [showPanel](#showPanel-property) is true.
It also adds a button to the toolbar, that optionally will show a panel containing a list of features found on the map.

This is default configuration for the Identify tool (click on a property name for more information):
<pre>
{ "tools": [ {
    <a href="#type-property"     >"type"</a>:      "identify",
    <a href="#title-property"    >"title"</a>:     "Identify Features",
    <a href="#showtitle-property">"showTitle"</a>: false,
    <a href="#showpanel-property">"showPanel"</a>: true,
    <a href="#showheader-property">"showHeader"</a>: true,
    <a href="#enabled-property"  >"enabled"</a>:   false,
    <a href="#icon-property"     >"icon"</a>:      <a href="https://material.io/tools/icons/?icon=help" target="material">"info_outline"</a>,
    <a href="#order-property"    >"order"</a>:     5,
    <a href="#position-property" >"position"</a>:  [ "list-menu", "toolbar" ],
    <a href="#command-property"  >"command"</a>:   {
        <a href="#navigator-sub-property"       >"navigator"</a>:     true,
        <a href="#zoom-sub-property"            >"zoom"</a>:          true,
        <a href="#select-sub-property"          >"select"</a>:        true,
        <a href="#attributemode-sub-property"   >"attributeMode"</a>: false,
        <a href="#radius-sub-property"          >"radius"</a>:        false,
        <a href="#radiusunit-sub-property"      >"radiusUnit"</a>:    false,
        <a href="#nearby-sub-property"          >"nearBy"</a>:        true
    },
    <a href="#attributemode-property"  >"attributeMode"</a>:  "default",
    <a href="#radius-property"         >"radius"</a>:         5,
    <a href="#radiusunit-property"     >"radiusUnit"</a>:     "px",
    <a href="#internallayers-property" >"internalLayers"</a>: [ ... ]
} ] }
</pre>

{% include_relative include/type-property.md %}
{% include_relative include/title-property.md %}
{% include_relative include/show-title-property.md %}
{% include_relative include/show-panel-property.md %}
{% include_relative include/show-header-property.md %}
{% include_relative include/enabled-property.md %}
{% include_relative include/icon-property.md %}
{% include_relative include/order-property.md %}
{% include_relative include/position-property.md %}

## Command Property
`"command"`: `Object`

Determines which controls are visible on the panels for this tool.

### Navigator Sub-Property
`"command"`: `{ "navigator": Boolean }`

If `true`, shows the navigation controls for selecting among many matched features.

### Zoom Sub-Property
`"command"`: `{ "zoom": Boolean }`

If `true`, shows a button for zooming to current feature.

### Select Sub-Property
`"command"`: `{ "select": Boolean }`

If `true`, shows a button for adding the current feature to the selection.

### AttributeMode Sub-Property
`"command"`: `{ "attributeMode": Boolean }`

If `true`, shows a drop-down list for selecting how the feature attributes should be presented.

### Radius Sub-Property
`"command"`: `{ "radius": Boolean }`

If `true`, shows the search radius value.

### RadiusUnit Sub-Property
`"command"`: `{ "radiusUnit": Boolean }`

If `true`, shows the search radius units drop-down.

### NearBy Sub-Property
`"command"`: `{ "nearBy": Boolean }`

If `true`, shows a button that does the identify query at the devices current location.


## AttributeMode Property
`"attributeMode"`: `String`

Determines how the attributes are presented for a feature.
These are the possible modes:

- `"default"`: choose the best mode for the feature
- `"feature-description"`: show the contents of the `description` attribute as HTML
- `"feature-attributes"`: show the attributes as defined in the `attributes` configuration for the layer.
- `"feature-properties"`: show all the attributes for the feature without any further interpretation.

#### Note

One of the modes possible when `attributeMode == "default"` is one that uses the feature template defined for the layer.
This mode is the most preferred one if possible, but it is not possible to force `attributeMode` to always use it.


## Radius Property
`"radius"`: `Number`

The distamce to use for the search radius when doing a query for the point that was clicked on the map.
The value is in the units specified by the [radiusUnit property](#radiusunit-property).

## RadiusUnit Property
`"radiusUnit"`: `String`

The unit that the [radius property](#radius-property) is using for measurement.
The allowed values are:

- `"px"`: pixels
- `"m"`: meters
- `"km"`: kilometers


## InternalLayers Property
`"internalLayers"`: `Array`

TBD