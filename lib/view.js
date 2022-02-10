import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

import { StyledString } from './text.js';

export default function View(props) {
  const doc = props._doc;
  console.warn('SIZE:', doc.page.width, doc.page.height);
  console.warn('VIEW props:', props.x, props.y, props.width, props.height, props['font-size']);
  // TODOx do something with props._doc
  //
  const children = BrayElem.childrenWithoutWhitespaceStrings(props.children);
  children.forEach(kid => {
    if (BrayElem.isString(kid)) {
      throw new AuspexArgumentException("Auspex <view> elements can only contain tags, not strings. Wrap text in a <text> tag.");
    }
  });
  // TODO flatten the lists of texts and create flat list of StyledString objects
  const texts = children.filter(kid => kid.props._oldTagName === 'text');
  console.warn('TEXTS:', texts.length);
  // TODOx
  return BrayElem.create('view2', props, ...children);
}
