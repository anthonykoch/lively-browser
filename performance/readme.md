


## Optimizations

### Serialization options

1. Serialize as the code runs, but that means slower execution times for both instrumentations.

#### pros

no changes to current api

#### cons

code execution will be a lot slower


2. Serialize it after the script has run

#### pros

- minimal changes to current api
- doesn't affect synchronous code execution

#### cons

- won't get immediate feedback for long running sync operations


3. Keep all values in an array and serialize them when requested

#### pros

- only serializes what's necessary, which may improve memory

#### cons

- may actually do the inverse by being very memory intensive and may lead to memory leaks.
- would be really annoying to implement


## Serialization stats

The table below shows serialization times and memory usage for `n` times, simulating 3 serialiation items per insertion point. Each item is enqueued (stored in a dictionary) and subsequently serialized after everything has been enqueued.

Base memory usage is 4.16MB. **Run** is the number of times the test was run, which hints at what the performance would be like after V8's optimizations.

Run | Items     | Serialize Time   | Enqueue time   | Usage    | Create ids array
----|-----------|------------------|----------------|----------|-------------------
1   | 50000     | 231.296ms        | 33.649ms       | 42.11MB  | 8.981ms
1   | 25000     | 91.117ms         | 2.393ms        | 64.79MB  | 2.565ms
10  | 50000     | 155.128ms        | 9.270ms        | 46.74MB  | 4.625ms
10  | 25000     | 65.899ms         | 5.161ms        | 61.92MB  | 1.629ms


## Insertion points per library

library   | Insertions   |
----------|--------------|
d3        | 8131         |
lodash    | 3477         |
moment    | 1693         |


## Conclusion

The performance of serializing nearly `50,000` items isn't extremely intensive. IE would probably take seconds, but that doesn't matter because `source-map` doesn't support IE because it uses wasm.

Seeing as large libraries only have 8,000 insertions, we shouldn't get to a fourth of that amount. However, objects with a large number of keys would likely increase the time and memory usage. Serialization at request seems like the worst option since it requires a serious amount of api changes with little performance gains. Delayed serialization seems to be the best option.

