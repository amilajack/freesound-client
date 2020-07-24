"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const form_data_1 = __importDefault(require("form-data"));
const url_1 = require("url");
class FreeSound {
    constructor() {
        /**
         * @private
         */
        this.authHeader = '';
        /**
         * @private
         */
        this.clientId = '';
        /**
         * @private
         */
        this.clientSecret = '';
        /**
         * @private
         */
        this.host = 'freesound.org';
        /**
         * @private
         */
        this.uris = {
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
            userBookmarkCategorySounds: '/users/<username>/bookmark_categories/<category_id>/sounds/',
            pack: '/packs/<pack_id>/',
            packSounds: '/packs/<pack_id>/sounds/',
            packDownload: '/packs/<pack_id>/download/'
        };
    }
    /**
     * @private
     */
    checkOauth() {
        if (!this.authHeader.includes('Bearer')) {
            throw new Error('Oauth authentication required');
        }
    }
    /**
     * @private
     */
    makeFormData(obj, prevFormData) {
        const formData = prevFormData ? { ...prevFormData } : new form_data_1.default();
        for (const prop in obj) {
            formData.append(prop, obj[prop]);
        }
        return formData;
    }
    search(options, uri) {
        if (options.analysis_file) {
            return this.makeRequest(this.makeUri(uri), 'POST', this.makeFormData(options));
        }
        return this.makeRequest(this.makeUri(uri), 'GET', options);
    }
    /**
     * @private
     */
    Collection(oldJsonObject) {
        const jsonObject = { ...oldJsonObject };
        const nextOrPrev = which => this.makeRequest(which).then(e => this.Collection(e));
        jsonObject.nextPage = () => {
            nextOrPrev(jsonObject.next);
        };
        jsonObject.previousPage = () => {
            nextOrPrev(jsonObject.previous);
        };
        jsonObject.getItem = idx => jsonObject.results[idx];
        return jsonObject;
    }
    /**
     * @private
     */
    SoundCollection(jsonObject) {
        const collection = this.Collection(jsonObject);
        collection.getSound = idx => this.SoundObject(collection.results[idx]);
        return collection;
    }
    /**
     * @private
     */
    PackCollection(jsonObject) {
        const collection = this.Collection(jsonObject);
        collection.getPack = idx => this.PackObject(collection.results[idx]);
        return collection;
    }
    /**
     * @private
     */
    SoundObject(oldJsonObject) {
        const jsonObject = { ...oldJsonObject };
        jsonObject.getAnalysis = filter => this.makeRequest(this.makeUri(this.uris.soundAnalysis, [jsonObject.id, filter || '']));
        jsonObject.getSimilar = params => this.makeRequest(this.makeUri(this.uris.similarSounds, [jsonObject.id]), 'GET', params).then(e => this.SoundCollection(e));
        jsonObject.getComments = () => this.makeRequest(this.makeUri(this.uris.comments, [jsonObject.id]), 'GET', this.Collection);
        jsonObject.download = oldTargetWindow => {
            const targetWindow = { ...oldTargetWindow };
            // can be window, new, or iframe
            this.checkOauth();
            const uri = this.makeUri(this.uris.download, [jsonObject.id]);
            targetWindow.location = uri;
        };
        jsonObject.comment = () => {
            this.checkOauth();
            const data = new form_data_1.default();
            data.append('comment', this.comment);
            const uri = this.makeUri(this.uris.comment, [jsonObject.id]);
            return this.makeRequest(uri, 'POST', data);
        };
        jsonObject.rate = rating => {
            this.checkOauth();
            const data = new form_data_1.default();
            data.append('rating', rating);
            const uri = this.makeUri(this.uris.rate, [jsonObject.id]);
            return this.makeRequest(uri, 'POST', data);
        };
        jsonObject.bookmark = (name, category) => {
            this.checkOauth();
            const data = new form_data_1.default();
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
    /**
     * @private
     */
    UserObject(oldJsonObject) {
        const jsonObject = { ...oldJsonObject };
        jsonObject.sounds = params => {
            const uri = this.makeUri(this.uris.userSounds, [jsonObject.username]);
            return this.makeRequest(uri, 'GET', params).then(e => this.SoundCollection(e));
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
    /**
     * @private
     */
    PackObject(oldJsonObject) {
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
    setToken(token, type) {
        this.authHeader = `${type === 'oauth' ? 'Bearer ' : 'Token '}${token}`;
        return this.authHeader;
    }
    setClientSecrets(id, secret) {
        this.clientId = id;
        this.clientSecret = secret;
    }
    postAccessCode(code) {
        const postUrl = `${this.uris.base}/oauth2/access_token/`;
        const data = new form_data_1.default();
        data.append('client_id', this.clientId);
        data.append('client_secret', this.clientSecret);
        data.append('code', code);
        data.append('grant_type', 'authorization_code');
        return this.makeRequest(postUrl, 'POST', data);
    }
    textSearch(query, opts = {}) {
        const options = { ...opts };
        options.query = query || ' ';
        return this.search(options, this.uris.textSearch).then(e => this.SoundCollection(e));
    }
    contentSearch(options) {
        if (!(options.target || options.analysis_file || options.descriptors_filter)) {
            throw new Error('Missing target or analysis_file');
        }
        return this.search(options, this.uris.contentSearch).then(e => this.SoundCollection(e));
    }
    combinedSearch(options) {
        if (!(options.target || options.analysis_file || options.query)) {
            throw new Error('Missing query, target or analysis_file');
        }
        return this.search(options, this.uris.contentSearch);
    }
    upload(audiofile, filename, description) {
        this.checkOauth();
        let formData = new form_data_1.default();
        formData.append('audiofile', audiofile, filename);
        if (description) {
            formData = this.makeFormData(description, formData);
        }
        return this.makeRequest(this.makeUri(this.uris.upload), 'POST', formData);
    }
    describe(uploadFilename, description) {
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
        if (this.clientId === undefined)
            throw new Error('client_id was not set');
        let loginUrl = this.makeUri(this.uris.authorize);
        loginUrl += `?client_id=${this.clientId}&response_type=code`;
        return loginUrl;
    }
    getLogoutURL() {
        let logoutUrl = this.makeUri(this.uris.logoutAuthorize);
        logoutUrl += `?client_id=${this.clientId}&response_type=code`;
        return logoutUrl;
    }
    getUser(username) {
        return this.makeRequest(this.makeUri(this.uris.user, [username])).then(e => this.UserObject(e));
    }
    getPack(packId) {
        return this.makeRequest(this.makeUri(this.uris.pack, [packId])).then(e => this.PackObject(e));
    }
    getSound(soundId) {
        return this.makeRequest(this.makeUri(this.uris.sound, [soundId])).then(e => this.SoundObject(e));
    }
    /**
     * @private
     */
    makeUri(uri, args) {
        let newUri = String(uri);
        if (args) {
            args.forEach(element => {
                newUri = newUri.replace(/<[\w_]+>/, element);
            });
        }
        return this.uris.base + newUri;
    }
    /**
     * @private
     */
    async makeRequest(uri, method = 'GET', params = {}) {
        return node_fetch_1.default(params ? `${uri}?${new url_1.URLSearchParams(params).toString()}` : uri, {
            method,
            headers: {
                Authorization: this.authHeader
            }
        })
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
exports.default = FreeSound;
//# sourceMappingURL=index.js.map