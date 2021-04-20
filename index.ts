/**
 * There are three kinds of tokens:
 * 1. Auth tokens
 * 2. Access tokens
 * 3. Refresh tokens
 *
 * Auth tokens expire after 10 minutes. They can be used to get access tokens
 * Access tokens expire after 24hrs
 * Access token relates your application with the user that has logged in.
 */
import nodeFetch from 'node-fetch';
import FormData from 'form-data';
import { URLSearchParams as NodeURLSearchParams } from 'url';

// A hack that prevents the 'TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation' issue
const fetch = nodeFetch;

export interface Comment {
  username: string;
  comment: string;
  created: string;
}

interface RawComments {
  count: number,
  next: string,
  previous: string,
  results: Comment[]
}

interface RawPack {
  id: number,
  url: string,
  description: string,
  created: string,
  name: string,
  username: string,
  num_sounds: number,
  num_downloads: number,
}

export interface Pack extends RawPack {
  download: Function;
  sounds: Function;
};

interface RawUser {
  url: string,
  username: string,
  about: string,
  home_page: string,
  avatar: {
    small: string,
    large: string,
    medium: string
  },
  date_joined: string,
  num_sounds: number,
  num_packs: number,
  num_posts: number,
  num_comments: number,
  bookmark_categories: string,
}

export interface User extends RawUser {
  sounds: Function,
  packs: Function,
  bookmarkCategories: Function,
  bookmarkCategorySounds: Function
}

export interface AccessTokenResponse {
  /**
   * The value of the access token
   */
  access_token: string,
  scope: string,
  /**
   * The time in seconds until the access token exprires
   */
  "expires_in": number,
  /**
   * Refresh token is used to update the expirey time of the access token
   */
  "refresh_token": string
}

interface RawCollection<T> {
  count: number;
  results: T[];
  next: string;
  previous: string;
}

export interface Collection<T> extends RawCollection<T> {
  nextOrPrev: (page: string) => Promise<Collection<T>>;
  nextPage: (page: number) => Promise<Collection<T>>;
  previousPage: (page: number) => Promise<Collection<T>>;
  getItem: (page: number) => T;
}

export interface SoundCollection extends Collection<Sound> {
  getSound: (idx: number) => Sound
}

