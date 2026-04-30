const fs = require('fs');
const path = require('path');

const containsPath = (basePath, targetPath) => {
  const relativePath = path.relative(basePath, targetPath);

  return relativePath === '' || (
    !relativePath.startsWith('..') &&
    !path.isAbsolute(relativePath)
  );
};

const resolveContainedFile = (baseDirectory, fileName) => {
  if (path.isAbsolute(fileName)) {
    throw new Error('File path must be relative to the configured directory');
  }

  const resolvedBaseDirectory = path.resolve(baseDirectory);
  const baseStats = fs.lstatSync(resolvedBaseDirectory);

  if (baseStats.isSymbolicLink() || !baseStats.isDirectory()) {
    throw new Error('Configured directory must be a real directory');
  }

  const resolvedFilePath = path.resolve(resolvedBaseDirectory, fileName);

  if (!containsPath(resolvedBaseDirectory, resolvedFilePath)) {
    throw new Error('File path must stay within the configured directory');
  }

  const fileStats = fs.lstatSync(resolvedFilePath);

  if (fileStats.isSymbolicLink() || !fileStats.isFile()) {
    throw new Error('Configured file must be a regular file');
  }

  const realBaseDirectory = fs.realpathSync(resolvedBaseDirectory);
  const realFilePath = fs.realpathSync(resolvedFilePath);

  if (!containsPath(realBaseDirectory, realFilePath)) {
    throw new Error('File path must resolve within the configured directory');
  }

  return realFilePath;
};

const readContainedFile = (baseDirectory, fileName) => {
  const filePath = resolveContainedFile(baseDirectory, fileName);
  const noFollowFlag = fs.constants.O_NOFOLLOW || 0;
  const fd = fs.openSync(filePath, fs.constants.O_RDONLY | noFollowFlag);

  try {
    const fileStats = fs.fstatSync(fd);

    if (!fileStats.isFile()) {
      throw new Error('Configured file must be a regular file');
    }

    return fs.readFileSync(fd);
  } finally {
    fs.closeSync(fd);
  }
};

module.exports = {
  readContainedFile,
  resolveContainedFile
};
