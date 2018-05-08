// @flow
/* eslint class-methods-use-this: 0 */
import fetch from 'isomorphic-fetch';

export default class FreeSound {
  authHeader = '';

  clientId = '';

  clientSecret = '';

  host = 'freesound.org';

  uris = {
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

  checkOauth() {
    if (!this.authHeader.includes('Bearer')) {
      throw new Error('Oauth authentication required');
    }
  }

  makeFormData(obj: Object, f: Object) {
    let formData = { ...f };
    if (!formData) {
      formData = new this.FormData();
    }
    for (const prop of obj) {
      formData.append(prop, prop);
    }
    return formData;
  }

  search(options: Object, uri: string) {
    if (options.analysis_file) {
      return this.makeRequest(
        this.makeUri(uri),
        'POST',
        this.makeFormData(options)
      );
    }
    return this.makeRequest(this.makeUri(uri), 'GET', options);
  }

  Collection(oldJsonObject: Object) {
    const jsonObject = { ...oldJsonObject };
    const nextOrPrev = which => this.makeRequest(which).then(this.Collection);
    jsonObject.nextPage = () => {
      nextOrPrev(jsonObject.next);
    };
    jsonObject.previousPage = () => {
      nextOrPrev(jsonObject.previous);
    };
    jsonObject.getItem = idx => jsonObject.results[idx];

    return jsonObject;
  }

  SoundCollection(jsonObject: Object) {
    const collection = this.Collection(jsonObject);
    collection.getSound = idx => new this.SoundObject(collection.results[idx]);
    return collection;
  }

  PackCollection(jsonObject: Object) {
    const collection = this.Collection(jsonObject);
    collection.getPack = idx => new this.PackObject(collection.results[idx]);
    return collection;
  }

  SoundObject(oldJsonObject: Object) {
    const jsonObject = { ...oldJsonObject };
    jsonObject.getAnalysis = filter =>
      this.makeRequest(this.makeUri(this.uris.soundAnalysis, [jsonObject.id, filter || '']));

    jsonObject.getSimilar = params =>
      this.makeRequest(
        this.makeUri(this.uris.similarSounds, [jsonObject.id]),
        'GET',
        params
      )
        .then(this.SoundCollection);

    jsonObject.getComments = () =>
      this.makeRequest(
        this.makeUri(this.uris.comments, [jsonObject.id]),
        'GET',
        this.Collection
      );

    jsonObject.download = (oldTargetWindow) => {
      const targetWindow = { ...oldTargetWindow };
      // can be window, new, or iframe
      this.checkOauth();
      const uri = this.makeUri(this.uris.download, [jsonObject.id]);
      targetWindow.location = uri;
    };

    jsonObject.comment = (commentStr: string) => {
      this.checkOauth();
      const data = new this.FormData();
      data.append('comment', this.comment);
      const uri = this.makeUri(this.uris.comment, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    jsonObject.rate = (rating) => {
      this.checkOauth();
      const data = new this.FormData();
      data.append('rating', rating);
      const uri = this.makeUri(this.uris.rate, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    jsonObject.bookmark = (name, category) => {
      this.checkOauth();
      const data = new this.FormData();
      data.append('name', name);
      if (category) {
        data.append('category', category);
      }
      const uri = this.makeUri(this.uris.bookmark, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    jsonObject.edit = (description) => {
      this.checkOauth();
      const data = this.makeFormData(description);
      const uri = this.makeUri(this.uris.edit, [jsonObject.id]);
      return this.makeRequest(uri, 'POST', data);
    };

    return jsonObject;
  }

  UserObject(oldJsonObject: Object) {
    const jsonObject = { ...oldJsonObject };
    jsonObject.sounds = (params) => {
      const uri = this.makeUri(this.uris.userSounds, [jsonObject.username]);
      return this.makeRequest(uri, 'GET', params).then(this.SoundCollection);
    };

    jsonObject.packs = () => {
      const uri = this.makeUri(this.uris.userPacks, [jsonObject.username]);
      return this.makeRequest(uri).then(this.PackCollection);
    };

    jsonObject.bookmarkCategories = () => {
      const uri = this.makeUri(this.uris.userBookmarkCategories, [
        jsonObject.username
      ]);
      return this.makeRequest(uri);
    };

    jsonObject.bookmarkCategorySounds = (params) => {
      const uri = this.makeUri(this.uris.userBookmarkCategorySounds, [
        jsonObject.username
      ]);
      return this.makeRequest(uri, 'GET', params);
    };

    return jsonObject;
  }

  PackObject(oldJsonObject: Object) {
    const jsonObject = { ...oldJsonObject };
    jsonObject.sounds = () => {
      const uri = this.makeUri(this.uris.packSounds, [jsonObject.id]);
      return this.makeRequest(uri).then(this.SoundCollection);
    };

    jsonObject.download = (oldTargetWindow) => {
      const targetWindow = { ...oldTargetWindow };
      // can be current or new window, or iframe
      this.checkOauth();
      const uri = this.makeUri(this.uris.packDownload, [jsonObject.id]);
      targetWindow.location = uri;
    };
    return jsonObject;
  }

  setToken(token: string, type: string) {
    this.authHeader = (type === 'oauth' ? 'Bearer ' : 'Token ') + token;
  }

  setClientSecrets(id: string, secret: string) {
    this.clientId = id;
    this.clientSecret = secret;
  }

  postAccessCode(code: string) {
    const postUrl = `${this.uris.base}/oauth2/access_token/`;
    const data = new this.FormData();
    data.append('client_id', this.clientId);
    data.append('client_secret', this.clientSecret);
    data.append('code', code);
    data.append('grant_type', 'authorization_code');
    return this.makeRequest(postUrl, 'POST', data);
  }

  textSearch(query: string, opts: Object = {}) {
    const options = { ...opts };
    options.query = query || ' ';
    return this.search(options, this.uris.textSearch).then(this.SoundCollection);
  }

  contentSearch(options: Object) {
    if (!(options.target || options.analysis_file)) {
      throw new Error('Missing target or analysis_file');
    }
    return this.search(options, this.uris.contentSearch).then(this.SoundCollection);
  }

  combinedSearch(options: Object) {
    if (!(options.target || options.analysis_file || options.query)) {
      throw new Error('Missing query, target or analysis_file');
    }
    return this.search(options, this.uris.contentSearch);
  }

  getSound(soundId: string) {
    return this.makeRequest(
      this.makeUri(this.uris.sound, [soundId]),
      'GET',
      this.SoundObject
    );
  }

  upload(audiofile: string, filename: string, description: string) {
    this.checkOauth();
    let formData = new this.FormData();
    formData.append('audiofile', audiofile, filename);
    if (description) {
      formData = this.makeFormData(description, formData);
    }
    return this.makeRequest(this.makeUri(this.uris.upload), 'POST', formData);
  }

  describe(uploadFilename: string, description: string) {
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
    return this.makeRequest(this.makeUri(this.uris.user, [username])).then(this.UserObject);
  }

  getPack(packId: string) {
    return this.makeRequest(this.makeUri(this.uris.pack, [packId])).then(this.PackObject);
  }

  makeUri(uri: string, args?: Array<string>) {
    let newUri = String(uri);
    if (args) {
      args.forEach((element) => {
        newUri = newUri.replace(/<[\w_]+>/, element);
      });
    }
    return this.uris.base + newUri;
  }

  async makeRequest(
    uri: string,
    method?: string = 'GET',
    params?: Object = {}
  ) {
    return fetch(uri, {
      method,
      body: JSON.stringify(params),
      headers: {
        headers: { Authorization: this.authHeader }
      }
    }).then(res => res.json());
  }
}
