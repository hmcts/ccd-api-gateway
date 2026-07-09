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

  it('keeps characters adjacent to control ranges', () => {
    const value = 'A B~C\xa0D';

    expect(sanitize.sanitizeData(value)).to.equal('A B~C\xa0D');
  });

  it('removes control characters at range boundaries', () => {
    const value = '\x00\x1fA\x7f\x9fB';

    expect(sanitize.sanitizeData(value)).to.equal('AB');
  });

  it('returns an empty string for missing values', () => {
    expect(sanitize.sanitizeData()).to.equal('');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitize.sanitizeData('')).to.equal('');
  });
});