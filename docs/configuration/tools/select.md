{% include_relative include/breadcrumbs.md %}

# Select Tool

Add a button to the toolbar, that shows a panel containing the current selection set.
When this tool is enabled, the [`"identify"` tool](identify) tool has an additional action available for features.
The feature can be copied to the selection, so it appears in this panel.

This is default configuration for the Select tool (click on a property name for more information):
<pre>
{ "tools": [ {
    <a href="#type-property"     >"type"</a>:      "select",
    <a href="#title-property"    >"title"</a>:     "Selected Features",
    <a href="#showtitle-property">"showTitle"</a>: false,
    <a href="#showpanel-property">"showPanel"</a>: true,
    <a href="#showheader-property">"showHeader"</a>: true,
    <a href="#enabled-property"  >"enabled"</a>:   false,
    <a href="#icon-property"     >"icon"</a>:      <a href="https://material.io/tools/icons/?icon=help" target="material">"select_all"</a>,
    <a href="#order-property"    >"order"</a>:     6,
    <a href="#position-property" >"position"</a>:  [ "list-menu", "toolbar" ],
    <a href="#command-property"  >"command"</a>:   {
        <a href="#navigator-sub-property"       >"navigator"</a>:     true,
        <a href="#zoom-sub-property"            >"zoom"</a>:          true,
        <a href="#select-sub-property"          >"select"</a>:        true,
        <a href="#attributemode-sub-property"   >"attributeMode"</a>: false,
        <a href="#clear-sub-property"           >"clear"</a>:         true,
        <a href="#remove-sub-property"          >"remove"</a>:        true,
    },
    <a href="#attributemode-property"  >"attributeMode"</a>:  "default",
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

### Clear Sub-Property
`"command"`: `{ "clear": Boolean }`

If `true`, shows a button to clear the selection.

### Remove Sub-Property
`"command"`: `{ "remove": Boolean }`

If `true`, shows a button to remove a feature from the selection.


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

