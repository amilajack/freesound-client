import FreeSound from '../';

require('dotenv').config();

describe('API', function testApi() {
  beforeAll(() => {
    this.freeSound = new FreeSound();
  });

  it('should login with credentials', async () => {
    // this.freeSound.login({
    //   API_KEY: process.env.API_KEY
    // });
    console.log(await this.freeSound.setToken(process.env.API_KEY));
  });

  it('should get sound', async () => {
    console.log(await this.freeSound.getSound(96541));
  });

  it('should text search', async () => {
    const query = 'violoncello';
    const page = 1;
    const filter = 'tag:tenuto duration:[1.0 TO 15.0]';
    const sort = 'rating_desc';
    const fields = 'id,name,url';
    console.log(await this.freeSound.textSearch(query, {
      page,
      filter,
      sort,
      fields
    }));
  });

  it('should get user', async () => {
    console.log(await this.freeSound.getUser('Jovica'));
  });
});
