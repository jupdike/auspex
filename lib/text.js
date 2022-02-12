import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

export function Text(props) {
  // console.warn("Text -- props:", props);
  props.children.forEach(kid => {
    if (BrayElem.isString(kid)) {
      return;
    }
    if (kid.props._oldTagName !== 'text') {
      throw new AuspexArgumentException("Auspex <text> elements can only contain strings or other <text> elements. Found tag named: " + kid.props._oldTagName);
    }
  });
  // TODOx do something interesting at all, with props.doc or props.bounds ...
  //
  //
  const color = BrayElem.propOrStyleOrDefault(props, 'color', 'black');
  console.warn('Text -- COLOR:', color);
  let node = BrayElem.create('text2', props, ...props.children);
  return node;
}
