import FreeSound from "../index";
import mockAnalysis from "./__mocks__/sound-analysis.json";
import mockCombinedSearchResult from "./__mocks__/combined-search.json";
import mockContentSearchResult from "./__mocks__/content-search.json";
import mockPack from "./__mocks__/pack.json";
import mockPackSounds from "./__mocks__/pack-sounds.json";
import mockSimilarSounds from "./__mocks__/sound-similar.json";
import mockSound from "./__mocks__/sound.json";
import mockSoundComments from "./__mocks__/sound-comments.json";
import mockTextSearch from "./__mocks__/text-search.json";
import mockUser from "./__mocks__/user.json";
import mockUserBookCat from "./__mocks__/user-book-cat.json";
import mockUserBookCatSounds from "./__mocks__/user-book-cat-sounds.json";
import mockUserPacks from "./__mocks__/user-packs.json";
import mockUserSounds from "./__mocks__/user-sounds.json";
import nodeFetch from 'node-fetch';

require("dotenv").config();

// Import the actual Response object from node-fetch, rather than a mocked version.
// See https://jestjs.io/docs/bypassing-module-mocks for more information.
const {Response} = jest.requireActual('node-fetch');

// Mock node-fetch so we can call it without actually making a network request.
jest.mock('node-fetch');

// Add type information to mocked nodeFetch function.
// See https://jestjs.io/docs/mock-function-api#typescript for more information.
const mockNodeFetch = nodeFetch as jest.MockedFunction<typeof nodeFetch>;

const mockResponse = (response: object): void => {
  mockNodeFetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(response))));
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
      mockResponse(mockUser);
      expect(await freeSound.getUser("Jovica")).toEqual(expect.objectContaining(mockUser));
    });

    it("should get a users data", async () => {
      mockResponse(mockUser);
      const user = await freeSound.getUser("Jovica");

      mockResponse(mockUserSounds);
      const sounds =  await user.sounds();

      mockResponse(mockUserPacks);
      const packs = await user.packs();

      mockResponse(mockUserBookCat);
      const bookCat = await user.bookmarkCategories();

      mockResponse(mockUserBookCatSounds);
      const bookCatSounds = await user.bookmarkCategorySounds();

      expect(sounds).toBeTruthy();
      expect(packs).toBeTruthy();
      expect(bookCat).toBeTruthy();
      expect(bookCatSounds).toBeTruthy();
      expect(sounds).toEqual(expect.objectContaining(mockUserSounds));
      expect(packs).toEqual(expect.objectContaining(mockUserPacks));
      expect(bookCat).toEqual(mockUserBookCat);
      expect(bookCatSounds).toEqual(mockUserBookCatSounds);
    });
  });

  describe("Pack", () => {
    it("should get pack", async () => {
      mockResponse(mockPack);
      const pack = await freeSound.getPack(9678);
      expect(pack).toEqual(expect.objectContaining(mockPack));
    });

    it("should get pack data", async () => {
      mockResponse(mockPack);
      const pack = await freeSound.getPack(9678);

      mockResponse(mockPackSounds);
      const sounds = await pack.sounds();

      expect(sounds).toEqual(expect.objectContaining(mockPackSounds));
    });
  });

  describe("Sound", () => {
    it("should get sound", async () => {
      mockResponse(mockSound);
      const sound = await freeSound.getSound(96541);
      expect(sound).toBeTruthy();
    });

    it("should get sound data", async () => {
      mockResponse(mockSound);
      const sound = await freeSound.getSound(96541);

      mockResponse(mockAnalysis);
      const analysis =  await sound.getAnalysis();

      mockResponse(mockSimilarSounds);
      const similar = await sound.getSimilar();

      mockResponse(mockSoundComments);
      // @ts-ignore TS2722: Cannot invoke an object which is possibly 'undefined'.
      const comments = await sound.getComments();

      expect(analysis).toBeTruthy();
      expect(similar).toBeTruthy();
      expect(comments).toBeTruthy();
      expect(analysis).toEqual(mockAnalysis);
    });
  });

  describe("Search", () => {
    it("should text search", async () => {
      const query = "violoncello";
      const page = 1;
      const filter = "tag:tenuto duration:[1.0 TO 15.0]";
      const sort = "rating_desc";
      const fields = "id,name,url";
      mockResponse(mockTextSearch);
      const search = await freeSound.textSearch(query, {
        page,
        filter,
        sort,
        fields,
      });
      expect(search).toEqual(expect.objectContaining(mockTextSearch));
    });

    it("should perform combined search", async () => {
      jest.setTimeout(10 ** 5)
      mockResponse(mockCombinedSearchResult);
      const result = await freeSound.combinedSearch({
        target: "rhythm.bpm:120",
        filter: "tag:loop",
      });
      expect(result).toBeTruthy();
      expect(result).toEqual(mockCombinedSearchResult);
    });

    it("should perform content search", async () => {
      mockResponse(mockContentSearchResult);
      const result = await freeSound.contentSearch({
        target: "lowlevel.pitch.mean:220",
      });
      expect(result).toBeTruthy();
      expect(result).toEqual(expect.objectContaining(mockContentSearchResult));
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
