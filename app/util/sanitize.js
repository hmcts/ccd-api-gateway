const sanitizeData = (data) => {
  let sanitizedData = '';

  if (data) {
    sanitizedData = data.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  }

  return sanitizedData;
};

exports.sanitizeData = sanitizeData;
