import PDFDocument from 'pdfkit';
import fs from 'fs';

import { BrayElem } from 'bray';
import sax from './sax.js';
import AuspexArgumentException from './exceptions.js';

import Fragment from './fragment.js';
import Text from './text.js';
import View from './view.js';
import Document from './Document.js';

function documentRunner(path, documentBrayElem) {
  if (!documentBrayElem || !documentBrayElem.props || !documentBrayElem.props._oldTagName) {
    return;
  }
  //console.warn(documentBrayElem);

  const doc = new PDFDocument(); // TODO options including size, from documentBrayElem.props.size, cf. https://pdfkit.org/docs/paper_sizes.html and https://github.com/foliojs/pdfkit/blob/master/lib/page.js
  doc.pipe(fs.createWriteStream(path)); // write to PDF
  console.warn('Writing PDF to:', path);

  doc.fontSize(20);
  // TODO actually interesting stuff
  documentBrayElem.invokeSelf({_doc: doc});
  //
  // const bigWid = 8.5*72;
  // const half = bigWid / 2.0;
  // const margin = 0.5 * (bigWid - half);
  // doc.rect(margin, margin, half, 900).stroke();
  //
  doc.end();
  console.warn('Done writing.');
}

// const msg = `<text>
//   Some normal text, and then <text style="color: red">red text is here</text>.
// </text>`;
const msg = `<document
    title="My Documentary Doc"
    author="Me Myself"
    keywords="abc, xyz"
    subject="documenting" >
  <view>
    <text color="orange">
      Some normal text, and then <text style="color: red">red text is here</text>.
    </text>
  </view>
</document>`;
const elem = BrayElem.fromXmlString(sax, msg,
  {text: Text,
    view: View,
    fragment: Fragment,
    document: Document,
  });

documentRunner('./build/test.pdf', elem);

// const doc = new PDFDocument();
// doc.pipe(fs.createWriteStream('./build/test.pdf')); // write to PDF

// const bigWid = 8.5*72;
// const half = bigWid / 2.0;
// const margin = 0.5 * (bigWid - half);
// doc.fontSize(20);

// const textsList = [[text, {font: 'Helvetica'}], [text2, {font: 'Helvetica-Oblique'}]];
// doc.rect(margin, margin, half, 900).stroke();
// //layoutLines(doc, {lineHeight: 1.2, align: 'left', justify: true}, textsList, margin, margin, half, 900);
// // finalize the PDF and end the stream
// doc.end();

// ---------------

// Auspex XML input language
// <document>
//    - tag to set PDF metadata, contains templates and contents (which get put into templates)
// <template> tag of some kind, one or two pages (these are master pages or page pairs)
//     - pages="1" (default) or 2
//     - id (for use by <contents> tag)
// <contents>
//     template="idname"
//     children are views, as below ...
// Content tags, that get laid out in the page or pp containers:
//   - the sorts of tags that are common in HTML (h1, p, ol, li, table, ...) would just be
//     created as function components (function from 'props' to BrayElem), made of nested <view> and <text>
//     components, with the right style values
//   - all tags with style attribute (dictionary or flattened string with k:v; k:v as expected)
//   - <view>
//        - allows zero or more children that are <view/>, <image/>, or <text/> tags, no strings as direct children, whitespace strings ignored
//        - the layout work is done by flex (like HTML/CSS in browsers, or React Native)
//   - <text>
//        allows zero or more children that are <text/> or raw strings (actual content), no views or images as children
//   - <image> (image view)
//        laid out like a view, but displays an image
//        a. has `src` attribute and no children (PNG, JPG, whatever PDF supports) OR
//        b. only has one child, which is an <svg> tag (and SVG tags as children of that)
//     <a> for links and anchors, which work similarly to HTML, but are internal (string with leading '#') and work in PDF viewers
