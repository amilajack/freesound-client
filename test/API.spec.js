import FreeSound from '../'

require('dotenv').config();

describe('API', () => {
  it('should login with credentials', () => {
    const freeSound = new FreeSound({
      API_KEY: process.env.API_KEY
    });
  });
});
