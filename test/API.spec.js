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
    this.freeSound.setClientSecrets(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET
    );
  });

  describe('User', () => {
    it('should get user', async () => {
      expect(await this.freeSound.getUser('Jovica')).toMatchSnapshot();
    });

    it('should get a users data', async () => {
      const user = await this.freeSound.getUser('Jovica');
      const [sounds, packs, bookCat, bookCatSounds] = await Promise.all([
        user.sounds(),
        user.packs(),
        user.bookmarkCategories(),
        user.bookmarkCategorySounds()
      ]);
      expect(sounds).toBeTruthy();
      expect(packs).toBeTruthy();
      expect(bookCat).toBeTruthy();
      expect(bookCatSounds).toBeTruthy();
      expect(sounds).toMatchSnapshot();
      expect(packs).toMatchSnapshot();
      expect(bookCat).toMatchSnapshot();
      expect(bookCatSounds).toMatchSnapshot();
    });
  });

  describe('Pack', () => {
    it('should get pack', async () => {
      const pack = await this.freeSound.getPack(9678);
      expect(pack).toMatchSnapshot();
    });

    it('should get pack data', async () => {
      const pack = await this.freeSound.getPack(9678);
      expect(await pack.sounds()).toMatchSnapshot();
    });
  });

  describe('Sound', () => {
    it('should get sound', async () => {
      expect(
        removeDownloadCount(await this.freeSound.getSound(96541))
      ).toMatchSnapshot();
    });

    it('should get sound data', async () => {
      const sound = await this.freeSound.getSound(96541);
      const [analysis, similar, comments] = await Promise.all([
        sound.getAnalysis(),
        sound.getSimilar(),
        sound.getComments()
      ]);
      expect(analysis).toBeTruthy();
      expect(similar).toBeTruthy();
      expect(comments).toBeTruthy();
      expect(analysis).toMatchSnapshot();
      expect(analysis).toMatchSnapshot();
      expect(analysis).toMatchSnapshot();
    });
  });

  it('should text search', async () => {
    const query = 'violoncello';
    const page = 1;
    const filter = 'tag:tenuto duration:[1.0 TO 15.0]';
    const sort = 'rating_desc';
    const fields = 'id,name,url';
    expect(
      await this.freeSound.textSearch(query, {
        page,
        filter,
        sort,
        fields
      })
    ).toMatchSnapshot();
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
    expect(await this.freeSound.me()).toBeTruthy();
  });

  it('should get pending sounds', async () => {
    expect(await this.freeSound.getPendingSounds()).toBeTruthy();
  });

  it('should perform combined search', async () => {
    const result = await this.freeSound.combinedSearch({ target: 'rhythm.bpm:120&filter=tag:loop' })
    expect(result).toBeTruthy();
    expect(result).toMatchSnapshot();
  });

  it('should perform content search', async () => {
    const result = await this.freeSound.contentSearch({ target: 'lowlevel.pitch.mean:220' })
    expect(result).toBeTruthy();
    expect(result).toMatchSnapshot();
  });
});
