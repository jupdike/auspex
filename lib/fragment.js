import { BrayElem } from 'bray';

export default function Fragment(props) {
  let node = BrayElem.create(BrayElem.Fragment, props, ...props.children);
  //console.warn("Fragment:", node);
  return node;
}