interface RawSound {
  /**
   * Sound ID on Freesound.
   */
  id: number,
  /**
   * The URl for this sound on the Freesound website.
   */
  url: string,
  /**
   * The name user gave to the sound.
   */
  name: string,
  /**
   * An array of tags the user gave to the sound.
   */
  tags: string[],
  /**
   * The description the user gave to the sound.
   */
  description: string,
  /*
  *Latitude and longitude of the geotag separated by spaces (e.g. “41.0082325664 28.9731252193”,
  *only for sounds that have been geotagged).
  */
  geotag: null,
  /**
   * The date when the sound was uploaded (e.g. “2014-04-16T20:07:11.145”).
   */
  created: string,
  /**
   * The license under which the sound is available to you.
   */
  license: string,
  /**
   * The type of sound (wav, aif, aiff, mp3, m4a or flac).
   */
  type: string,
  /**
   * The number of channels.
   */
  channels: number,
  /**
   * The size of the file in bytes.
   */
  filesize: number,
  /**
   * The bit rate of the sound in kbps.
   */
  bitrate: number,
  /**
   * The bit depth of the sound.
   */
  bitdepth: number,
  /**
   * The duration of the sound in seconds.
   */
  duration: number,
  /**
   * The samplerate of the sound.
   */
  samplerate: number,
  /**
   * The username of the uploader of the sound.
   */
  username: string,
  /**
   * If the sound is part of a pack, this URl points to that pack’s API resource.
   */
  pack: string,
  pack_name?: string,
  /*
  *Dictionary containing the URIs for mp3 and ogg versions of the sound.
  *The dictionary includes the fields preview-hq-mp3 and preview-lq-mp3 (for ~128kbps quality and ~64kbps quality mp3 respectively),
  *and preview-hq-ogg and preview-lq-ogg (for ~192kbps quality and ~80kbps quality ogg respectively).
  *API authentication is required for retrieving sound previews (Token or OAuth2).
  */
  previews: {
    'preview-lq-ogg': string,
    'preview-lq-mp3': string,
    'preview-hq-ogg': string,
    'preview-hq-mp3': string
  },
  /*
  *Dictionary including the URls for spectrogram and waveform visualizations of the sound.
  *The dictionary includes the fields waveform_l and waveform_m (for large and medium waveform images respectively),
  *and spectral_l and spectral_m (for large and medium spectrogram images respectively).
  */
  images: {
    spectral_m: string,
    spectral_l: string,
    spectral_bw_l: string,
    waveform_bw_m: string,
    waveform_bw_l: string,
    waveform_l: string,
    waveform_m: string,
    spectral_bw_m: string
  },
  /**
   * The number of times the sound was downloaded.
   */
  num_downloads: number,
  /**
   * The average rating of the sound.
   */
  avg_rating: number,
  /**
   * The number of times the sound was rated.
   */
  num_ratings: number,
  /**
   * The URl of a paginated list of the comments of the sound.
   */
  comments: string,
  //The number of comments.
  num_comments: number,
  /**
   * URI pointing to the similarity resource (to get a list of similar sounds).
   */
  similar_sounds: string,
  /*
  *Dictionary containing requested descriptors information according to the descriptors request parameter (see below).
  *This field will be null if no descriptors were specified (or invalid descriptor names specified) or if the analysis data
  *for the sound is not available.
  */
  analysis: string,
  /*
   *The URl for retrieving a JSON file with analysis information for each frame of the sound
   *(see Analysis Descriptor Documentation).
  */
  analysis_frames: string,
  /**
   * URL pointing to the complete analysis results of the sound (see Analysis Descriptor Documentation).
   */
  analysis_stats: string,
  /**
   * Dictionary containing the results of the AudioCommons analysis for the given sound.
   */
  ac_analysis: {
    /**
     * Reliability of the tempo estimation in a range of [0, 1].
     */
    ac_tempo_confidence: number,
    /**
     * Reliability of the note name/midi/frequency estimation in a range of [0, 1].
     */
    ac_note_confidence: number,
    /**
     * Depth of the analyzed audio in a scale from [0-100]. A deep sound is one that conveys the sense of having been made far down below the surface of its source.
     */
    ac_depth: number,
    /**
     * MIDI value corresponding to the estimated note (makes more sense for ac_single_event sounds).
     */
    ac_note_midi: number,
    /**
     * Temporal centroid (sec.) of the audio signal. It is the point in time in a signal that is a temporal balancing point of the sound event energy.
     */
    ac_temporal_centroid: number,
    /**
     * Warmth of the analyzed sound in a scale from [0-100]. A warm sound is one that promotes a sensation analogous to that caused by a physical increase in temperature.
     */
    ac_warmth: number,
    /**
     * Whether audio file is loopable.
     */
    ac_loop: boolean,
    /*
    Hardness of the analyzed audio in a scale from [0-100]. A hard sound is one that conveys the sense of having been made (i) by something solid, firm or rigid;
    or (ii) with a great deal of force.
    */
    ac_hardness: number,
    /**
     * The integrated (overall) loudness (LUFS) measured using the EBU R128 standard.
     */
    ac_loudness: number,
    /**
     * Whether the signal is reverberated or not.
     */
    ac_reverb: boolean,
    /**
     * Roughness of the analyzed audio in a scale from [0-100]. A rough sound is one that has an uneven or irregular sonic texture.
     */
    ac_roughness: number,
    /*
    The log (base 10) of the attack time of a signal envelope.
    The attack time is defined as the time duration from when the sound becomes perceptually audible to when it reaches its maximum intensity.
    */
    ac_log_attack_time: number,
    /**
     * Boominess of the analyzed sound in a scale from [0-100]. A boomy sound is one that conveys a sense of loudness, depth and resonance.
     */
    ac_boominess: number,
    /**
     * Frequency corresponding to the estimated note (makes more sense for ac_single_event sounds).
     */
    ac_note_frequency: number,
    /**
     * BPM value estimated by beat tracking algorithm.
     */
    ac_tempo: number,
    /**
     * Brightness of the analyzed audio in a scale from [0-100]. A bright sound is one that is clear/vibrant and/or contains significant high-pitched elements.
     */
    ac_brightness: number,
    /**
     * Sharpness of the analyzed sound in a scale from [0-100]. A sharp sound is one that suggests it might cut if it were to take on physical form.
     */
    ac_sharpness: number,
    /**
     * Reliability of the key estimation in a range of [0, 1].
     */
    ac_tonality_confidence: number,
    /**
     * Loudness range (dB, LU) measured using the EBU R128 standard.
     */
    ac_dynamic_range: number,
    /*
    *Pitch note name based on median of estimated fundamental frequency (makes more sense for ac_single_event sounds).
    *Note name must be one of [“A”, “A#”, “B”, “C”, “C#”, “D”, “D#”, “E”, “F”, “F#”, “G”, “G#”] and the octave number. E.g. “A4”, “E#7”.
    */
    ac_note_name: string,
    /*
    *Key value estimated by key detection algorithm.
    *Key is in format root_note scale where root_note is one of [“A”, “A#”, “B”, “C”, “C#”, “D”, “D#”, “E”, “F”, “F#”, “G”, “G#”],
    *and scale is one of [“major”, “minor”]. E.g. “C minor”, “F# major”.
    */
    ac_tonality: string;
    /**
     * Whether the audio file contains one single audio event or more than one. This computation is based on the loudness of the signal and does not do any frequency analysis.
     */
    ac_single_event: boolean
  },
};

