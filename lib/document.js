import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

export default function Document(props) {
  if (!props._doc) {
    throw new AuspexArgumentException("Auspex <document> element needs PDFKit document object as props._doc.");
  }
  const doc = props._doc;
  // document metadata
  if (props.author) {
    doc.info.Author = props.author;
  }
  if (props.subject) {
    doc.info.Subject = props.subject;
  }
  if (props.title) {
    doc.info.Title = props.title;
  }
  if (props.keywords) {
    doc.info.Keywords = props.keywords;
  }
  const pprops = BrayElem.pushFront(props._parentProps, props);
  const extraProps = {_doc: doc, _parentProps: pprops};
  // Do something useful with props._doc and children
  // console.warn('NOW do something useful');
  // children.forEach(kid => {
  //   const pprops = BrayElem.pushFront(kid.props._parentProps, props);
  //   kid.invokeSelf({_doc: doc, _parentProps: pprops});
  // });

  //console.warn('SCAN children');
  const children = BrayElem.childrenWithoutWhitespaceStrings(props.children, extraProps);
  children.forEach(kid => {
    if (BrayElem.isString(kid)) {
      throw new AuspexArgumentException("Auspex <document> elements can only contain tags, not strings. Wrap text in a <text> tag.");
    }
  });
  return BrayElem.create('document2', props, ...children);
}
