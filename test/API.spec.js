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
    this.freeSound.setToken(process.env.CLIENT_SECRET);
    this.freeSound.setClientSecrets(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
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

  it('should go through oauth process', async () => {
    // OAuth login
    await this.freeSound.setToken('your-api-key', 'oauth');
    // Set your application's client_id and client_secret
    await this.freeSound.setClientSecrets('your-client-id', 'your-secret-key');
    // Make the user navigate here
    await this.freeSound.getLoginURL();
    // Use the authorization code from the login
    await this.freeSound.postAccessCode('your-temporary-code-from-login');
  });

  it('should get me', async () => {
    console.log(await this.freeSound.me());
    expect(await this.freeSound.me()).toBeTruthy();
  });

  it('should get pending sounds', async () => {
    console.log(await this.freeSound.getPendingSounds());
    expect(await this.freeSound.getPendingSounds()).toBeTruthy();
  });

  it('should perform combined search', async () => {
    console.log(await this.freeSound.combinedSearch());
    expect(await this.freeSound.combinedSearch()).toBeTruthy();
  });

  it('should perform content search', async () => {
    console.log(await this.freeSound.contentSearch());
    expect(await this.freeSound.contentSearch()).toBeTruthy();
  });
});
