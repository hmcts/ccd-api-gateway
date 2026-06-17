const sanitizeData = (data) => {
  let sanitizedData = '';

  if (data) {
    sanitizedData = data.replace('\n', '').replace('\r', '');
  }

  return sanitizedData;
};

export default sanitizeData;

