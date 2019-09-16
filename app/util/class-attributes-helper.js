
function hasAnAttribute(object, attributeName){

  if('undefined' !== typeof(object[attributeName])){
    return true;
  }else{
    return false;
  }
}

module.exports = hasAnAttribute;