export interface Sound extends RawSound {
  getAnalysis: Function,
  getSimilar: Function,
  getComments?: Function,
  rate: Function,
  comment?: Function,
  download: Function,
  bookmark: Function,
  edit?: Function
}

type SearchOpts = {
  analysis_file?: string;
  target?: string;
  query?: string;
  filter?: string;
  descriptors_filter?: string;
};

type TextSearchOpts = {
  page?: number,
  query?: string,
  filter?: string,
  sort?: string,
  fields?: string,
  group_by_pack?: 1 | 0
}

export default class FreeSound {
  private authHeader = '';

  private clientId = '';

  private clientSecret = '';

  private host = 'freesound.org';

  private uris = {
    base: `https://${this.host}/apiv2`,
    textSearch: '/search/text/',
    contentSearch: '/search/content/',
    combinedSearch: '/search/combined/',
    sound: '/sounds/<sound_id>/',
    soundAnalysis: '/sounds/<sound_id>/analysis/',
    similarSounds: '/sounds/<sound_id>/similar/',
    comments: '/sounds/<sound_id>/comments/',
    download: '/sounds/<sound_id>/download/',
    upload: '/sounds/upload/',
    describe: '/sounds/<sound_id>/describe/',
    pending: '/sounds/pending_uploads/',
    bookmark: '/sounds/<sound_id>/bookmark/',
    rate: '/sounds/<sound_id>/rate/',
    comment: '/sounds/<sound_id>/comment/',
    authorize: '/oauth2/authorize/',
    logout: '/api-auth/logout/',
    logoutAuthorize: '/oauth2/logout_and_authorize/',
    me: '/me/',
    user: '/users/<username>/',
    userSounds: '/users/<username>/sounds/',
    userPacks: '/users/<username>/packs/',
    userBookmarkCategories: '/users/<username>/bookmark_categories/',
    userBookmarkCategorySounds:
      '/users/<username>/bookmark_categories/<category_id>/sounds/',
    pack: '/packs/<pack_id>/',
    packSounds: '/packs/<pack_id>/sounds/',
    packDownload: '/packs/<pack_id>/download/',
    // @TODO
    // edit: ''
  };

  private checkOauth() {
    // @TODO: Support node
    if (typeof window !== 'object') {
      throw new Error('OAuth is not supported in Node');
    }
    if (!this.authHeader.includes('Bearer')) {
      throw new Error('Oauth authentication required');
    }
  }

