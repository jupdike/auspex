# Auspex

## AUStere PDF Engine in XML

Create complex PDF layouts with straight XML (and SVG drawings). And automate parts of your document, or add Turing-complete parts with [Bray](https://github.com/jupdike/bray): templates, arbitrary new components (custom tags), and more (using JavaScript, via JSX).

## Auspex XML input language

* `<document>` - required tag, as root of entire PDF document to set PDF metadata, and will contain templates and contents (which get put into templates). Attributes:
  * `author`
  * `subject`
  * `title`
  * `keywords`
  * `page-size`, see the strings here: [PDFKit docs](https://pdfkit.org/docs/paper_sizes.html). Or `"123.4,567.8"` format for specifying width, height in PostScript points (1/72nd of an inch).
  * `page-layout`, either `'portrait'` (default) or `'landscape'`
* TODO `<template>` tag of some kind, one or two pages (these are master pages or page pairs)
  * `pages`="1" (default) or 2
  * `id` (for use by `<contents>` tag)
  * contains `<textframe>` tags with `x`, `y`, `width`, and `height` and various other attributes (columns) or margins
  * TODO if no `<template>` tags is found, a default one is specified that is just a big rectangle with margins to fit the page
  * can also contain content tags like `<view>`, `<text>`, etc. so you can display something like a chapter title at the top of the page, for example.
* TODO `<contents>`
  * `template`="idname"
    * if no template or `<contents>` tag is specified, uses first `<template>` tag (or the default one that gets created for you
  * children are `<view>` tags, as below ...

Note: the sorts of tags that are common in HTML (`h1`, `p`, `ol`, `li`, `table`, ...) would just be created as function components (function from 'props' to BrayElem), made of nested `<view>` and `<text>` components, with the right style values. **This is what makes this tool/typesetting language austere**. It is not for writing directly, but for targeting by programs (like Bray but any program can create XML strings however it likes).

Note that all tags have various attributes for styling everything, especially the `style` attribute, which can be a dictionary or flattened string with "k1: v1; k2: v2" as expected.

### Content tags, that get laid out inside the `<template>` `<textframe>` containers:

* `<view>`
  * allows zero or more children that are `<view/>`, `<image/>`, or `<text/>` tags, no strings as direct children; whitespace strings ignored in `view` tags
  * TODO the layout work is done by flex attributes (like HTML/CSS in browsers, or React Native)
* `<text>`
  * allows zero or more children that are <text/> or raw strings (actual text characters as content), no views or images as children
* TODO `<image>` (image view)
  * laid out like a view, but displays an image
  * two uses cases:
    * has `src` attribute and no children (PNG, JPG, whatever PDF supports) OR
    * only has one child, which is an `<svg>` tag (and SVG tags as children of that)
* TODO `<a>` for links and anchors, which work similarly to HTML, but are internal (string with leading '#') and work in PDF viewers
