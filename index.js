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

import { ActorMixin } from './mixin.js';
import { MessageStore } from './lib/message-store.js';

class ActorBase {}
class Actor extends ActorMixin(ActorBase) {}

const messageStore = new MessageStore('ACTOR-MESSAGES');

const defineActor = async (name, actor, { purgeExistingMessages = false } = {}) => {
  actor.actorName = name;
  await actor.initPromise;

  if (purgeExistingMessages) {
    await messageStore.popMessages(name);
  }

  const destroy = messageStore.subscribe(name, (messages = []) => {
    for (const message of messages) {
      try {
        actor.onMessage(message.detail);
      } catch (e) {
        console.error(e);
      }
    }
  });

  return async () => {
    destroy();
    await messageStore.popMessages(name);
  };
};

const getActor = async (name) => {
  return {
    async send(message) {
      await messageStore.pushMessage({
        recipient: name,
        detail: message
      });
    }
  };
}

const initializeQueues = async () => {
  await messageStore.popMessages('*');
}

export { Actor, defineActor, initializeQueues, getActor };
