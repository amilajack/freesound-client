import FreeSound from "../index";
import mockAnalysis from "./__mocks__/sound/mockAnalysis.json";
import mockCombinedSearchResult from "./__mocks__/search/mockCombinedSearchResult.json";
import mockContentSearchResult from "./__mocks__/search/mockContentSearchResult.json";
import mockPack from "./__mocks__/pack/mockPack.json";
import mockPackSounds from "./__mocks__/pack/mockPackSounds.json";
import mockSimilarSounds from "./__mocks__/sound/mockSimilarSounds.json";
import mockSound from "./__mocks__/sound/mockSound.json";
import mockSoundComments from "./__mocks__/sound/mockSoundComments.json";
import mockTextSearch from "./__mocks__/search/mockTextSearch.json";
import mockUser from "./__mocks__/user/mockUser.json";
import mockUserBookCat from "./__mocks__/user/mockUserBookCat.json";
import mockUserBookCatSounds from "./__mocks__/user/mockUserBookCatSounds.json";
import mockUserPacks from "./__mocks__/user/mockUserPacks.json";
import mockUserSounds from "./__mocks__/user/mockUserSounds.json";
import nodeFetch from 'node-fetch';

require("dotenv").config();

function removeVariableProperties(obj: any) {
  /* eslint-disable */
  delete obj.bookmarkCategories;
  delete obj.bookmarkCategorySounds;
  delete obj.download;
  delete obj.getItem;
  delete obj.getPack;
  delete obj.getSound;
  delete obj.nextOrPrev;
  delete obj.nextPage;
  delete obj.packs;
  delete obj.previousPage;
  delete obj.sounds;
  delete obj.bitrate;
  delete obj.id;
  delete obj.average_rating;
  delete obj.duration;
  delete obj.ac_analysis;
  /* eslint-enable */
  return obj;
}

// Import the actual Response object from node-fetch, rather than a mocked version.
// See https://jestjs.io/docs/bypassing-module-mocks for more information.
const {Response} = jest.requireActual('node-fetch');

// Mock node-fetch so we can call it without actually making a network request.
jest.mock('node-fetch');

const makeNodeFetchReturn = (returnVal: any): void => {
  // @ts-ignore TS2339: Property 'mockReturnValue' does not exist on type 'typeof fetch'.
  nodeFetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(returnVal))));
}

describe("API", function testApi() {
  const freeSound = new FreeSound();
  beforeAll(async () => {
    freeSound.setToken(process.env.CLIENT_SECRET as string);
    freeSound.setClientSecrets(
      process.env.CLIENT_ID as string,
      process.env.CLIENT_SECRET as string
    );
  });

  describe("User", () => {
    it("should get user", async () => {
      makeNodeFetchReturn(mockUser);
      expect(
        removeVariableProperties(await freeSound.getUser("Jovica"))
      ).toEqual(mockUser);
    });

    it("should get a users data", async () => {
      makeNodeFetchReturn(mockUser);
      const user = await freeSound.getUser("Jovica");

      makeNodeFetchReturn(mockUserSounds);
      const sounds =  await user.sounds();

      makeNodeFetchReturn(mockUserPacks);
      const packs = await user.packs();

      makeNodeFetchReturn(mockUserBookCat);
      const bookCat = await user.bookmarkCategories();

      makeNodeFetchReturn(mockUserBookCatSounds);
      const bookCatSounds = await user.bookmarkCategorySounds();

      expect(sounds).toBeTruthy();
      expect(packs).toBeTruthy();
      expect(bookCat).toBeTruthy();
      expect(bookCatSounds).toBeTruthy();
      expect(removeVariableProperties(sounds)).toEqual(mockUserSounds);
      expect(removeVariableProperties(packs)).toEqual(mockUserPacks);
      expect(removeVariableProperties(bookCat)).toEqual(mockUserBookCat);
      expect(removeVariableProperties(bookCatSounds)).toEqual(mockUserBookCatSounds);
    });
  });

  describe("Pack", () => {
    it("should get pack", async () => {
      makeNodeFetchReturn(mockPack);
      const pack = await freeSound.getPack(9678);
      expect(removeVariableProperties(pack)).toEqual(mockPack);
    });

    it("should get pack data", async () => {
      makeNodeFetchReturn(mockPack);
      const pack = await freeSound.getPack(9678);

      makeNodeFetchReturn(mockPackSounds);
      const sounds = await pack.sounds();

      expect(removeVariableProperties(sounds)).toEqual(mockPackSounds);
    });
  });

  describe("Sound", () => {
    it("should get sound", async () => {
      makeNodeFetchReturn(mockSound);
      const sound = await freeSound.getSound(96541);
      expect(removeVariableProperties(sound)).toBeTruthy();
    });

    it("should get sound data", async () => {
      makeNodeFetchReturn(mockSound);
      const sound = await freeSound.getSound(96541);

      makeNodeFetchReturn(mockAnalysis);
      const analysis =  await sound.getAnalysis();

      makeNodeFetchReturn(mockSimilarSounds);
      const similar = await sound.getSimilar();

      makeNodeFetchReturn(mockSoundComments);
      // @ts-ignore TS2722: Cannot invoke an object which is possibly 'undefined'.
      const comments = await sound.getComments();

      expect(analysis).toBeTruthy();
      expect(similar).toBeTruthy();
      expect(comments).toBeTruthy();
      expect(removeVariableProperties(analysis)).toEqual(mockAnalysis);
    });
  });

  describe("Search", () => {
    it("should text search", async () => {
      const query = "violoncello";
      const page = 1;
      const filter = "tag:tenuto duration:[1.0 TO 15.0]";
      const sort = "rating_desc";
      const fields = "id,name,url";
      makeNodeFetchReturn(mockTextSearch);
      const search = await freeSound.textSearch(query, {
        page,
        filter,
        sort,
        fields,
      });
      expect(removeVariableProperties(search)).toEqual(mockTextSearch);
    });

    it("should perform combined search", async () => {
      jest.setTimeout(10 ** 5)
      makeNodeFetchReturn(mockCombinedSearchResult);
      const result = await freeSound.combinedSearch({
        target: "rhythm.bpm:120",
        filter: "tag:loop",
      });
      expect(result).toBeTruthy();
      expect(result).toEqual(mockCombinedSearchResult);
    });

    it("should perform content search", async () => {
      makeNodeFetchReturn(mockContentSearchResult);
      const result = await freeSound.contentSearch({
        target: "lowlevel.pitch.mean:220",
      });
      expect(result).toBeTruthy();
      expect(removeVariableProperties(result)).toEqual(mockContentSearchResult);
    });
  });

  describe.skip("Auth", () => {
    it("should go through oauth process", async () => {
      // OAuth login
      await freeSound.setToken("your-api-key", "oauth");
      // Set your application's client_id and client_secret
      await freeSound.setClientSecrets(
        "your-client-id",
        "your-secret-key"
      );
      // Make the user navigate here
      await freeSound.getLoginURL();
      // Use the authorization code from the login
      await freeSound.postAccessCode("your-temporary-code-from-login");
    });

    it("should get me", async () => {
      expect(await freeSound.me()).toBeTruthy();
    });

    it("should get pending sounds", async () => {
      expect(await freeSound.getPendingSounds()).toBeTruthy();
    });
  });
});
