###### [SMK](../../..) / [Configuration](..) / [Layers](.)

# Layer Attribute Objects

This object defines the appearance of an attribute from a layer's dataset, when it appears in the details of a feature in the [`"identify"` tool](../tools/identify), [`"query"` tool](../tools/query), or [`"select"` tool](../tools/select).

The `"attributes"` property of a layer, will have list of these objects.
This determines the order the attributes will appear in the feature detail panel.

The formatting defined by these properties only applies when the feature is displayed with an ["attributeMode" property](../tools/identify#attributeMode-property) for the tool that is equal to `"feature-attributes"`.

This object is to be defined for each attribute, with the default values.
Click on a property name for more information:
<pre>
{
    <a href="#id-property"      >"id"</a>:      null,
    <a href="#title-property"   >"title"</a>:   null,
    <a href="#name-property"    >"name"</a>:    null,
    <a href="#value-property"   >"value"</a>:   null,
    <a href="#format-property"  >"format"</a>:  "simple",
    <a href="#visible-property" >"visible"</a>: true
}
</pre>

## Id Property
`"id": String`

The unique identifier for the layer attribute.
This **MUST** be unique within the layer attribute list.
Conventionally it is all lowercase with `-` separating words.


## Title Property
`"title": String`

The title for the attribute to show the feature panel.

This can include a template expression, see [template expressions](#template-expressions).

## Name Property
`"name": String`

The internal name of the attribute in the layer's dataset.
This must match an attribute name in the feature.


## Value Property
`"value": String`

The value of the attribute.
This property will **ONLY** be used if the [`"name"` property](#name-property) is `null`.
It can be a constant, but more usefully it can include a template expression, see [template expressions](#template-expressions).


## Format Property
`"format": String`

This an optional formatting function that can be applied the value in the attribute.
The function takes the attribute value as input amd outputs some sort of formatted value.
Some of the functions take additional parameters, to modify the formatted value.

These are the functions available:
- `"simple"` - the default, and simply passes input through to output
- `"asLocalTimestamp"` - assuming the value is a time value that is parsable by [Date](), outputs a formatted date & time in the local timezone.
- `"asLocalDate"` - assuming the value is a time value that is parsable by [Date](), outputs a formatted date in the local timezone.
- `"asLocalTime"` - assuming the value is a time value that is parsable by [Date](), outputs a formatted time in the local timezone.
- `"asUnit( unit )"` - outputs the numeric value with the `unit` parameter appended
- `"asLink( url, label )"` - outputs an HTML anchor tag pointing to `url`, with the `label` parameter or attribute value as the anchor text.
- `"asHTML( html )"` - outputs the `html` parameter verbatim, without escaping HTML meta-characters, and ignores the attribute value.


## Visible Property
`"visible": Boolean`

If `true`, the attribute is visible in the feature panel.
The default is `true`.


# Template expression

The [`"title"` property](#title-property) and [`"value"` property](#value-property) can contain template expressions.
These are expressions of the form anywhere within a string value:

    <%= (any javascript expression) %>

The expression is evaluated in a context that includes the following variables:

- `this.feature` - the GeoJson feature being displayed
- `this.layer` - the layer object containing the feature
- `attr` - the attribute being display

If the [`"title"` property](#title-property) and [`"value"` property](#value-property) both resolve after template substitution to empty strings, then the attribute will be hidden.
