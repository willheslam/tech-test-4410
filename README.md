Getting started:

Built and tested with node v24.2.0

npm install

npm test

npm run dev

which should let you run the app on
http://localhost:3000/

You can open multiple windows/tabs to interact with the same data.

The sync functionality is provided by a SharedWorker, which can be terminated in Chrome by going to
chrome://inspect/#workers
which will reset all existing state.
Or conversely close all tabs.

SharedWorkers are supported on most platforms except notably Android.

Modify a cell with expression syntax such as

42

10 + 5.1 - 2

A5 + B7 \* 3.6 / 6

Brackets aren't supported for simplicity of parsing.

The SharedWorker will efficiently only compute
exactly what's necessary given an update
e.g.

```
A1 = 42

B2 = A1 + 5

C3 = 10

D4 = C3 \* 3

E5 = B2 + C3
```

Updating A1 to 43 will cause B2 and E5 to recompute, but not recompute C3 or D4.

Currently the worker does send the entire row data as a big batch to each connected client which is not efficient, but I did this for simplicity - it knows what the delta is and could just send the delta to each client to display.

The AG Grid implementation is also very simple and not performant - if I had more time I would work out how to do partial updates and have the delta from the worker just update only the parts of the grid that have changed.

Cyclic dependencies are not checked for and will probably cause a crash or some other problem - I intentionally didn't try to identify them.
Same for incorrect expression syntax!

Negative numbers have to be described as 0 - N, there's no mod cons here (or modulo, or cons)

I definitely spent longer on this than I should have, but I found getting AG Grid to work quite finnicky - I tried Vite which it didn't work with at all (even forcing width and height to be absolute pixel counts), so I had to try a few different bundling systems to get it to run properly. I don't know why.

I haven't played with AG Grid much, it looks very powerful but I wonder if it's as efficient as a more focussed library could be, especially one that focussed on minimal data representation rather than rows of strings or objects.
I didn't look at the high frequency / high performance section of the docs so perhaps there's stuff I'm missing.

I found SharedWorkers really easy to work with, it's definitely something I'm going to use more in the future. I was worried the message port approach would be complicated but it was straight forward - but I don't know how to handle disconnecting clients.
