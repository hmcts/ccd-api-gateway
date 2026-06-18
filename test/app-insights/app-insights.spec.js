import chai from 'chai';
const expect = chai.expect;
import enableAppInsights from '../../app/app-insights/app-insights';

describe('Application insights', () => {
  it('should initialize properly', () => {
    expect(enableAppInsights).to.not.throw();
  });
});