  private makeFormData(obj: Record<string, string | undefined>, prevFormData?: FormData) {
    const formData = prevFormData ? prevFormData : new FormData();
    for (const prop in obj) {
      formData.append(prop, obj[prop]);
    }
    return formData;
  }

  search<T>(options: SearchOpts, uri: string): Promise<T> {
    if (options.analysis_file) {
      return this.makeRequest(
        this.makeUri(uri),
        'POST',
        this.makeFormData(options)
      );
    }
    return this.makeRequest<T>(this.makeUri(uri), 'GET', options);
  }

  private Collection<T>(oldJsonObject: RawCollection<T>): Collection<T> {
    const nextOrPrev = (which: string) => this.makeRequest<RawCollection<T>>(which).then(this.Collection);
    const nextPage = () => nextOrPrev(oldJsonObject.next);
    const previousPage = () => nextOrPrev(oldJsonObject.previous);
    const getItem = (idx: number) => oldJsonObject.results[idx];

    return {
      ...oldJsonObject,
      getItem,
      nextOrPrev,
      previousPage,
      nextPage
    }
  }

  private SoundCollection(jsonObject: RawCollection<Sound>): SoundCollection {
    const collection = this.Collection<Sound>(jsonObject)
    return {
      ...collection,
      getSound: idx => this.SoundObject(collection.results[idx])
    }
  }

  private PackCollection(jsonObject: RawCollection<Pack>) {
    const collection = this.Collection<Pack>(jsonObject);
    return {
      ...collection,
      getPack: (idx: number) => this.PackObject(collection.results[idx])
    }
  }

