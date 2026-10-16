const isControlCharacter = (character) => {
  const code = character.codePointAt(0);

  return (code >= 0 && code <= 31) || (code >= 127 && code <= 159);
};

const sanitizeData = (data) => {
  let sanitizedData = '';

  if (data) {
    sanitizedData = Array.from(data)
      .filter((character) => !isControlCharacter(character))
      .join('');
  }

  return sanitizedData;
};

exports.sanitizeData = sanitizeData;
