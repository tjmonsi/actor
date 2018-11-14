/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// copied from Actor-model: https://github.com/PolymerLabs/actor-helpers/

import localforage from 'localforage';
const POLLING_INTERVAL = 50;
const DB_PREFIX = 'ACTOR-DATABASE-LOCALFORAGE';
const OBJECT_STORE_NAME = 'MESSAGES';

class MessageStore {
  constructor (name) {
    this.name = name;
    this.storeName = OBJECT_STORE_NAME;
    this.dbName = `${DB_PREFIX}.${name}`;
    this.db = localforage.createInstance({
      name: this.dbName,
      storeName: this.storeName
    });

    if ('BroadcastChannel' in self) {
      this.bcc = new BroadcastChannel(name);
    }
  }

  async popMessages (recipient, { keepMessage = false } = {}) {
    const messages = [];
    await this.db.iterate(async (value, key) => {
      if (value.recipient === recipient || recipient === '*') {
        messages.push(value);
        if (!keepMessage) {
          await this.db.removeItem(key);
        }
      }
    });
    return messages;
  }

  async pushMessage (message) {
    if (message.recipient === '*') {
      throw new Error(`Can’t send a message to reserved name '*'`);
    }

    if (this.bcc) {
      this.bcc.postMessage({
        recipient: message.recipient
      });
    }

    const index = await this.db.length();

    if (!await this.db.getItem(index + message.recipient)) {
      this.db.setItem(index + message.recipient, message);
    }
  }

  subscribeWithBroadcastChannel (recipient, callback) {
    const channel = new BroadcastChannel(this.name);
    const channelCallback = async evt => {
      const ping = evt.data;
      if (ping.recipient !== recipient) {
        return;
      }
      const messages = await this.popMessages(recipient);
      if (messages.length > 0) {
        callback(messages);
      }
    };
    channel.addEventListener('message', channelCallback);
    // Check for already stored messages immediately
    channelCallback(new MessageEvent('message', { data: { recipient } }));
    return () => channel.close();
  }

  subscribeWithPolling (recipient, callback) {
    let timeout = -1;
    const pollCallback = async () => {
      const messages = await this.popMessages(recipient);
      if (messages.length > 0) {
        callback(messages);
      }
      timeout = setTimeout(pollCallback, POLLING_INTERVAL);
    };
    timeout = setTimeout(pollCallback, POLLING_INTERVAL);
    return () => clearTimeout(timeout);
  }

  /**
   * Add a callback whenever a new message arrives for the recipient.
   * Depending on the functionality of your browser, this will either use
   * `BroadcastChannel` for fine-grained notification timing. If the browser
   * does not implement `BroadcastChannel`, it falls back to use a polling
   * mechanism. The polling timeout is specified by {@link POLLING_INTERVAL}.
   *
   * @param {Object} recipient The name of the recipient.
   * @param {Function} callback The callback that is invoked with all new messages.
   * @returns {Function} a function to unsubscribe
   */
  subscribe (recipient, callback) {
    const broadcast = ('BroadcastChannel' in self) ? 'subscribeWithBroadcastChannel' : 'subscribeWithPolling';
    return this[broadcast](recipient, callback);
  }
}

export { MessageStore };
