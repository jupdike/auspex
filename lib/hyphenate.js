import Hypher from 'hypher';
import english from 'hyphenation.en-us';
const h = new Hypher(english);
export default function hyphenateText(x) {
  return h.hyphenateText(x);
}
