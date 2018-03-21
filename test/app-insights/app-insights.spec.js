const chai = require('chai');
const expect = chai.expect;
const enableAppInsights = require('../../app/app-insights/app-insights');

describe('Application insights', () => {
  it('should initialize properly', () => {
    expect(enableAppInsights).to.not.throw();
  });
});
