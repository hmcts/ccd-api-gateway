const chai = require('chai');
const expect = chai.expect;

const sanitize = require('../../app/util/sanitize');

describe('sanitizeData', () => {

  describe('falsy input', () => {
    it('should return empty string for null input', () => {
      expect(sanitize.sanitizeData(null)).to.equal('');
    });

    it('should return empty string for undefined input', () => {
      expect(sanitize.sanitizeData(undefined)).to.equal('');
    });
  });

  describe('clean input', () => {
    it('should return clean string unchanged', () => {
      let data = 'https://example.com';
      let response = sanitize.sanitizeData(data);

      expect(response).to.equal(data);
    });
  });

  describe('newline sanitization', () => {
    it('should remove a single \\n character', () => {
      let response = sanitize.sanitizeData('foo\nbar');

      expect(response).to.equal('foobar');
    });

    it('should remove a single \\r character', () => {
      let response = sanitize.sanitizeData('foo\rbar');

      expect(response).to.equal('foobar');
    });

    it('should remove multiple \\n characters', () => {
      let response = sanitize.sanitizeData('foo\nbar\nbaz');

      expect(response).to.equal('foobarbaz');
    });

    it('should remove multiple \\r characters', () => {
      let response = sanitize.sanitizeData('foo\rbar\rbaz');

      expect(response).to.equal('foobarbaz');
    });

    it('should remove all \\r\\n pairs from a header injection payload', () => {
      let malicious = 'http://evil.com\r\nX-Injected: true\r\nAnother: header';
      let response = sanitize.sanitizeData(malicious);

      expect(response).to.equal('http://evil.comX-Injected: trueAnother: header');
    });

    it('should remove interleaved \\r and \\n characters', () => {
      let response = sanitize.sanitizeData('a\rb\nc\rd\ne');

      expect(response).to.equal('abcde');
    });
  });
});
