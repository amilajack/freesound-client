import fetch from 'node-fetch';
import FormData from 'form-data';
import { URLSearchParams as NodeURLSearchParams } from 'url';

interface Comment {
  readonly username: string;
  readonly comment: string;
  readonly created: string;
}

/**
 * @ignore
 */
interface RawComments {
  count: number,
  next: string,
  previous: string,
  results: Comment[]
}

/**
 * @ignore
 */
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
  download: Function
  sounds: Function,
}

/**
 * @ignore
 */
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

/**
 * @ignore
 */
interface RawCollection<T> {
  readonly count: number
  readonly results: T[]
  readonly next: string;
  readonly previous: string;
}

export interface Collection<T> extends RawCollection<T> {
  readonly nextOrPrev: (page: string) => Promise<Collection<T>>
  readonly nextPage: (page: number) => Promise<Collection<T>>
  readonly previousPage: (page: number) => Promise<Collection<T>>
  readonly getItem: (page: number) => T
}

export interface SoundCollection extends Collection<Sound> {
  readonly getSound: (idx: number) => Sound
}

/**
 * @ignore
 */
interface RawSound {
  id: number,
  url: string,
  name: string,
  tags: string[],
  description: string,
  geotag: null,
  created: string,
  license: string,
  type: string,
  channels: number,
  filesize: number,
  bitrate: number,
  bitdepth: number,
  duration: number,
  samplerate: number,
  username: string,
  pack: string,
  pack_name?: string,
  previews: {
    'preview-lq-ogg': string,
    'preview-lq-mp3': string,
    'preview-hq-ogg': string,
    'preview-hq-mp3': string
  },
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
  num_downloads: number,
  avg_rating: number,
  num_ratings: number,
  comments: string,
  num_comments: number,
  similar_sounds: string,
  analysis: string,
  analysis_frames: string,
  analysis_stats: string,
  ac_analysis: {
    ac_tempo_confidence: number,
    ac_note_confidence: number,
    ac_depth: number,
    ac_note_midi: number,
    ac_temporal_centroid: number,
    ac_warmth: number,
    ac_loop: boolean,
    ac_hardness: number,
    ac_loudness: number,
    ac_reverb: boolean,
    ac_roughness: number,
    ac_log_attack_time: number,
    ac_boominess: number,
    ac_note_frequency: number,
    ac_tempo: number,
    ac_brightness: number,
    ac_sharpness: number,
    ac_tonality_confidence: number,
    ac_dynamic_range: number,
    ac_note_name: string,
    ac_tonality: string,
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
  descriptors_filter?: string;
};

type TextSearchOpts = {
  query?: string,
  filter?: string,
  sort?: string,
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
    combinedSearch: '/sounds/search/combined/',
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
      return fetch(uri).then(res => res.arrayBuffer());
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
    const sounds = () => {
      const uri = this.makeUri(this.uris.packSounds, [jsonObject.id]);
      return this.makeRequest<RawCollection<Sound>>(uri).then(e => this.SoundCollection(e));
    };

    const download = (oldTargetWindow: RawPack) => {
      const targetWindow = { ...oldTargetWindow };
      // can be current or new window, or iframe
      this.checkOauth();
      const uri = this.makeUri(this.uris.packDownload, [jsonObject.id]);
      return fetch(uri).then(res => res.arrayBuffer());
    };
    return {
      ...jsonObject,
      sounds,
      download
    }
  }

  setToken(token: string, type?: "oauth"): string {
    this.authHeader = `${type === 'oauth' ? 'Bearer ' : 'Token '}${token}`;
    return this.authHeader;
  }

  setClientSecrets(id: string, secret: string) {
    this.clientId = id;
    this.clientSecret = secret;
  }

  postAccessCode(code: string) {
    const postUrl = `${this.uris.base}/oauth2/access_token/`;
    const data = new FormData();
    data.append('client_id', this.clientId);
    data.append('client_secret', this.clientSecret);
    data.append('code', code);
    data.append('grant_type', 'authorization_code');
    return this.makeRequest(postUrl, 'POST', data);
  }

  textSearch(query: string, opts: TextSearchOpts = {}) {
    const options = { ...opts };
    options.query = query || ' ';
    return this.search<RawCollection<Sound>>(options, this.uris.textSearch).then(e =>
      this.SoundCollection(e)
    );
  }

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

  combinedSearch(options: SearchOpts) {
    if (!(options.target || options.analysis_file || options.query)) {
      throw new Error('Missing query, target or analysis_file');
    }
    return this.search(options, this.uris.contentSearch);
  }

  upload(audiofile: string, filename: string, description: { description: string }) {
    this.checkOauth();
    let formData = new FormData();
    formData.append('audiofile', audiofile, filename);
    if (description) {
      formData = this.makeFormData(description, formData);
    }
    return this.makeRequest(this.makeUri(this.uris.upload), 'POST', formData);
  }

  describe(description: { description: string }) {
    this.checkOauth();
    const formData = this.makeFormData(description);
    return this.makeRequest(this.makeUri(this.uris.upload), 'POST', formData);
  }

  getPendingSounds() {
    this.checkOauth();
    return this.makeRequest(this.makeUri(this.uris.pending));
  }

  // user resources
  me() {
    this.checkOauth();
    return this.makeRequest(this.makeUri(this.uris.me));
  }

  getLoginURL() {
    if (this.clientId === undefined) throw new Error('client_id was not set');
    let loginUrl = this.makeUri(this.uris.authorize);
    loginUrl += `?client_id=${this.clientId}&response_type=code`;
    return loginUrl;
  }

  getLogoutURL() {
    let logoutUrl = this.makeUri(this.uris.logoutAuthorize);
    logoutUrl += `?client_id=${this.clientId}&response_type=code`;

    return logoutUrl;
  }

  getUser(username: string): Promise<User> {
    return this.makeRequest<RawUser>(this.makeUri(this.uris.user, [username])).then(e =>
      this.UserObject(e)
    );
  }

  async getPack(packId: string): Promise<Pack> {
    const pack = await this.makeRequest<RawPack>(this.makeUri(this.uris.pack, [packId]));
    return this.PackObject(pack);
  }

  async getSound(soundId: string): Promise<Sound> {
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

  private async makeRequest<T>(
    uri: string,
    method: 'GET' | 'POST' = 'GET',
    params: FormData | Record<string, string | undefined> = {}
  ): Promise<T> {
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