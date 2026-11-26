const chai = require('chai');
const expect = chai.expect;

const sanitize = require('../../app/util/sanitize');

describe('sanitizeData', () => {
  it('removes all CRLF characters from header values', () => {
    const value = 'X-One\r\nX-Two\r\nX-Three';

    expect(sanitize.sanitizeData(value)).to.equal('X-OneX-TwoX-Three');
  });

  it('removes every C0, DEL and C1 control character', () => {
    let controls = '';
    for (let code = 0; code <= 0x9f; code++) {
      if (code <= 0x1f || code >= 0x7f) {
        const control = String.fromCharCode(code);
        expect(sanitize.sanitizeData(`A${control}B${control}C`), `control code ${code}`)
          .to.equal('ABC');
        controls += control;
      }
    }

    expect(sanitize.sanitizeData(controls)).to.equal('');
    expect(sanitize.sanitizeData(`A${controls}B${controls}C`)).to.equal('ABC');
  });

  it('keeps characters adjacent to control ranges', () => {
    const value = 'A B~C\xa0D';

    expect(sanitize.sanitizeData(value)).to.equal('A B~C\xa0D');
  });

  it('preserves printable ASCII and Unicode characters', () => {
    const value = 'https://example.com/\u00e9\u4e2d\ud83d\ude00';

    expect(sanitize.sanitizeData(value)).to.equal(value);
  });

  it('removes control characters at range boundaries', () => {
    const value = '\x00\x1fA\x7f\x9fB';

    expect(sanitize.sanitizeData(value)).to.equal('AB');
  });

  it('returns an empty string for missing values', () => {
    expect(sanitize.sanitizeData()).to.equal('');
  });

  it('returns an empty string for null input', () => {
    expect(sanitize.sanitizeData(null)).to.equal('');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitize.sanitizeData('')).to.equal('');
  });
});
