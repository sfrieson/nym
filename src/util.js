/**
 * @param {any} value?
 * @param {string} message
 */
function expect(value, message) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

export { expect };
