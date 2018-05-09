freesound-client
================

[![Build Status](https://travis-ci.org/amilajack/freesound-client.svg?branch=master)](https://travis-ci.org/amilajack/freesound-client)
[![NPM version](https://badge.fury.io/js/freesound-client.svg)](http://badge.fury.io/js/freesound-client)
[![Dependency Status](https://img.shields.io/david/amilajack/freesound-client.svg)](https://david-dm.org/amilajack/freesound-client)
[![npm](https://img.shields.io/npm/dm/freesound-client.svg)](https://npm-stat.com/charts.html?package=freesound-client)

A node client for the freesound V2 API

**IN PROGRESS, DO NOT USE**
**CURRENTLY ONLY WORKS WITH NODE. BROWSER SUPPORT SOON**

## Installation
```bash
# npm
npm install freesound-client
# yarn
yarn add freesound-client
```

## Usage
```js
import FreeSound from 'freesound-client';

const freeSound = new FreeSound();

// Set token
freeSound.setToken('your-api-key');

// Getting a sound
await this.freeSound.getSound(96541);

// Getting a user
await freeSound.getUser('Jovica');

// Text search 
await this.freeSound.textSearch('violoncello', {
  page: 1,
  filter: 'tag:tenuto duration:[1.0 TO 15.0]',
  sort: 'rating_desc',
  fields: 'id,name,url'
});
```
