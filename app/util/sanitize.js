const validateAccessControlRequestHeaders = (data) => {
    var reg = new RegExp(/^([a-zA-Z-, ]*)$/);
    return reg.test(data);
};

const validateOrigin = (data) => {
    var reg = new RegExp(/^([a-zA-Z\d\-:/,. *]*)$/);
    return reg.test(data);
};

exports.validateAccessControlRequestHeaders = validateAccessControlRequestHeaders;
exports.validateOrigin = validateOrigin;
