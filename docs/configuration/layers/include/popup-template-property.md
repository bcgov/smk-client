## PopupTemplate Property
`"popupTemplate": String`

A string that contains a [Vue](https://vuejs.org/) template.
The template is used to construct the popup that appears when presenting a feature, in the [`"identify"` tool](../tools/identify), [`"query"` tool](../tools/query), and [`"select"` tool](../tools/select).

The model that is available to the template:
```javascript
// layer configuration
layer.id
layer.title
layer.attributes // array of objects: { visible, title, name }

// current feature
feature.id
feature.title
feature.properties // object: attribute key:value
```
