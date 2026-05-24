# canvas-mouse

This is a small canvas demo.

I wanted to test what I can do within the web browser.
It started with rendering all the pixels as 50x50 px large `<p>` elements in pure HTML.
I wanted to know how much can the browser render before it's no longer usable.

With 50x50 boxes it was somewhat usable, but definitely not performant enough.
And because I really wanted to get to 1x1 px, I had to see if canvas can do better.

Originally, I was using the built-in functions for painting filled rectangles
and that wasn't that much better than the HTML.

The step to `ImageData` gave cause a significant speed-up.
I was able to render in between the animation frames but barely.

The final solution utilizes a bigger buffer of pixels pre-computed and the mouse's movement
moves the screen over the pre-computed buffer. This is more expensive memory-wise,
but it puts me in in a place where rendering costs only about 2 ms.

This finally means that I can render on every frame that the browser gives me and still leave some time on the table.

It's a small exercise but it does exactly what I was going for.