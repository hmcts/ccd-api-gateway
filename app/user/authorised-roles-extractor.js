const extract = (request) => {
  let pattern = /^\/[^/]+\/([^/]+)\/[^/]+\/(?:jurisdictions?\/([^/]+)\/)?.+$/;
  let match = request.originalUrl.match(pattern) || [];

  if (match[1]) {
    let userGroup = match[1]
      .toLowerCase() // Roles are lowercase
      .replace(/s$/, ''); // Roles are singular, url resources is plural

    if (match[2]) {
      let jurisdiction = match[2].toLowerCase();

      return [`${userGroup}-${jurisdiction}`];
    }

    return [`${userGroup}`];
  }

  return [];
};

exports.extract = extract;
