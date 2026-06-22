import { expect } from 'chai';

import authorisedRolesExtractor from '../../app/user/authorised-roles-extractor.js';
import http from 'http';

describe('Authorised roles extractor', () => {
    describe('extract()', () => {
      it('should return empty roles array when user group cannot be found', () => {
          let request = Object.create(http.IncomingMessage.prototype);
          request.originalUrl = '/data/';

          let roles = authorisedRolesExtractor(request);

          expect(roles.length).to.equal(0);
      });

      it('should return lower case user group as role when jurisdiction cannot be found', () => {
          let request = Object.create(http.IncomingMessage.prototype);
          request.originalUrl = '/data/caseworkers/5/profile';

          let roles = authorisedRolesExtractor(request);

          expect(roles).to.contain('caseworker');
          expect(roles.length).to.equal(1);
      });

      it('should extract correct lowercase role from url', () => {
          let request = Object.create(http.IncomingMessage.prototype);
          request.originalUrl = '/data/CaseWorkers/5/jurisdiction/TEST/case-types/TestAddressBookCase/cases/7';

          let roles = authorisedRolesExtractor(request);

          expect(roles).to.contain('caseworker-test');
          expect(roles.length).to.equal(1);
      });
    });
});
