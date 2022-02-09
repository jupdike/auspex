// https://stackoverflow.com/questions/464359/custom-exception-type
function AuspexArgumentException(message) {
  this.message = message;
  // Use V8's native method if available, otherwise fallback
  if ("captureStackTrace" in Error) {
    Error.captureStackTrace(this, AuspexArgumentException);
  }
  else {
    this.stack = (new Error()).stack;
  }
}
AuspexArgumentException.prototype = Object.create(Error.prototype);
AuspexArgumentException.prototype.name = "AuspexArgumentException";
AuspexArgumentException.prototype.constructor = AuspexArgumentException;
export default AuspexArgumentException;
