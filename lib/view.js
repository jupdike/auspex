import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

import StyledString from './styled-string.js';
import { layoutLines } from './layout-lines.js';

// for debugging
function printProps(props) {
  if (BrayElem.isArray(props)) {
    console.warn('[');
    let show = false;
    props.forEach(x => {
      if (show) {
        console.warn(',');
      }
      show = true;
      printProps(x)
    });
    console.warn(']');
    return;
  }
  if (!props) {
    console.warn('PROPS is NULL or UNDEFINED');
  }
  for (var k in props) {
    if (!props.hasOwnProperty(k)) {
      continue;
    }
    if (k.startsWith('_') || k === 'children') {
      continue;
    }
    console.warn(k+':', props[k]);
  }
}

export default function View(props) {
  const doc = props._doc;
  console.warn('SIZE:', doc.page.width, doc.page.height);
  const x = +(BrayElem.propOrStyleOrDefault(props, 'x', 0));
  const y = +(BrayElem.propOrStyleOrDefault(props, 'y', 0));
  const w = +(BrayElem.propOrStyleOrDefault(props, 'width', -1337));
  const h = +(BrayElem.propOrStyleOrDefault(props, 'height', -1337));
  console.warn('VIEW props:', props.x, props.y, props.width, props.height, props['font-size']);
  // console.warn('VIEW props:');
  // printProps(props);
  // process.exit(1);
  const children = BrayElem.childrenWithoutWhitespaceStrings(props.children);
  children.forEach(kid => {
    if (BrayElem.isString(kid)) {
      throw new AuspexArgumentException("Auspex <view> elements can only contain tags as children, not strings. Wrap text in a <text> tag.");
    }
  });

  // hacks ...
  doc.rect(x, y, w, h).stroke();

  // children.forEach(kid => {
  // TODOx fancier layouts mixing Text and View tags ... complicated!
  // });
  const texts = children.filter(kid => kid.props._oldTagName === 'text');
  console.warn('TEXTS:', texts.length);
  // flatten the lists of texts and create flat list of StyledString objects
  // top-level <text> tags within <view> need to be separate flat lists, so multiple paragraphs can work as expected
  const viewProps = BrayElem.pushFront(props._parentProps, props);
  let startY = y; // TODO do this better, with respect page breaks, etc.
  let isFirst = true;
  texts.forEach(para => {
    //console.warn('View is calling StyledString.arrayFromBrayElem for elem:', para);
    const ssTexts = StyledString.arrayFromBrayElem(para, viewProps, isFirst);
    doc.fontSize(+(ssTexts[0].style.fontSize)); // TODO do this better (find max font size for line spacing purposes)
    console.warn('StyleStrings:\n---\n', ssTexts);
    const parStyleOb = {lineHeight: 1.2, align: 'right', justify: false, font: "Helvetica"}; // TODO get this from XML
    let [dy1, dy2] = layoutLines(doc, parStyleOb, ssTexts, x, startY, w, h);
    console.warn(dy1, dy2);
    startY += dy2;
    isFirst = false;
  });
  return BrayElem.create('view2', props, ...children);
}
