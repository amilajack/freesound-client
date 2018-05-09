import FreeSound from '../';

require('dotenv').config();

function removeDownloadCount(obj) {
  // eslint-disable-next-line
  delete obj.num_downloads;
  return obj;
}

describe('API', function testApi() {
  beforeAll(async () => {
    this.freeSound = new FreeSound();
    await this.freeSound.setToken(process.env.API_KEY);
  });

  it('should get sound', async () => {
    expect(removeDownloadCount(await this.freeSound.getSound(96541))).toMatchSnapshot();
  });

  it('should text search', async () => {
    const query = 'violoncello';
    const page = 1;
    const filter = 'tag:tenuto duration:[1.0 TO 15.0]';
    const sort = 'rating_desc';
    const fields = 'id,name,url';
    expect(await this.freeSound.textSearch(query, {
      page,
      filter,
      sort,
      fields
    })).toMatchSnapshot();
  });

  it('should get user', async () => {
    expect(await this.freeSound.getUser('Jovica')).toMatchSnapshot();
  });
});
