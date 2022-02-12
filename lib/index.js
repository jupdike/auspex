import PDFDocument from 'pdfkit';
import fs from 'fs';

import { BrayElem } from 'bray';
import sax from './sax.js';
import AuspexArgumentException from './exceptions.js';

import Fragment from './fragment.js';
import { Text } from './text.js';
import View from './view.js';
import Document from './Document.js';

const twoNumsCommaRegex = new RegExp("^\\d+[.]?\\d*[,]\\w*\\d+[.]?\\d*$");

function documentRunner(path, documentBrayElem) {
  if (!documentBrayElem || !documentBrayElem.props || !documentBrayElem.props._oldTagName) {
    return;
  }
  //console.warn(documentBrayElem);
  const props = documentBrayElem.props;
  let size = BrayElem.propOrStyleOrDefault(props, 'pageSize', null)
          || BrayElem.propOrStyleOrDefault(props, 'page-size', 'letter');
  let layout = BrayElem.propOrStyleOrDefault(props, 'pageLayout', null)
            || BrayElem.propOrStyleOrDefault(props, 'page-layout', 'portrait');
  if (BrayElem.isString(size) && size.match(twoNumsCommaRegex)) {
    console.warn('matched size with numbers and commas!', size);
    const ps = size.split(',');
    size = [+(ps[0].trim()), +(ps[1].trim())];
  }
  // https://pdfkit.org/docs/paper_sizes.html
  // for letter, legal, tabloid, a4, etc. which have their sizes defined in PostScript points (1/72 inch)
  // width,height   string is also valid, where width and height are digits and a decimal, in points
  console.warn('size:', size);
  // either the string 'portrait' or something else ('landscape' works)
  console.warn('layout:', layout);
  //console.warn('document elem props:', props);
  // cf. https://github.com/foliojs/pdfkit/blob/master/lib/page.js <-- passed to PDFPage constructor
  const doc = new PDFDocument({size: size, layout: layout}); 
  doc.pipe(fs.createWriteStream(path)); // write to PDF
  console.warn('Writing PDF to:', path);

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

//page-size="${(6*72)+","+(8*72)}"
// const msg = `<text>
//   Some normal text, and then <text style="color: red">red text is here</text>.
// </text>`;
const msg = `<document
    title="My Documentary Doc"
    author="Me Myself"
    keywords="abc, xyz"
    subject="documenting"
    page-size="letter"
    page-layout="portrait" >
  <view x="100" y="100" width="200" height="600" font-size="20">
    <text color="black">
      Some normal text, and then <text style="color: red">red text is here</text>.
    </text>
  </view>
</document>`;
const msg2 = `<document
    title="My Documentary Doc"
    author="Me Myself"
    keywords="abc, xyz"
    subject="documenting"
    page-size="letter"
    page-layout="portrait"
    hyphens="auto">
  <view x="100" y="100" width="400" height="800" font-size="15">
    <text color="black">Chords and scales are built from intervals, or two pitches played in sequence or simultaneously. Depending how you count, there are only half a dozen to a few dozen intervals that make up the 12-tone system.<text font-family="Times-Roman" style="color: red"> Learn about 5-TET, 7-TET, 10-TET, 12-TET (our normal scale), and 24-TET.</text></text>
  </view>
</document>`;
const elem = BrayElem.fromXmlString(sax, msg2,
  { text: Text,
    view: View,
    fragment: Fragment,
    document: Document,
  });

documentRunner('./build/test.pdf', elem);




// ---------------------

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus.  Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl.';

const text = 'Chords and scales are built from intervals, or two pitches played in sequence or simultaneously. Depending how you count, there are only half a dozen to a few dozen intervals that make up the 12-tone system.';

const text2 = ' Learn about 5-TET, 7-TET, 10-TET, 12-TET (our normal scale), and 24-TET.';
