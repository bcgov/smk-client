{% include_relative include/breadcrumbs.md %}

# Query Tool

Add a button to the toolbar, that shows a panel containing an input form.
When user fills out the form and clicks the 'Search' button, a query is performed on a layer, and the results are shown at bottom of the panel, as well as on the map.

The queries are defined on layer objects, this tool needs to know which query to use.
The instance property must contain the id of the query object (which is associated with a layer).

The title of the panel and tool button come from the query, so don't set the `"title"` property on this tool.

This is default configuration for the Query tool (click on a property name for more information):
<pre>
{ "tools": [ {
    <a href="#type-property"     >"type"</a>:      "query",
    <a href="#instance-property" >"instance"</a>:  null
    <a href="#showpanel-property">"showPanel"</a>: true,
    <a href="#showheader-property">"showHeader"</a>: true,
    <a href="#enabled-property"  >"enabled"</a>:   false,
    <a href="#icon-property"     >"icon"</a>:      <a href="https://material.io/tools/icons/?icon=help" target="material">"widgets"</a>,
    <a href="#order-property"    >"order"</a>:     5,
    <a href="#position-property" >"position"</a>:  "toolbar",
    <a href="#command-property"  >"command"</a>:   {
        <a href="#navigator-sub-property"       >"navigator"</a>:     true,
        <a href="#zoom-sub-property"            >"zoom"</a>:          true,
        <a href="#select-sub-property"          >"select"</a>:        true,
        <a href="#attributemode-sub-property"   >"attributeMode"</a>: false,
        <a href="#within-sub-property"          >"within"</a>:        true,
    },
    <a href="#attributemode-property"  >"attributeMode"</a>:  "default",
    <a href="#within-property"         >"within"</a>:         false,
} ] }
</pre>

{% include_relative include/type-property.md %}


## Instance Property
`"instance"`: `String`

This tool must be paired with a query defined on a layer.
The instance for this tool is an id constructed from the layer id, and the query id: `"<<layer.id>>--<<query.id>>"`.


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


### within Sub-Property
`"command"`: `{ "within": Boolean }`

If `true`, shows a toggle for selecting search mode.


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


## Within Property
`"within"`: `Boolean`

If `false`, then the query will search the entire dataset no matter what the extent currently in view.

If `true`, then the query will be restricted to the current extent.
