// These control ranges are intentional: strip C0, DEL and C1 from header values.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\x00-\x1f\x7f-\x9f]/g;

const sanitizeData = (data) => {
  let sanitizedData = '';

  if (data) {
    sanitizedData = data.replace(CONTROL_CHARACTERS, '');
  }

  return sanitizedData;
};

exports.sanitizeData = sanitizeData;
