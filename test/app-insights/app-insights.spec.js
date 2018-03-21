const chai = require('chai');
const enableAppInsights = require('../../app/app-insights/app-insights');
const expect = chai.expect;

describe('Application insights', () => {
  it('should initialize properly', () => {
    expect(enableAppInsights).to.not.throw();
  });
});
