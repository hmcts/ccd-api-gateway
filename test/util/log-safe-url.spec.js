const chai = require('chai');
const expect = chai.expect;

const { redactUrl } = require('../../app/util/log-safe-url');

describe('log safe url', () => {
  it('should return empty values unchanged', () => {
    expect(redactUrl()).to.equal(undefined);
    expect(redactUrl('')).to.equal('');
  });

  it('should return relative URLs without query strings unchanged', () => {
    expect(redactUrl('/data/internal/cases/123')).to.equal('/data/internal/cases/123');
  });

  it('should remove an empty query string from relative URLs', () => {
    expect(redactUrl('/data/internal/cases/123?')).to.equal('/data/internal/cases/123');
  });

  it('should redact sensitive query parameters from relative URLs', () => {
    const url = '/data/internal/cases/123?token=abc&access=read&code=secret';

    expect(redactUrl(url)).to.equal('/data/internal/cases/123?token=REDACTED&access=read&code=REDACTED');
  });

  it('should preserve fragments on relative URLs', () => {
    const url = '/data/internal/cases/123?state=secret&access=read#details';

    expect(redactUrl(url)).to.equal('/data/internal/cases/123?state=REDACTED&access=read#details');
  });

  it('should redact sensitive query parameters from absolute URLs', () => {
    const url = 'https://idam.example/oauth2/token?code=abc&redirect_uri=https%3A%2F%2Fgateway.example%2Foauth2';

    expect(redactUrl(url))
      .to.equal('https://idam.example/oauth2/token?code=REDACTED&redirect_uri=https%3A%2F%2Fgateway.example%2Foauth2');
  });

  it('should return malformed absolute URLs unchanged', () => {
    const url = 'https://[invalid';

    expect(redactUrl(url)).to.equal(url);
  });
});
