# freesound-client

![Test](https://github.com/amilajack/freesound-client/workflows/Test/badge.svg)
[![NPM version](https://badge.fury.io/js/freesound-client.svg)](http://badge.fury.io/js/freesound-client)
[![npm](https://img.shields.io/npm/dm/freesound-client.svg)](https://npm-stat.com/charts.html?package=freesound-client)

A freesound v2 client that works in node and the browser

## Installation

```bash
npm install freesound-client
```

```bash
yarn add freesound-client
```

## Usage

### Setup

```js
import FreeSound from "freesound-client";

const freeSound = new FreeSound();

// Set token
freeSound.setToken("your-api-key");
```

### Searching

```js
// Text search
await freeSound.textSearch("violoncello", {
  page: 1,
  filter: "tag:tenuto duration:[1.0 TO 15.0]",
  sort: "rating_desc",
  fields: "id,name,url",
});

// Combined search
await freeSound.combinedSearch({
  target: "rhythm.bpm:120&filter=tag:loop",
});

// Content search
await freeSound.contentSearch({
  target: "lowlevel.pitch.mean:220",
});
```

### Retrieving a sound or pack of sounds

```js
// Getting a pack
const pack = await freeSound.getPack(9678);
// Getting a pack's sounds
const packSounds = await pack.sounds();

// Getting a sound
const sound = await freeSound.getSound(96541);
// Getting a sound's related data
const [analysis, similar, comments] = await Promise.all([
  sound.getAnalysis(),
  sound.getSimilar(),
  sound.getComments(),
]);
```

### Retrieving User Data

```js
// Getting a user
await freeSound.getUser("Jovica");
// Getting a user's related data
const [sounds, packs, bookCat, bookCatSounds] = await Promise.all([
  user.sounds(),
  user.packs(),
  user.bookmarkCategories(),
  user.bookmarkCategorySounds(),
]);
```

### OAuth

```js
// OAuth login
freeSound.setToken("your-api-key", "oauth");
// Set your application's client_id and client_secret
freeSound.setClientSecrets("your-client-id", "your-client-secret");
// Make the user navigate here
freeSound.getLoginURL();
// Use the authorization code from the login
freeSound.postAccessCode("your-temporary-code-from-login");
```

## API Docs

See the [API Docs](https://amilajack.github.io/freesound-client/)

## Runnable Example

- See the runnable example [here](https://github.com/amilajack/freesound-client-example)

## Local setup

```bash
git clone https://github.com/amilajack/freesound-client
cd freesound-client
yarn
cp .env.example .env
yarn test
```
