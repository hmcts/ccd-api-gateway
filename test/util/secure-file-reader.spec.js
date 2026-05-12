const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const os = require('os');
const path = require('path');

const secureFileReader = require('../../app/util/secure-file-reader');

describe('secure file reader', () => {
  let tempDirectory;
  let outsideDirectory;

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'secure-file-reader-'));
    outsideDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'secure-file-reader-outside-'));
  });

  afterEach(() => {
    fs.rmSync(tempDirectory, {recursive: true, force: true});
    fs.rmSync(outsideDirectory, {recursive: true, force: true});
  });

  it('should read files contained by the configured directory', () => {
    fs.writeFileSync(path.join(tempDirectory, 'allowed.txt'), 'safe');

    const content = secureFileReader.readContainedFile(tempDirectory, 'allowed.txt');

    expect(content.toString()).to.equal('safe');
  });

  it('should reject path traversal outside the configured directory', () => {
    fs.writeFileSync(path.join(outsideDirectory, 'outside.txt'), 'outside');
    const traversalPath = path.join('..', path.basename(outsideDirectory), 'outside.txt');

    expect(() => secureFileReader.readContainedFile(tempDirectory, traversalPath))
      .to.throw('File path must stay within the configured directory');
  });

  it('should reject symbolic links', function () {
    const targetPath = path.join(outsideDirectory, 'outside.txt');
    const linkPath = path.join(tempDirectory, 'linked.txt');

    fs.writeFileSync(targetPath, 'outside');

    try {
      fs.symlinkSync(targetPath, linkPath);
    } catch (err) {
      if (err.code === 'EPERM') {
        this.skip();
      }

      throw err;
    }

    expect(() => secureFileReader.readContainedFile(tempDirectory, 'linked.txt'))
      .to.throw('Configured file must be a regular file');
  });
});
