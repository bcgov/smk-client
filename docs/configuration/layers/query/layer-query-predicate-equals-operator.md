## Layer Query Predicate EQUALS Operator

The query predicate holds if the first operand equals the second operand.
There must be exactly 2 arguments.
The arguments are [layer query predicate operand](#layer-query-predicate-operand) objects.

<pre>
{ "layers": [ { "id": "fish-points", queries: [ { "id": "species", predicate: {
    <a href="#operator-layer-query-predicate"   >"operator"</a>:  "equals",
    "arguments": [ ... ],
} ] } ] } ] }
</pre>
