import fetch from 'node-fetch';
import FormData from 'form-data';
import { URLSearchParams as NodeURLSearchParams } from 'url';

type Results = Record<string, string>[];

interface Collection {
  readonly results: Results
  readonly nextOrPrev: (page: string) => Promise<Collection>
  readonly nextPage: (page: number) => Promise<Collection>
  readonly previousPage: (page: number) => Promise<Collection>
  readonly getItem: (page: number) => Promise<Collection>
}

interface SoundCollection extends Collection {
  getSound: (idx: number) => Sound
}

type Sound = {
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
  download: Function,
  bookmark: Function,
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
  rate: Function,
  comments: string,
  num_comments: number,
  comment: Function,
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
    ac_tempo: 157,
    ac_brightness: number,
    ac_sharpness: number,
    ac_tonality_confidence: number,
    ac_dynamic_range: 0,
    ac_note_name: 'E3',
    ac_tonality: 'B major',
    ac_single_event: boolean
  },
  getAnalysis: Function,
  getSimilar: Function,
  getComments: Function,
  edit: Function
};

type SearchOpts = {
  analysis_file?: string;
  target?: string;
  query?: string;
  descriptors_filter?: string;
};

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
    packDownload: '/packs/<pack_id>/download/'
  };

  private checkOauth() {
    if (!this.authHeader.includes('Bearer')) {
      throw new Error('Oauth authentication required');
    }
  }

  private makeFormData(obj: Record<string, string>, prevFormData?: FormData) {
    const formData = prevFormData ? prevFormData : new FormData();
    for (const prop in obj) {
      formData.append(prop, obj[prop]);
    }
    return formData;
  }

  search<T>(options: SearchOpts, uri: string) {
    if (options.analysis_file) {
      return this.makeRequest(
        this.makeUri(uri),
        'POST',
        this.makeFormData(options)
      );
    }
    return this.makeRequest<T>(this.makeUri(uri), 'GET', options);
  }

  private Collection(oldJsonObject: Results): Collection {
    const nextOrPrev = (which: string) => this.makeRequest(which).then(this.Collection);
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

  private SoundCollection(jsonObject: Results): SoundCollection {
    const collection = this.Collection(jsonObject)
    return {
      ...collection,
      getSound: idx => this.SoundObject(collection.results[idx])
    }
  }

  private PackCollection(jsonObject: Results) {
    const collection = this.Collection(jsonObject);
    return {
      ...collection,
      getPack: (idx: number) => this.PackObject(collection.results[idx])
    }
  }

  private SoundObject(oldJsonObject: Object): Sound {
    const jsonObject = { ...oldJsonObject };
    jsonObject.getAnalysis = filter =>
      this.makeRequest(
        this.makeUri(this.uris.soundAnalysis, [jsonObject.id, filter || ''])
      );

    jsonObject.getSimilar = params =>
      this.makeRequest(
        this.makeUri(this.uris.similarSounds, [jsonObject.id]),
        'GET',
        params
      ).then(e => this.SoundCollection(e));

    jsonObject.getComments = () =>
      this.makeRequest(
        this.makeUri(this.uris.comments, [jsonObject.id]),
        'GET',
        this.Collection
      );

    jsonObject.download = oldTargetWindow => {
      const targetWindow = { ...oldTargetWindow };
      // can be window, new, or iframe
      this.checkOauth();
      const uri = this.makeUri(this.uris.download, [jsonObject.id]);
      targetWindow.location = uri;
    };

    jsonObject.comment = () => {
      this.checkOauth();
      const data = new FormData();
      data.append('comment', this.comment);
      const uri = this.makeUri(this.uris.comment, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    jsonObject.rate = rating => {
      this.checkOauth();
      const data = new FormData();
      data.append('rating', rating);
      const uri = this.makeUri(this.uris.rate, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    jsonObject.bookmark = (name, category) => {
      this.checkOauth();
      const data = new FormData();
      data.append('name', name);
      if (category) {
        data.append('category', category);
      }
      const uri = this.makeUri(this.uris.bookmark, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    jsonObject.edit = description => {
      this.checkOauth();
      const data = this.makeFormData(description);
      const uri = this.makeUri(this.uris.edit, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    return jsonObject;
  }

  private UserObject(oldJsonObject: Object) {
    const jsonObject = { ...oldJsonObject };
    jsonObject.sounds = params => {
      const uri = this.makeUri(this.uris.userSounds, [jsonObject.username]);
      return this.makeRequest(uri, 'GET', params).then(e =>
        this.SoundCollection(e)
      );
    };

    jsonObject.packs = () => {
      const uri = this.makeUri(this.uris.userPacks, [jsonObject.username]);
      return this.makeRequest(uri).then(e => this.PackCollection(e));
    };

    jsonObject.bookmarkCategories = () => {
      const uri = this.makeUri(this.uris.userBookmarkCategories, [
        jsonObject.username
      ]);
      return this.makeRequest(uri);
    };

    jsonObject.bookmarkCategorySounds = params => {
      const uri = this.makeUri(this.uris.userBookmarkCategorySounds, [
        jsonObject.username
      ]);
      return this.makeRequest(uri, 'GET', params);
    };

    return jsonObject;
  }

  private PackObject(oldJsonObject: Object) {
    const jsonObject = { ...oldJsonObject };
    jsonObject.sounds = () => {
      const uri = this.makeUri(this.uris.packSounds, [jsonObject.id]);
      return this.makeRequest(uri).then(e => this.SoundCollection(e));
    };

    jsonObject.download = oldTargetWindow => {
      const targetWindow = { ...oldTargetWindow };
      // can be current or new window, or iframe
      this.checkOauth();
      const uri = this.makeUri(this.uris.packDownload, [jsonObject.id]);
      targetWindow.location = uri;
    };
    return jsonObject;
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

  textSearch(query: string, opts: SearchOpts = {}) {
    const options = { ...opts };
    options.query = query || ' ';
    return this.search(options, this.uris.textSearch).then(e =>
      this.SoundCollection(e)
    );
  }

  contentSearch(options: SearchOpts): Promise<SoundCollection> {
    if (
      !(options.target || options.analysis_file || options.descriptors_filter)
    ) {
      throw new Error('Missing target or analysis_file');
    }
    return this.search(options, this.uris.contentSearch).then(e =>
      this.SoundCollection(e)
    );
  }

  combinedSearch(options: SearchOpts) {
    if (!(options.target || options.analysis_file || options.query)) {
      throw new Error('Missing query, target or analysis_file');
    }
    return this.search(options, this.uris.contentSearch);
  }

  upload(audiofile: string, filename: string, description: string) {
    this.checkOauth();
    let formData = new FormData();
    formData.append('audiofile', audiofile, filename);
    if (description) {
      formData = this.makeFormData(description, formData);
    }
    return this.makeRequest(this.makeUri(this.uris.upload), 'POST', formData);
  }

  describe(description: string) {
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

  getUser(username: string) {
    return this.makeRequest(this.makeUri(this.uris.user, [username])).then(e =>
      this.UserObject(e)
    );
  }

  getPack(packId: string) {
    return this.makeRequest(this.makeUri(this.uris.pack, [packId])).then(e =>
      this.PackObject(e)
    );
  }

  getSound(soundId: string) {
    return this.makeRequest<Sound>(this.makeUri(this.uris.sound, [soundId])).then(this.SoundObject);
  }

  private makeUri(uri: string, args?: Array<string>) {
    let newUri = String(uri);
    if (args) {
      args.forEach(element => {
        newUri = newUri.replace(/<[\w_]+>/, element);
      });
    }
    return this.uris.base + newUri;
  }

  private async makeRequest<T>(
    uri: string,
    method: string = 'GET',
    params: Record<string, string> = {}
  ): Promise<T> {
    const IsoURLSearchParams = typeof window === 'object'
      ? URLSearchParams
      : NodeURLSearchParams

    return fetch(
      params ? `${uri}?${new IsoURLSearchParams(params).toString()}` : uri,
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
