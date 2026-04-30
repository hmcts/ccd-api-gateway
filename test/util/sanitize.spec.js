const chai = require('chai');
const expect = chai.expect;

const sanitize = require('../../app/util/sanitize');

describe('sanitizeData', () => {
  it('removes all CRLF characters from header values', () => {
    const value = 'X-One\r\nX-Two\r\nX-Three';

    expect(sanitize.sanitizeData(value)).to.equal('X-OneX-TwoX-Three');
  });

  it('removes ASCII and C1 control characters', () => {
    const value = 'A\x00B\x1fC\x7fD\x9fE';

    expect(sanitize.sanitizeData(value)).to.equal('ABCDE');
  });

  it('returns an empty string for missing values', () => {
    expect(sanitize.sanitizeData()).to.equal('');
  });
});