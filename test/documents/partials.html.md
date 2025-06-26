---
layout: default.html.ejs
title: Partials
publicationDate: 2021-11-11
---

<partial file-name='helloworld.html'></partial>

<partial file-name="strong.html.ejs">
<i>Hello, world!</i>

And some other "quoted text"
</partial>


<p>This following doesn't work as expected.  The intention is to pass JSON to a partial, so the partial can use it as data.  However, the code recieves a string where the quotes are encoded as HTML entities, and then the <tt>JSON.parse</tt> function fails due to a syntax error.  Hence in <tt>listrender.html.ejs</tt> the intended code is now commented-out.  And there is no test cases.</p>

<partial file-name='listrender.html.ejs'>
{
    "items": {
        "item 1": "item text 1",
        "item 2": "item text 2",
        "item 3": " item text 3 ",
        "item 4": "item text 4"
    }
}
</partial>

