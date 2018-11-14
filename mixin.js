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

import { dedupingMixin } from './lib/deduping-mixin.js'

const ActorMixin = dedupingMixin(base => {
  /**
   * A base-class to define an Actor type. It requires all sub-classes to
   * implement the {@link Actor#onMessage} callback.
   *
   *    class MyActor extends Actor<MessageType> {
   *      onMessage(message: MessageType) {
   *        console.log(`Actor ${this.actorName} I received message: ${message}`);
   *      }
   *    }
   *
   * If you would like to perform some initialization logic, implement the
   * optional {@link Actor#init} callback.
   *
   *    class MyActor extends Actor<MessageType> {
   *      stockData?: StockData;
   *      count?: number;
   *
   *      async init() {
   *        this.count = 0;
   *        this.stockData = await (await fetch("/stockdata.json")).json()
   *      }
   *
   *      onMessage(message: MessageType) {
   *        this.count!++;
   *        console.log(`Actor ${this.actorName} received message number ${this.count}: ${message}`);
   *      }
   *    }
   *
   * If you want to know the actorName that this actor is assigned to in your
   * application, you can use `actorName`. This field is accessible only after
   * the {@link hookup} has been called.
   *
   * Users of this actor generally should not use {@link Actor#initPromise}. This
   * is an internal implementation detail for {@link hookup}.
   */

  class ActorMixin extends /** @type {HTMLElement} */(base) {
    constructor () {
      super();
      this.initPromise = Promise.resolve().then(() => this.init());
    }
    /**
     * Init callback that can be used to perform some initialization logic.
     * This method is invoked in the constructor of an {@link Actor} and should
     * not be called by any user of the actor subclass.
     *
     * Note that no messages will be delivered until the resulting promise
     * is resolved.
     *
     * @return A promise which resolves once this actor is initialized.
     */
    async init () {}
  }
  return ActorMixin;
});

export { ActorMixin };
