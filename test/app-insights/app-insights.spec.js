import { expect } from 'chai';
import enableAppInsights from '../../app/app-insights/app-insights.js';

describe('Application insights', () => {
  it('should initialize properly', () => {
    expect(enableAppInsights).to.not.throw();
  });
});
