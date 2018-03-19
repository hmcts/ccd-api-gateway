function extractAddress(postcodeServiceResponse) {
  return new Address(postcodeServiceResponse);
}

function Address (serviceResponse) {

  const poBox = serviceResponse.po_box_number;
  const subBuilding = titleCase(serviceResponse.sub_building_name);
  const building = titleCase(serviceResponse.building_name);
  const dependantLocality = titleCase(serviceResponse.dependent_locality);
  const numberAndStreet = titleCase((serviceResponse.building_number ? serviceResponse.building_number + ' ' : '')
    + (serviceResponse.thoroughfare_name ? serviceResponse.thoroughfare_name : ''));

  this.AddressLine1 = poBox ? 'PO BOX ' + poBox : subBuilding ? subBuilding : building ? building : numberAndStreet;
  this.AddressLine2 = subBuilding && building ? building : this.AddressLine1 === numberAndStreet ? '' : numberAndStreet;
  this.AddressLine3 = subBuilding && building ? numberAndStreet ? numberAndStreet : '' : dependantLocality ? dependantLocality : '';
  this.PostTown = titleCase(serviceResponse.post_town);
  this.County = '';
  this.PostCode = serviceResponse.postcode;
  this.Country ='United Kingdom';

}

function titleCase(string) {
  let words = string.split(' ');
  for (let i=0; i<words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
  }
  return words.join(' ');
}

module.exports = extractAddress;
