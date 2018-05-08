import FreeSound from '../';

require('dotenv').config();

describe('API', function testApi() {
  beforeAll(() => {
    this.freeSound = new FreeSound();
  });

  it('should login with credentials', () => {
    this.freeSound.login({
      API_KEY: process.env.API_KEY
    });
  });
});
