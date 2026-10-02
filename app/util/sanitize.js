const sanitizeData = (data) => {
  let sanitizedData = '';

  if (data) {
    sanitizedData = data.replaceAll('\n', '').replaceAll('\r', '');
  }

  return sanitizedData;
};

exports.sanitizeData = sanitizeData;
