import config from 'config';
import fetch from '../util/fetch.js';
import {addBearer} from '../util/jwt.js';

const getUserDetails = (jwt) => {
  return fetch(`${config.get('idam.base_url')}/o/userinfo`, {
    headers: {
      'Authorization': addBearer(jwt)
    }
  })
  .then(res => res.json());
};

export {getUserDetails};
