const chai = require('chai');
const expect = chai.expect;
const extractAddress = require('../../app/address/extract-address');

describe('Extract Address', () => {

  it('Should return correct addresses for response with sub building name and building name', () => {

    const address = extractAddress(
      JSON.parse('{"uprn":"6184048","organisation_name":"","department_name":"","po_box_number":"","building_name":"MORLEY HOUSE","sub_building_name":"FLAT 13","building_number":63,"thoroughfare_name":"GLASSHOUSE FIELDS","dependent_thoroughfare_name":"","dependent_locality":"","double_dependent_locality":"","post_town":"LONDON","postcode":"E1W 3AX","postcode_type":"S","formatted_address":"Flat 13\\nMorley House\\n63 Glasshouse Fields\\nLondon\\nE1W 3AX","point":{"type":"Point","coordinates":[-0.0469181,51.5104457]}}')
    );

    expect(address.AddressLine1).equals('Flat 13');
    expect(address.AddressLine2).equals('Morley House');
    expect(address.AddressLine3).equals('63 Glasshouse Fields');
    expect(address.PostTown).equals('London');
    expect(address.County).equals('');
    expect(address.PostCode).equals('E1W 3AX');
    expect(address.Country).equals('United Kingdom');

  });

  it('Should return correct addresses for response with building number and thoroughfare name', () => {

    const address = extractAddress(
      JSON.parse('{"uprn":"100000083731","organisation_name":"","department_name":"","po_box_number":"","building_name":"","sub_building_name":"","building_number":14,"thoroughfare_name":"LAMBTON CLOSE","dependent_thoroughfare_name":"","dependent_locality":"","double_dependent_locality":"","post_town":"RYTON","postcode":"NE40 4UX","postcode_type":"S","formatted_address":"14 Lambton Close\\nRyton\\nNE40 4UX","point":{"type":"Point","coordinates":[-1.7847992,54.9658624]}}')
    );

    expect(address.AddressLine1).equals('14 Lambton Close');
    expect(address.AddressLine2).equals('');
    expect(address.AddressLine3).equals('');
    expect(address.PostTown).equals('Ryton');
    expect(address.County).equals('');
    expect(address.PostCode).equals('NE40 4UX');
    expect(address.Country).equals('United Kingdom');

  });

  it('Should return correct addresses for response with building number, and dependant locality thoroughfare name', () => {

    const address = extractAddress(
      JSON.parse('{"uprn":"100000085646","organisation_name":"","department_name":"","po_box_number":"","building_name":"","sub_building_name":"","building_number":1,"thoroughfare_name":"SOUTH VIEW","dependent_thoroughfare_name":"","dependent_locality":"CLARA VALE","double_dependent_locality":"","post_town":"RYTON","postcode":"NE40 3SY","postcode_type":"S","formatted_address":"1 South View\\nClara Vale\\nRyton\\nNE40 3SY","point":{"type":"Point","coordinates":[-1.7915689,54.9796949]}}')
    );

    expect(address.AddressLine1).equals('1 South View');
    expect(address.AddressLine2).equals('');
    expect(address.AddressLine3).equals('Clara Vale');
    expect(address.PostTown).equals('Ryton');
    expect(address.County).equals('');
    expect(address.PostCode).equals('NE40 3SY');
    expect(address.Country).equals('United Kingdom');

  });

  it('Should return correct addresses for response with building number, and dependant locality thoroughfare name', () => {

    const address = extractAddress(
      JSON.parse('{"uprn":"10090415115","organisation_name":"","department_name":"","po_box_number":"","building_name":"1 THE OLD CO-OP","sub_building_name":"","building_number":null,"thoroughfare_name":"EAST VIEW","dependent_thoroughfare_name":"","dependent_locality":"CLARA VALE","double_dependent_locality":"","post_town":"RYTON","postcode":"NE40 3BF","postcode_type":"S","formatted_address":"1 the Old Co-Op\\nEast View\\nClara Vale\\nRyton\\nNE40 3BF","point":{"type":"Point","coordinates":[-1.7921532,54.9784827]}}')
    );

    expect(address.AddressLine1).equals('1 The Old Co-op');
    expect(address.AddressLine2).equals('East View');
    expect(address.AddressLine3).equals('Clara Vale');
    expect(address.PostTown).equals('Ryton');
    expect(address.County).equals('');
    expect(address.PostCode).equals('NE40 3BF');
    expect(address.Country).equals('United Kingdom');

  });

  it('Should return correct addresses for response with PO BOX', () => {

    const address = extractAddress(
      JSON.parse('{"uprn":"10015093303","organisation_name":"METRO RADIO GROUP PLC","department_name":"","po_box_number":"9","building_name":"","sub_building_name":"","building_number":null,"thoroughfare_name":"","dependent_thoroughfare_name":"","dependent_locality":"","double_dependent_locality":"","post_town":"NEWCASTLE UPON TYNE","postcode":"NE99 1BB","postcode_type":"L","formatted_address":"Metro Radio Group Plc\\n9\\nNewcastle Upon Tyne\\nNE99 1BB","point":{"type":"Point","coordinates":[-1.6153957,54.9674666]}}')
    );

    expect(address.AddressLine1).equals('PO BOX 9');
    expect(address.AddressLine2).equals('');
    expect(address.AddressLine3).equals('');
    expect(address.PostTown).equals('Newcastle Upon Tyne');
    expect(address.County).equals('');
    expect(address.PostCode).equals('NE99 1BB');
    expect(address.Country).equals('United Kingdom');

  });

});
