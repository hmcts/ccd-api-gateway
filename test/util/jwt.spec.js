import {expect} from 'chai';

import * as jwtUtil from '../../app/util/jwt.js';

describe('get bearer jwt', () => {
  it('should return bearer where jwt has prefix', () => {
    let jwt = 'Bearer jhfsdkghjroiutyortjlkytmyk.';
    let response = jwtUtil.addBearer(jwt);

    expect(response).to.equal(jwt);
  });

  it('should return bearer where jwt does not prefix', () => {
    let jwt = 'jhfsdkghjroiutyortjlkytmyk.';
    let response = jwtUtil.addBearer(jwt);

    expect(response).to.equal('Bearer ' + jwt);
  });
});

describe('get jwt', () => {
  it('should return jwt where jwt has prefix', () => {
    let token = 'jhfsdkghjroiutyortjlkytmyk';
    let jwt = 'Bearer ' + token;
    let response = jwtUtil.removeBearer(jwt);

    expect(response).to.equal(token);
  });

  it('should return jwt where jwt does not prefix', () => {
    let jwt = 'jhfsdkghjroiutyortjlkytmyk.';
    let response = jwtUtil.removeBearer(jwt);

    expect(response).to.equal(jwt);
  });
});