  private SoundObject(oldJsonObject: RawSound): Sound {
    const jsonObject = { ...oldJsonObject };

    const getAnalysis = (filter: string) =>
      this.makeRequest(
        this.makeUri(this.uris.soundAnalysis, [jsonObject.id, filter || ''])
      );

    const getSimilar = (params = {}) =>
      this.makeRequest<RawCollection<Sound>>(
        this.makeUri(this.uris.similarSounds, [jsonObject.id]),
        'GET',
        params
      ).then(e => this.SoundCollection(e));

    // @TODO
    const getComments = () =>
      this.makeRequest<RawCollection<RawComments>>(
        this.makeUri(this.uris.comments, [jsonObject.id]),
        'GET',
      );

    const download = () => {
      // can be window, new, or iframe
      this.checkOauth();
      const uri = this.makeUri(this.uris.download, [jsonObject.id]);
      return this.fetchWithAuthParams(uri)
    };

    // @TODO
    // const comment = () => {
    //   this.checkOauth();
    //   const data = new FormData();
    //   data.append('comment', this.comment);
    //   const uri = this.makeUri(this.uris.comment, [jsonObject.id]);
    //   return this.makeRequest(uri, 'POST', data);
    // };

    const rate = (rating: number) => {
      this.checkOauth();
      const data = new FormData();
      data.append('rating', rating);
      const uri = this.makeUri(this.uris.rate, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    const bookmark = (name: string, category: string) => {
      this.checkOauth();
      const data = new FormData();
      data.append('name', name);
      if (category) {
        data.append('category', category);
      }
      const uri = this.makeUri(this.uris.bookmark, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    // @TODO
    // const edit = (description: { description: string }) => {
    //   this.checkOauth();
    //   const data = this.makeFormData(description);
    //   const uri = this.makeUri(this.uris.edit, [jsonObject.id]);
    //   return this.makeRequest(uri, 'POST', data);
    // };

    return {
      ...jsonObject,
      getAnalysis,
      getSimilar,
      download,
      rate,
      getComments,
      bookmark,
    };
  }

  private UserObject(oldJsonObject: RawUser): User {
    const jsonObject = { ...oldJsonObject };

    const sounds = (params = {}) => {
      const uri = this.makeUri(this.uris.userSounds, [jsonObject.username]);
      return this.makeRequest<RawCollection<Sound>>(uri, 'GET', params).then(e =>
        this.SoundCollection(e)
      );
    };

    const packs = () => {
      const uri = this.makeUri(this.uris.userPacks, [jsonObject.username]);
      return this.makeRequest<RawCollection<Pack>>(uri).then(e => this.PackCollection(e));
    };

    const bookmarkCategories = () => {
      const uri = this.makeUri(this.uris.userBookmarkCategories, [
        jsonObject.username
      ]);
      return this.makeRequest(uri);
    };

    const bookmarkCategorySounds = (params = {}) => {
      const uri = this.makeUri(this.uris.userBookmarkCategorySounds, [
        jsonObject.username
      ]);
      return this.makeRequest(uri, 'GET', params);
    };

    return {
      ...jsonObject,
      sounds,
      packs,
      bookmarkCategories,
      bookmarkCategorySounds
    };
  }

  private PackObject(oldJsonObject: RawPack): Pack {
    const jsonObject = { ...oldJsonObject };
    const sounds = (options = {}) => {
      const uri = this.makeUri(this.uris.packSounds, [jsonObject.id]);
      return this.makeRequest<RawCollection<Sound>>(uri, 'GET', options).then(e => this.SoundCollection(e));
    };

    const download = () => {
      // can be current or new window, or iframe
      this.checkOauth();
      const uri = this.makeUri(this.uris.packDownload, [jsonObject.id]);
      return this.fetchWithAuthParams(uri);
    };
    return {
      ...jsonObject,
      sounds,
      download
    }
  }

  /**
   *
   * There are two ways of authenticating: OAuth and token method.
   * The OAuth method is required for more privilidged actions such as
   * downloading sounds.
   *
   * This method can set both kinds of tokens
   *
   * ```typescript
   * await freeSound.setToken('your-api-key', 'oauth');
   * ```
   */
  setToken(token: string, type?: "oauth"): string {
    this.authHeader = `${type === 'oauth' ? 'Bearer' : 'Token'} ${token}`;
    return this.authHeader;
  }

  /**
   * @param id your client ID, obtainable at https://freesound.org/apiv2/apply
   * @param secret your client secret, obtainable at https://freesound.org/apiv2/apply
   *
   * ```typescript
   * await freeSound.setClientSecrets(
   *   "your-client-id",
   *   "your-secret-key"
   * );
   * ```
   */
  setClientSecrets(id: string, secret: string) {
    this.clientId = id;
    this.clientSecret = secret;
  }

  /**
   * This method allows you to get a new token using a refresh token or an auth
   * token
   *
   * ```typescript
   * await freeSound.postAccessCode('your-temporary-code-from-login');
   * ```
   */
  postAccessCode(token: string, type: 'refresh' | 'auth' = 'auth'): Promise<AccessTokenResponse> {
    const postUrl = `${this.uris.base}/oauth2/access_token/`;
    const data = new FormData();
    data.append('client_id', this.clientId);
    data.append('client_secret', this.clientSecret);
    const tokenType = type === 'auth'
      ? 'code'
      : 'refresh_token'
    data.append(tokenType, token);
    const grantType = type === 'auth'
      ? 'authorization_code'
      : 'refresh_token';
    data.append('grant_type', grantType);
    return this.makeRequest<AccessTokenResponse>(postUrl, 'POST', data);
  }

  /**
   * Search sounds in Freesound by matching their tags and other kinds of metadata. See
   * https://freesound.org/docs/api/resources_apiv2.html#sound-text-search for more
   * information.
   *
   * ```typescript
   * await freeSound.textSearch('violoncello', {
   *   page: 1,
   *   filter: 'tag:tenuto duration:[1.0 TO 15.0]',
   *   sort: 'rating_desc',
   *   fields: 'id,name,url'
   * });
   * ```
   */
  textSearch(query: string, opts: TextSearchOpts = {}) {
    const options = { ...opts };
    options.query = query || ' ';
    return this.search<RawCollection<Sound>>(options, this.uris.textSearch).then(e =>
      this.SoundCollection(e)
    );
  }

  /**
   * Search sounds in Freesound based on their content descriptors. See
   * https://freesound.org/docs/api/resources_apiv2.html#content-search
   * for more information.
   *
   * ```typescript
   * const result = await freeSound.contentSearch({
   *   target: 'lowlevel.pitch.mean:220',
   * });
   * ```
   */
  contentSearch(options: SearchOpts): Promise<SoundCollection> {
    if (
      !(options.target || options.analysis_file || options.descriptors_filter)
    ) {
      throw new Error('Missing target or analysis_file');
    }
    return this.search<RawCollection<Sound>>(options, this.uris.contentSearch).then(e =>
      this.SoundCollection(e)
    );
  }

  /**
   * Search sounds in Freesound based on their tags, metadata and content-based descriptiors via
   * a combination of text search and content search. See
   * https://freesound.org/docs/api/resources_apiv2.html#combined-search for more information.
   *
   * ```typescript
   * const soundCollectionResults = await freeSound.combinedSearch(
   *   filter: 'tag:scale',
   *   target: 'rhythm.bpm:120',
   * );
   * ```
   */
  combinedSearch(options: SearchOpts) {
    if (!(options.target || options.query || options.descriptors_filter || options.target || options.filter)) {
      throw new Error('Missing target, query, descriptors_filter, target, filter, or analysis_file');
    }
    return this.search(options, this.uris.combinedSearch);
  }

  /**
   * Upload an audio file into Freesound and optionally describe it.
   * If there is no file description, only the audio file will upload, and
   * the user will need to add a description later using
   * the describe(description: { description: string }) method. If the file description
   * is present, the uploaded file will be ready for the processing and moderation stage.
   * A list of uploaded files pending a description, processing or moderation is
   * obtainable through the getPendingSounds() method. See
   * https://freesound.org/docs/api/resources_apiv2.html#upload-sound-oauth2-required
   * for more information. This method requires OAuth2 authentication.
   *
   * @param audiofile the audio file to upload
   * @param filename the name of the audio file to upload
   * @param description the description of the audio file to upload
   */
  upload(audiofile: string, filename: string, description: { description: string }) {
    this.checkOauth();
    let formData = new FormData();
    formData.append('audiofile', audiofile, filename);
    if (description) {
      formData = this.makeFormData(description, formData);
    }
    return this.makeRequest(this.makeUri(this.uris.upload), 'POST', formData);
  }

  /**
   * Describe a previously uploaded file that does not have a description.
   * Note: after a sound receives a description, the team of Freesound moderators
   * still needs to process and moderate it, so it may not yet appear in Freesound.
   * A list of sounds uploaded and described by the user, but still
   * pending processing and moderation, is viewable with
   * the getPendingSounds() method. This method requires OAuth2 authentication. See
   * https://freesound.org/docs/api/resources_apiv2.html#describe-sound-oauth2-required
   * for more information.
   *
   * @param description a description for an uploaded sound
   */
  describe(description: { description: string }) {
    this.checkOauth();
    const formData = this.makeFormData(description);
    return this.makeRequest(this.makeUri(this.uris.upload), 'POST', formData);
  }

  /**
   * Retrieve a list of audio files uploaded by
   * the Freesound user logged in using OAuth2 that
   * do not have a description, or have not been
   * processed or moderated. In Freesound, sounds
   * need descriptions after their upload. Then,
   * sounds are automatically processed, and,
   * finally, a team of human moderators either
   * accepts or rejects the upload. This method keeps
   * track of the status of these uploads and
   * requires OAuth2 authentication. See
   * https://freesound.org/docs/api/resources_apiv2.html#pending-uploads-oauth2-required
   * for more information.
   *
   * ```typescript
   * const result = await freeSound.getPendingSounds()
   * ```
   */
  getPendingSounds() {
    this.checkOauth();
    return this.makeRequest(this.makeUri(this.uris.pending));
  }

  /**
   * Return basic information about the user that is logged in via OAuth2.
   * This application can use it to identify which Freesound user has logged in.
   *
   * ```typescript
   * const result = await freeSound.me();
   * ```
   */
  me() {
    this.checkOauth();
    return this.makeRequest(this.makeUri(this.uris.me));
  }

  /**
   * Navigate to Freesound for user login.
   *
   * @returns a url where the user can login
   *
   * ```typescript
   * const navigateToLogin = () => {
   *   window.location.replace(freeSound.getLoginURL());
   * };
   * ```
   */
  getLoginURL(): string {
    if (!this.clientId) throw new Error('client_id was not set');
    let loginUrl = this.makeUri(this.uris.authorize);
    loginUrl += `?client_id=${this.clientId}&response_type=code`;
    return loginUrl;
  }

  getLogoutURL() {
    let logoutUrl = this.makeUri(this.uris.logoutAuthorize);
    logoutUrl += `?client_id=${this.clientId}&response_type=code`;

    return logoutUrl;
  }

  /**
   * Retrieve information about a particular Freesound user. See
   * https://freesound.org/docs/api/resources_apiv2.html#user-instance
   * for more information.
   *
   * @param username the username of the Freesound user
   * @returns information about a particular Freesound user
   *
   * ```typescript
   * // Get information about the user https://freesound.org/people/MTG/.
   * const user = await freeSound.getUser('MTG');
   * ```
   */
  getUser(username: string): Promise<User> {
    return this.makeRequest<RawUser>(this.makeUri(this.uris.user, [username])).then(e =>
      this.UserObject(e)
    );
  }

  /**
   * Retrieve the list of sounds included in a pack. See
   * https://freesound.org/docs/api/resources_apiv2.html#pack-sounds for more information.
   *
   * @param packId the identification number of the pack to fetch
   * @returns a list of sounds included in the pack that has packId as its identification number
   *
   * ```typescript
   * // Fetch the pack
   * // https://freesound.org/people/vroomvro0om/packs/21143/.
   * const packObj = await freeSound.getPack(21143);
   * ```
   */
  async getPack(packId: string | number, options = {}): Promise<Pack> {
    const pack = await this.makeRequest<RawPack>(this.makeUri(this.uris.pack, [packId]), 'GET', options);
    return this.PackObject(pack);
  }

  /**
   * Retrieve detailed information about a sound. See
   * https://freesound.org/docs/api/resources_apiv2.html#sound-resources
   * for more information.
   *
   * @param soundId the identification number of the sound
   * @returns detailed information about a sound
   *
   * ```typescript
   * // Fetch the sound
   * // https://freesound.org/people/vroomvro0om/sounds/376626/.
   * const fetchedSound = await freeSound.getSound(376626);
   * ```
   */
  async getSound(soundId: string | number): Promise<Sound> {
    const sound = await this.makeRequest<Sound>(this.makeUri(this.uris.sound, [soundId]));
    return this.SoundObject(sound);
  }

  private makeUri(uri: string, args?: Array<string | number>) {
    let newUri = String(uri);
    if (args) {
      args.forEach(element => {
        newUri = newUri.replace(/<[\w_]+>/, String(element));
      });
    }
    return this.uris.base + newUri;
  }

  private async fetchWithAuthParams<T>(
    uri: string,
    method: 'GET' | 'POST' = 'GET',
    params: FormData | Record<string, string | undefined> = {}
  ) {
    const IsoURLSearchParams = typeof window === 'object'
      ? URLSearchParams
      : NodeURLSearchParams

    return fetch(
      params ? `${uri}?${new IsoURLSearchParams(params as Record<string, string>).toString()}` : uri,
      {
        method,
        headers: {
          Authorization: this.authHeader
        }
      }
    )
  }

  private async makeRequest<T>(
    uri: string,
    method: 'GET' | 'POST' = 'GET',
    params: FormData | Record<string, string | undefined> = {}
  ): Promise<T> {
    return this.fetchWithAuthParams(uri, method, params)
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          throw new Error(res.error);
        }
        if (res.detail === 'Authentication credentials were not provided') {
          throw new Error(res.detail);
        }
        return res;
      });
  }
}
