import FreeSound from "../index.ts";

require("dotenv").config();

function removeVariableProperties(obj) {
  /* eslint-disable f */
  delete obj.num_downloads;
  delete obj.count;
  delete obj.results;
  delete obj.bitrate;
  delete obj.id;
  delete obj.average_rating;
  delete obj.duration;
  delete obj.ac_analysis;
  /* eslint-enable */
  return obj;
}

describe("API", function testApi() {
  beforeAll(async () => {
    this.freeSound = new FreeSound();
    this.freeSound.setToken(process.env.CLIENT_SECRET);
    this.freeSound.setClientSecrets(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET
    );
  });

  describe("User", () => {
    it("should get user", async () => {
      expect(
        removeVariableProperties(await this.freeSound.getUser("Jovica"))
      ).toMatchSnapshot();
    });

    it("should get a users data", async () => {
      const user = await this.freeSound.getUser("Jovica");
      const [sounds, packs, bookCat, bookCatSounds] = await Promise.all([
        user.sounds(),
        user.packs(),
        user.bookmarkCategories(),
        user.bookmarkCategorySounds(),
      ]);
      expect(sounds).toBeTruthy();
      expect(packs).toBeTruthy();
      expect(bookCat).toBeTruthy();
      expect(bookCatSounds).toBeTruthy();
      expect(removeVariableProperties(sounds)).toMatchSnapshot();
      expect(removeVariableProperties(packs)).toMatchSnapshot();
      expect(removeVariableProperties(bookCat)).toMatchSnapshot();
      expect(removeVariableProperties(bookCatSounds)).toMatchSnapshot();
    });
  });

  describe("Pack", () => {
    it("should get pack", async () => {
      const pack = await this.freeSound.getPack(9678);
      expect(removeVariableProperties(pack)).toMatchSnapshot();
    });

    it("should get pack data", async () => {
      const pack = await this.freeSound.getPack(9678);
      const sounds = await pack.sounds();
      expect(removeVariableProperties(sounds)).toMatchSnapshot();
    });
  });

  describe("Sound", () => {
    it("should get sound", async () => {
      const sound = await this.freeSound.getSound(96541);
      expect(removeVariableProperties(sound)).toBeTruthy();
    });

    it("should get sound data", async () => {
      const sound = await this.freeSound.getSound(96541);
      const [analysis, similar, comments] = await Promise.all([
        sound.getAnalysis(),
        sound.getSimilar(),
        sound.getComments(),
      ]);
      expect(analysis).toBeTruthy();
      expect(similar).toBeTruthy();
      expect(comments).toBeTruthy();
      expect(removeVariableProperties(analysis)).toMatchSnapshot();
    });
  });

  describe("Search", () => {
    it("should text search", async () => {
      const query = "violoncello";
      const page = 1;
      const filter = "tag:tenuto duration:[1.0 TO 15.0]";
      const sort = "rating_desc";
      const fields = "id,name,url";
      const search = await this.freeSound.textSearch(query, {
        page,
        filter,
        sort,
        fields,
      });
      expect(removeVariableProperties(search)).toMatchSnapshot();
    });

    it("should perform combined search", async () => {
      const result = await this.freeSound.combinedSearch({
        target: "rhythm.bpm:120",
        filter: "tag:loop",
      });
      expect(result).toBeTruthy();
      expect(removeVariableProperties(result)).toMatchSnapshot();
    });

    it("should perform content search", async () => {
      const result = await this.freeSound.contentSearch({
        target: "lowlevel.pitch.mean:220",
      });
      expect(result).toBeTruthy();
      expect(removeVariableProperties(result)).toMatchSnapshot();
    });
  });

  describe.skip("Auth", () => {
    it("should go through oauth process", async () => {
      // OAuth login
      await this.freeSound.setToken("your-api-key", "oauth");
      // Set your application's client_id and client_secret
      await this.freeSound.setClientSecrets(
        "your-client-id",
        "your-secret-key"
      );
      // Make the user navigate here
      await this.freeSound.getLoginURL();
      // Use the authorization code from the login
      await this.freeSound.postAccessCode("your-temporary-code-from-login");
    });

    it("should get me", async () => {
      expect(await this.freeSound.me()).toBeTruthy();
    });

    it("should get pending sounds", async () => {
      expect(await this.freeSound.getPendingSounds()).toBeTruthy();
    });
  });
});
