(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

var fingerprint = require('./lib/fingerprint.js');
var pad = require('./lib/pad.js');
var getRandomValue = require('./lib/getRandomValue.js');

var c = 0,
  blockSize = 4,
  base = 36,
  discreteValues = Math.pow(base, blockSize);

function randomBlock () {
  return pad((getRandomValue() *
    discreteValues << 0)
    .toString(base), blockSize);
}

function safeCounter () {
  c = c < discreteValues ? c : 0;
  c++; // this is not subliminal
  return c - 1;
}

function cuid () {
  // Starting with a lowercase letter makes
  // it HTML element ID friendly.
  var letter = 'c', // hard-coded allows for sequential access

    // timestamp
    // warning: this exposes the exact date and time
    // that the uid was created.
    timestamp = (new Date().getTime()).toString(base),

    // Prevent same-machine collisions.
    counter = pad(safeCounter().toString(base), blockSize),

    // A few chars to generate distinct ids for different
    // clients (so different computers are far less
    // likely to generate the same id)
    print = fingerprint(),

    // Grab some more chars from Math.random()
    random = randomBlock() + randomBlock();

  return letter + timestamp + counter + print + random;
}

cuid.slug = function slug () {
  var date = new Date().getTime().toString(36),
    counter = safeCounter().toString(36).slice(-4),
    print = fingerprint().slice(0, 1) +
      fingerprint().slice(-1),
    random = randomBlock().slice(-2);

  return date.slice(-2) +
    counter + print + random;
};

cuid.isCuid = function isCuid (stringToCheck) {
  if (typeof stringToCheck !== 'string') return false;
  if (stringToCheck.startsWith('c')) return true;
  return false;
};

cuid.isSlug = function isSlug (stringToCheck) {
  if (typeof stringToCheck !== 'string') return false;
  var stringLength = stringToCheck.length;
  if (stringLength >= 7 && stringLength <= 10) return true;
  return false;
};

cuid.fingerprint = fingerprint;

module.exports = cuid;

},{"./lib/fingerprint.js":2,"./lib/getRandomValue.js":3,"./lib/pad.js":4}],2:[function(require,module,exports){
var pad = require('./pad.js');

var env = typeof window === 'object' ? window : self;
var globalCount = Object.keys(env).length;
var mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
var clientId = pad((mimeTypesLength +
  navigator.userAgent.length).toString(36) +
  globalCount.toString(36), 4);

module.exports = function fingerprint () {
  return clientId;
};

},{"./pad.js":4}],3:[function(require,module,exports){

var getRandomValue;

var crypto = window.crypto || window.msCrypto;

if (crypto) {
    var lim = Math.pow(2, 32) - 1;
    getRandomValue = function () {
        return Math.abs(crypto.getRandomValues(new Uint32Array(1))[0] / lim);
    };
} else {
    getRandomValue = Math.random;
}

module.exports = getRandomValue;

},{}],4:[function(require,module,exports){
module.exports = function pad (num, size) {
  var s = '000000000' + num;
  return s.substr(s.length - size);
};

},{}],5:[function(require,module,exports){
module.exports = dragDrop

var flatten = require('flatten')
var parallel = require('run-parallel')

function dragDrop (elem, listeners) {
  if (typeof elem === 'string') {
    var selector = elem
    elem = window.document.querySelector(elem)
    if (!elem) {
      throw new Error('"' + selector + '" does not match any HTML elements')
    }
  }

  if (!elem) {
    throw new Error('"' + elem + '" is not a valid HTML element')
  }

  if (typeof listeners === 'function') {
    listeners = { onDrop: listeners }
  }

  var timeout

  elem.addEventListener('dragenter', onDragEnter, false)
  elem.addEventListener('dragover', onDragOver, false)
  elem.addEventListener('dragleave', onDragLeave, false)
  elem.addEventListener('drop', onDrop, false)

  // Function to remove drag-drop listeners
  return function remove () {
    removeDragClass()
    elem.removeEventListener('dragenter', onDragEnter, false)
    elem.removeEventListener('dragover', onDragOver, false)
    elem.removeEventListener('dragleave', onDragLeave, false)
    elem.removeEventListener('drop', onDrop, false)
  }

  function onDragEnter (e) {
    if (listeners.onDragEnter) {
      listeners.onDragEnter(e)
    }

    // Prevent event
    e.stopPropagation()
    e.preventDefault()
    return false
  }

  function onDragOver (e) {
    e.stopPropagation()
    e.preventDefault()
    if (e.dataTransfer.items) {
      // Only add "drag" class when `items` contains items that are able to be
      // handled by the registered listeners (files vs. text)
      var items = toArray(e.dataTransfer.items)
      var fileItems = items.filter(function (item) { return item.kind === 'file' })
      var textItems = items.filter(function (item) { return item.kind === 'string' })

      if (fileItems.length === 0 && !listeners.onDropText) return
      if (textItems.length === 0 && !listeners.onDrop) return
      if (fileItems.length === 0 && textItems.length === 0) return
    }

    elem.classList.add('drag')
    clearTimeout(timeout)

    if (listeners.onDragOver) {
      listeners.onDragOver(e)
    }

    e.dataTransfer.dropEffect = 'copy'
    return false
  }

  function onDragLeave (e) {
    e.stopPropagation()
    e.preventDefault()

    if (listeners.onDragLeave) {
      listeners.onDragLeave(e)
    }

    clearTimeout(timeout)
    timeout = setTimeout(removeDragClass, 50)

    return false
  }

  function onDrop (e) {
    e.stopPropagation()
    e.preventDefault()

    if (listeners.onDragLeave) {
      listeners.onDragLeave(e)
    }

    clearTimeout(timeout)
    removeDragClass()

    var pos = {
      x: e.clientX,
      y: e.clientY
    }

    // text drop support
    var text = e.dataTransfer.getData('text')
    if (text && listeners.onDropText) {
      listeners.onDropText(text, pos)
    }

    // file drop support
    if (e.dataTransfer.items) {
      // Handle directories in Chrome using the proprietary FileSystem API
      var items = toArray(e.dataTransfer.items).filter(function (item) {
        return item.kind === 'file'
      })

      if (items.length === 0) return

      parallel(items.map(function (item) {
        return function (cb) {
          processEntry(item.webkitGetAsEntry(), cb)
        }
      }), function (err, results) {
        // This catches permission errors with file:// in Chrome. This should never
        // throw in production code, so the user does not need to use try-catch.
        if (err) throw err
        if (listeners.onDrop) {
          listeners.onDrop(flatten(results), pos)
        }
      })
    } else {
      var files = toArray(e.dataTransfer.files)

      if (files.length === 0) return

      files.forEach(function (file) {
        file.fullPath = '/' + file.name
      })

      if (listeners.onDrop) {
        listeners.onDrop(files, pos)
      }
    }

    return false
  }

  function removeDragClass () {
    elem.classList.remove('drag')
  }
}

function processEntry (entry, cb) {
  var entries = []

  if (entry.isFile) {
    entry.file(function (file) {
      file.fullPath = entry.fullPath // preserve pathing for consumer
      cb(null, file)
    }, function (err) {
      cb(err)
    })
  } else if (entry.isDirectory) {
    var reader = entry.createReader()
    readEntries()
  }

  function readEntries () {
    reader.readEntries(function (entries_) {
      if (entries_.length > 0) {
        entries = entries.concat(toArray(entries_))
        readEntries() // continue reading entries until `readEntries` returns no more
      } else {
        doneEntries()
      }
    })
  }

  function doneEntries () {
    parallel(entries.map(function (entry) {
      return function (cb) {
        processEntry(entry, cb)
      }
    }), cb)
  }
}

function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}

},{"flatten":9,"run-parallel":18}],6:[function(require,module,exports){
// This file can be required in Browserify and Node.js for automatic polyfill
// To use it:  require('es6-promise/auto');
'use strict';
module.exports = require('./').polyfill();

},{"./":7}],7:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   v4.2.5+7f2b526d
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  var type = typeof x;
  return x !== null && (type === 'object' || type === 'function');
}

function isFunction(x) {
  return typeof x === 'function';
}



var _isArray = void 0;
if (Array.isArray) {
  _isArray = Array.isArray;
} else {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
}

var isArray = _isArray;

var len = 0;
var vertxNext = void 0;
var customSchedulerFn = void 0;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var vertx = Function('return this')().require('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = void 0;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;


  if (_state) {
    var callback = arguments[_state - 1];
    asap(function () {
      return invokeCallback(_state, child, callback, parent._result);
    });
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve$1(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(2);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var TRY_CATCH_ERROR = { error: null };

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    TRY_CATCH_ERROR.error = error;
    return TRY_CATCH_ERROR;
  }
}

function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
  try {
    then$$1.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then$$1) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then$$1, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return resolve(promise, value);
    }, function (reason) {
      return reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$1) {
  if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$1 === TRY_CATCH_ERROR) {
      reject(promise, TRY_CATCH_ERROR.error);
      TRY_CATCH_ERROR.error = null;
    } else if (then$$1 === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$1)) {
      handleForeignThenable(promise, maybeThenable, then$$1);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function resolve(promise, value) {
  if (promise === value) {
    reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;


  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = void 0,
      callback = void 0,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = void 0,
      error = void 0,
      succeeded = void 0,
      failed = void 0;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value.error = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    fulfill(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      resolve(promise, value);
    }, function rejectPromise(reason) {
      reject(promise, reason);
    });
  } catch (e) {
    reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

var Enumerator = function () {
  function Enumerator(Constructor, input) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop);

    if (!this.promise[PROMISE_ID]) {
      makePromise(this.promise);
    }

    if (isArray(input)) {
      this.length = input.length;
      this._remaining = input.length;

      this._result = new Array(this.length);

      if (this.length === 0) {
        fulfill(this.promise, this._result);
      } else {
        this.length = this.length || 0;
        this._enumerate(input);
        if (this._remaining === 0) {
          fulfill(this.promise, this._result);
        }
      }
    } else {
      reject(this.promise, validationError());
    }
  }

  Enumerator.prototype._enumerate = function _enumerate(input) {
    for (var i = 0; this._state === PENDING && i < input.length; i++) {
      this._eachEntry(input[i], i);
    }
  };

  Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
    var c = this._instanceConstructor;
    var resolve$$1 = c.resolve;


    if (resolve$$1 === resolve$1) {
      var _then = getThen(entry);

      if (_then === then && entry._state !== PENDING) {
        this._settledAt(entry._state, i, entry._result);
      } else if (typeof _then !== 'function') {
        this._remaining--;
        this._result[i] = entry;
      } else if (c === Promise$1) {
        var promise = new c(noop);
        handleMaybeThenable(promise, entry, _then);
        this._willSettleAt(promise, i);
      } else {
        this._willSettleAt(new c(function (resolve$$1) {
          return resolve$$1(entry);
        }), i);
      }
    } else {
      this._willSettleAt(resolve$$1(entry), i);
    }
  };

  Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
    var promise = this.promise;


    if (promise._state === PENDING) {
      this._remaining--;

      if (state === REJECTED) {
        reject(promise, value);
      } else {
        this._result[i] = value;
      }
    }

    if (this._remaining === 0) {
      fulfill(promise, this._result);
    }
  };

  Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
    var enumerator = this;

    subscribe(promise, undefined, function (value) {
      return enumerator._settledAt(FULFILLED, i, value);
    }, function (reason) {
      return enumerator._settledAt(REJECTED, i, reason);
    });
  };

  return Enumerator;
}();

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject$1(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {Function} resolver
  Useful for tooling.
  @constructor
*/

var Promise$1 = function () {
  function Promise(resolver) {
    this[PROMISE_ID] = nextId();
    this._result = this._state = undefined;
    this._subscribers = [];

    if (noop !== resolver) {
      typeof resolver !== 'function' && needsResolver();
      this instanceof Promise ? initializePromise(this, resolver) : needsNew();
    }
  }

  /**
  The primary way of interacting with a promise is through its `then` method,
  which registers callbacks to receive either a promise's eventual value or the
  reason why the promise cannot be fulfilled.
   ```js
  findUser().then(function(user){
    // user is available
  }, function(reason){
    // user is unavailable, and you are given the reason why
  });
  ```
   Chaining
  --------
   The return value of `then` is itself a promise.  This second, 'downstream'
  promise is resolved with the return value of the first promise's fulfillment
  or rejection handler, or rejected if the handler throws an exception.
   ```js
  findUser().then(function (user) {
    return user.name;
  }, function (reason) {
    return 'default name';
  }).then(function (userName) {
    // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
    // will be `'default name'`
  });
   findUser().then(function (user) {
    throw new Error('Found user, but still unhappy');
  }, function (reason) {
    throw new Error('`findUser` rejected and we're unhappy');
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
    // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
  });
  ```
  If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
   ```js
  findUser().then(function (user) {
    throw new PedagogicalException('Upstream error');
  }).then(function (value) {
    // never reached
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // The `PedgagocialException` is propagated all the way down to here
  });
  ```
   Assimilation
  ------------
   Sometimes the value you want to propagate to a downstream promise can only be
  retrieved asynchronously. This can be achieved by returning a promise in the
  fulfillment or rejection handler. The downstream promise will then be pending
  until the returned promise is settled. This is called *assimilation*.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // The user's comments are now available
  });
  ```
   If the assimliated promise rejects, then the downstream promise will also reject.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // If `findCommentsByAuthor` fulfills, we'll have the value here
  }, function (reason) {
    // If `findCommentsByAuthor` rejects, we'll have the reason here
  });
  ```
   Simple Example
  --------------
   Synchronous Example
   ```javascript
  let result;
   try {
    result = findResult();
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
  findResult(function(result, err){
    if (err) {
      // failure
    } else {
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findResult().then(function(result){
    // success
  }, function(reason){
    // failure
  });
  ```
   Advanced Example
  --------------
   Synchronous Example
   ```javascript
  let author, books;
   try {
    author = findAuthor();
    books  = findBooksByAuthor(author);
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
   function foundBooks(books) {
   }
   function failure(reason) {
   }
   findAuthor(function(author, err){
    if (err) {
      failure(err);
      // failure
    } else {
      try {
        findBoooksByAuthor(author, function(books, err) {
          if (err) {
            failure(err);
          } else {
            try {
              foundBooks(books);
            } catch(reason) {
              failure(reason);
            }
          }
        });
      } catch(error) {
        failure(err);
      }
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findAuthor().
    then(findBooksByAuthor).
    then(function(books){
      // found books
  }).catch(function(reason){
    // something went wrong
  });
  ```
   @method then
  @param {Function} onFulfilled
  @param {Function} onRejected
  Useful for tooling.
  @return {Promise}
  */

  /**
  `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
  as the catch block of a try/catch statement.
  ```js
  function findAuthor(){
  throw new Error('couldn't find that author');
  }
  // synchronous
  try {
  findAuthor();
  } catch(reason) {
  // something went wrong
  }
  // async with promises
  findAuthor().catch(function(reason){
  // something went wrong
  });
  ```
  @method catch
  @param {Function} onRejection
  Useful for tooling.
  @return {Promise}
  */


  Promise.prototype.catch = function _catch(onRejection) {
    return this.then(null, onRejection);
  };

  /**
    `finally` will be invoked regardless of the promise's fate just as native
    try/catch/finally behaves
  
    Synchronous example:
  
    ```js
    findAuthor() {
      if (Math.random() > 0.5) {
        throw new Error();
      }
      return new Author();
    }
  
    try {
      return findAuthor(); // succeed or fail
    } catch(error) {
      return findOtherAuther();
    } finally {
      // always runs
      // doesn't affect the return value
    }
    ```
  
    Asynchronous example:
  
    ```js
    findAuthor().catch(function(reason){
      return findOtherAuther();
    }).finally(function(){
      // author was either found, or not
    });
    ```
  
    @method finally
    @param {Function} callback
    @return {Promise}
  */


  Promise.prototype.finally = function _finally(callback) {
    var promise = this;
    var constructor = promise.constructor;

    if (isFunction(callback)) {
      return promise.then(function (value) {
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      }, function (reason) {
        return constructor.resolve(callback()).then(function () {
          throw reason;
        });
      });
    }

    return promise.then(callback, callback);
  };

  return Promise;
}();

Promise$1.prototype.then = then;
Promise$1.all = all;
Promise$1.race = race;
Promise$1.resolve = resolve$1;
Promise$1.reject = reject$1;
Promise$1._setScheduler = setScheduler;
Promise$1._setAsap = setAsap;
Promise$1._asap = asap;

/*global self*/
function polyfill() {
  var local = void 0;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof self !== 'undefined') {
    local = self;
  } else {
    try {
      local = Function('return this')();
    } catch (e) {
      throw new Error('polyfill failed because global object is unavailable in this environment');
    }
  }

  var P = local.Promise;

  if (P) {
    var promiseToString = null;
    try {
      promiseToString = Object.prototype.toString.call(P.resolve());
    } catch (e) {
      // silently ignored
    }

    if (promiseToString === '[object Promise]' && !P.cast) {
      return;
    }
  }

  local.Promise = Promise$1;
}

// Strange compat..
Promise$1.polyfill = polyfill;
Promise$1.Promise = Promise$1;

return Promise$1;

})));





}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":59}],8:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
var setProperty = function setProperty(target, options) {
	if (defineProperty && options.name === '__proto__') {
		defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
	} else {
		target[options.name] = options.newValue;
	}
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
var getProperty = function getProperty(obj, name) {
	if (name === '__proto__') {
		if (!hasOwn.call(obj, name)) {
			return void 0;
		} else if (gOPD) {
			// In early versions of node, obj['__proto__'] is buggy when obj has
			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
			return gOPD(obj, name).value;
		}
	}

	return obj[name];
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						setProperty(target, { name: name, newValue: copy });
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],9:[function(require,module,exports){
module.exports = function flatten(list, depth) {
  depth = (typeof depth == 'number') ? depth : Infinity;

  if (!depth) {
    if (Array.isArray(list)) {
      return list.map(function(i) { return i; });
    }
    return list;
  }

  return _flatten(list, 1);

  function _flatten(list, d) {
    return list.reduce(function (acc, item) {
      if (Array.isArray(item) && d < depth) {
        return acc.concat(_flatten(item, d + 1));
      }
      else {
        return acc.concat(item);
      }
    }, []);
  }
};

},{}],10:[function(require,module,exports){
(function (global){
/*
 *  base64.js
 *
 *  Licensed under the BSD 3-Clause License.
 *    http://opensource.org/licenses/BSD-3-Clause
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */
;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? module.exports = factory(global)
        : typeof define === 'function' && define.amd
        ? define(factory) : factory(global)
}((
    typeof self !== 'undefined' ? self
        : typeof window !== 'undefined' ? window
        : typeof global !== 'undefined' ? global
: this
), function(global) {
    'use strict';
    // existing version for noConflict()
    global = global || {};
    var _Base64 = global.Base64;
    var version = "2.5.1";
    // if node.js and NOT React Native, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        try {
            buffer = eval("require('buffer').Buffer");
        } catch (err) {
            buffer = undefined;
        }
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa ? function(b) {
        return global.btoa(b);
    } : function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer ?
        buffer.from && Uint8Array && buffer.from !== Uint8Array.from
        ? function (u) {
            return (u.constructor === buffer.constructor ? u : buffer.from(u))
                .toString('base64')
        }
        :  function (u) {
            return (u.constructor === buffer.constructor ? u : new  buffer(u))
                .toString('base64')
        }
        : function (u) { return btoa(utob(u)) }
    ;
    var encode = function(u, urisafe) {
        return !urisafe
            ? _encode(String(u))
            : _encode(String(u)).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var _atob = global.atob ? function(a) {
        return global.atob(a);
    } : function(a){
        return a.replace(/\S{1,4}/g, cb_decode);
    };
    var atob = function(a) {
        return _atob(String(a).replace(/[^A-Za-z0-9\+\/]/g, ''));
    };
    var _decode = buffer ?
        buffer.from && Uint8Array && buffer.from !== Uint8Array.from
        ? function(a) {
            return (a.constructor === buffer.constructor
                    ? a : buffer.from(a, 'base64')).toString();
        }
        : function(a) {
            return (a.constructor === buffer.constructor
                    ? a : new buffer(a, 'base64')).toString();
        }
        : function(a) { return btou(_atob(a)) };
    var decode = function(a){
        return _decode(
            String(a).replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    var noConflict = function() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict,
        __buffer__: buffer
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    //
    // export Base64 to the namespace
    //
    if (global['Meteor']) { // Meteor.js
        Base64 = global.Base64;
    }
    // module.exports and AMD are mutually exclusive.
    // module.exports has precedence.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.Base64 = global.Base64;
    }
    else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function(){ return global.Base64 });
    }
    // that's it!
    return {Base64: global.Base64}
}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],11:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed `func` invocations and a `flush` method to
 * immediately invoke them. Provide `options` to indicate whether `func`
 * should be invoked on the leading and/or trailing edge of the `wait`
 * timeout. The `func` is invoked with the last arguments provided to the
 * throttled function. Subsequent calls to the throttled function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the throttled function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=true]
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // Avoid excessively updating the position while scrolling.
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
 * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
 * jQuery(element).on('click', throttled);
 *
 * // Cancel the trailing throttled invocation.
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing
  });
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = throttle;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],12:[function(require,module,exports){
var wildcard = require('wildcard');
var reMimePartSplit = /[\/\+\.]/;

/**
  # mime-match

  A simple function to checker whether a target mime type matches a mime-type
  pattern (e.g. image/jpeg matches image/jpeg OR image/*).

  ## Example Usage

  <<< example.js

**/
module.exports = function(target, pattern) {
  function test(pattern) {
    var result = wildcard(pattern, target, reMimePartSplit);

    // ensure that we have a valid mime type (should have two parts)
    return result && result.length >= 2;
  }

  return pattern ? test(pattern.split(';')[0]) : test;
};

},{"wildcard":32}],13:[function(require,module,exports){
/**
* Create an event emitter with namespaces
* @name createNamespaceEmitter
* @example
* var emitter = require('./index')()
*
* emitter.on('*', function () {
*   console.log('all events emitted', this.event)
* })
*
* emitter.on('example', function () {
*   console.log('example event emitted')
* })
*/
module.exports = function createNamespaceEmitter () {
  var emitter = {}
  var _fns = emitter._fns = {}

  /**
  * Emit an event. Optionally namespace the event. Handlers are fired in the order in which they were added with exact matches taking precedence. Separate the namespace and event with a `:`
  * @name emit
  * @param {String} event – the name of the event, with optional namespace
  * @param {...*} data – up to 6 arguments that are passed to the event listener
  * @example
  * emitter.emit('example')
  * emitter.emit('demo:test')
  * emitter.emit('data', { example: true}, 'a string', 1)
  */
  emitter.emit = function emit (event, arg1, arg2, arg3, arg4, arg5, arg6) {
    var toEmit = getListeners(event)

    if (toEmit.length) {
      emitAll(event, toEmit, [arg1, arg2, arg3, arg4, arg5, arg6])
    }
  }

  /**
  * Create en event listener.
  * @name on
  * @param {String} event
  * @param {Function} fn
  * @example
  * emitter.on('example', function () {})
  * emitter.on('demo', function () {})
  */
  emitter.on = function on (event, fn) {
    if (!_fns[event]) {
      _fns[event] = []
    }

    _fns[event].push(fn)
  }

  /**
  * Create en event listener that fires once.
  * @name once
  * @param {String} event
  * @param {Function} fn
  * @example
  * emitter.once('example', function () {})
  * emitter.once('demo', function () {})
  */
  emitter.once = function once (event, fn) {
    function one () {
      fn.apply(this, arguments)
      emitter.off(event, one)
    }
    this.on(event, one)
  }

  /**
  * Stop listening to an event. Stop all listeners on an event by only passing the event name. Stop a single listener by passing that event handler as a callback.
  * You must be explicit about what will be unsubscribed: `emitter.off('demo')` will unsubscribe an `emitter.on('demo')` listener,
  * `emitter.off('demo:example')` will unsubscribe an `emitter.on('demo:example')` listener
  * @name off
  * @param {String} event
  * @param {Function} [fn] – the specific handler
  * @example
  * emitter.off('example')
  * emitter.off('demo', function () {})
  */
  emitter.off = function off (event, fn) {
    var keep = []

    if (event && fn) {
      var fns = this._fns[event]
      var i = 0
      var l = fns ? fns.length : 0

      for (i; i < l; i++) {
        if (fns[i] !== fn) {
          keep.push(fns[i])
        }
      }
    }

    keep.length ? this._fns[event] = keep : delete this._fns[event]
  }

  function getListeners (e) {
    var out = _fns[e] ? _fns[e] : []
    var idx = e.indexOf(':')
    var args = (idx === -1) ? [e] : [e.substring(0, idx), e.substring(idx + 1)]

    var keys = Object.keys(_fns)
    var i = 0
    var l = keys.length

    for (i; i < l; i++) {
      var key = keys[i]
      if (key === '*') {
        out = out.concat(_fns[key])
      }

      if (args.length === 2 && args[0] === key) {
        out = out.concat(_fns[key])
        break
      }
    }

    return out
  }

  function emitAll (e, fns, args) {
    var i = 0
    var l = fns.length

    for (i; i < l; i++) {
      if (!fns[i]) break
      fns[i].event = e
      fns[i].apply(fns[i], args)
    }
  }

  return emitter
}

},{}],14:[function(require,module,exports){
!function() {
    'use strict';
    function h(nodeName, attributes) {
        var lastSimple, child, simple, i, children = EMPTY_CHILDREN;
        for (i = arguments.length; i-- > 2; ) stack.push(arguments[i]);
        if (attributes && null != attributes.children) {
            if (!stack.length) stack.push(attributes.children);
            delete attributes.children;
        }
        while (stack.length) if ((child = stack.pop()) && void 0 !== child.pop) for (i = child.length; i--; ) stack.push(child[i]); else {
            if ('boolean' == typeof child) child = null;
            if (simple = 'function' != typeof nodeName) if (null == child) child = ''; else if ('number' == typeof child) child = String(child); else if ('string' != typeof child) simple = !1;
            if (simple && lastSimple) children[children.length - 1] += child; else if (children === EMPTY_CHILDREN) children = [ child ]; else children.push(child);
            lastSimple = simple;
        }
        var p = new VNode();
        p.nodeName = nodeName;
        p.children = children;
        p.attributes = null == attributes ? void 0 : attributes;
        p.key = null == attributes ? void 0 : attributes.key;
        if (void 0 !== options.vnode) options.vnode(p);
        return p;
    }
    function extend(obj, props) {
        for (var i in props) obj[i] = props[i];
        return obj;
    }
    function applyRef(ref, value) {
        if (null != ref) if ('function' == typeof ref) ref(value); else ref.current = value;
    }
    function cloneElement(vnode, props) {
        return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
    }
    function enqueueRender(component) {
        if (!component.__d && (component.__d = !0) && 1 == items.push(component)) (options.debounceRendering || defer)(rerender);
    }
    function rerender() {
        var p;
        while (p = items.pop()) if (p.__d) renderComponent(p);
    }
    function isSameNodeType(node, vnode, hydrating) {
        if ('string' == typeof vnode || 'number' == typeof vnode) return void 0 !== node.splitText;
        if ('string' == typeof vnode.nodeName) return !node._componentConstructor && isNamedNode(node, vnode.nodeName); else return hydrating || node._componentConstructor === vnode.nodeName;
    }
    function isNamedNode(node, nodeName) {
        return node.__n === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
    }
    function getNodeProps(vnode) {
        var props = extend({}, vnode.attributes);
        props.children = vnode.children;
        var defaultProps = vnode.nodeName.defaultProps;
        if (void 0 !== defaultProps) for (var i in defaultProps) if (void 0 === props[i]) props[i] = defaultProps[i];
        return props;
    }
    function createNode(nodeName, isSvg) {
        var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
        node.__n = nodeName;
        return node;
    }
    function removeNode(node) {
        var parentNode = node.parentNode;
        if (parentNode) parentNode.removeChild(node);
    }
    function setAccessor(node, name, old, value, isSvg) {
        if ('className' === name) name = 'class';
        if ('key' === name) ; else if ('ref' === name) {
            applyRef(old, null);
            applyRef(value, node);
        } else if ('class' === name && !isSvg) node.className = value || ''; else if ('style' === name) {
            if (!value || 'string' == typeof value || 'string' == typeof old) node.style.cssText = value || '';
            if (value && 'object' == typeof value) {
                if ('string' != typeof old) for (var i in old) if (!(i in value)) node.style[i] = '';
                for (var i in value) node.style[i] = 'number' == typeof value[i] && !1 === IS_NON_DIMENSIONAL.test(i) ? value[i] + 'px' : value[i];
            }
        } else if ('dangerouslySetInnerHTML' === name) {
            if (value) node.innerHTML = value.__html || '';
        } else if ('o' == name[0] && 'n' == name[1]) {
            var useCapture = name !== (name = name.replace(/Capture$/, ''));
            name = name.toLowerCase().substring(2);
            if (value) {
                if (!old) node.addEventListener(name, eventProxy, useCapture);
            } else node.removeEventListener(name, eventProxy, useCapture);
            (node.__l || (node.__l = {}))[name] = value;
        } else if ('list' !== name && 'type' !== name && !isSvg && name in node) {
            try {
                node[name] = null == value ? '' : value;
            } catch (e) {}
            if ((null == value || !1 === value) && 'spellcheck' != name) node.removeAttribute(name);
        } else {
            var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
            if (null == value || !1 === value) if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase()); else node.removeAttribute(name); else if ('function' != typeof value) if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value); else node.setAttribute(name, value);
        }
    }
    function eventProxy(e) {
        return this.__l[e.type](options.event && options.event(e) || e);
    }
    function flushMounts() {
        var c;
        while (c = mounts.shift()) {
            if (options.afterMount) options.afterMount(c);
            if (c.componentDidMount) c.componentDidMount();
        }
    }
    function diff(dom, vnode, context, mountAll, parent, componentRoot) {
        if (!diffLevel++) {
            isSvgMode = null != parent && void 0 !== parent.ownerSVGElement;
            hydrating = null != dom && !('__preactattr_' in dom);
        }
        var ret = idiff(dom, vnode, context, mountAll, componentRoot);
        if (parent && ret.parentNode !== parent) parent.appendChild(ret);
        if (!--diffLevel) {
            hydrating = !1;
            if (!componentRoot) flushMounts();
        }
        return ret;
    }
    function idiff(dom, vnode, context, mountAll, componentRoot) {
        var out = dom, prevSvgMode = isSvgMode;
        if (null == vnode || 'boolean' == typeof vnode) vnode = '';
        if ('string' == typeof vnode || 'number' == typeof vnode) {
            if (dom && void 0 !== dom.splitText && dom.parentNode && (!dom._component || componentRoot)) {
                if (dom.nodeValue != vnode) dom.nodeValue = vnode;
            } else {
                out = document.createTextNode(vnode);
                if (dom) {
                    if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                    recollectNodeTree(dom, !0);
                }
            }
            out.__preactattr_ = !0;
            return out;
        }
        var vnodeName = vnode.nodeName;
        if ('function' == typeof vnodeName) return buildComponentFromVNode(dom, vnode, context, mountAll);
        isSvgMode = 'svg' === vnodeName ? !0 : 'foreignObject' === vnodeName ? !1 : isSvgMode;
        vnodeName = String(vnodeName);
        if (!dom || !isNamedNode(dom, vnodeName)) {
            out = createNode(vnodeName, isSvgMode);
            if (dom) {
                while (dom.firstChild) out.appendChild(dom.firstChild);
                if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                recollectNodeTree(dom, !0);
            }
        }
        var fc = out.firstChild, props = out.__preactattr_, vchildren = vnode.children;
        if (null == props) {
            props = out.__preactattr_ = {};
            for (var a = out.attributes, i = a.length; i--; ) props[a[i].name] = a[i].value;
        }
        if (!hydrating && vchildren && 1 === vchildren.length && 'string' == typeof vchildren[0] && null != fc && void 0 !== fc.splitText && null == fc.nextSibling) {
            if (fc.nodeValue != vchildren[0]) fc.nodeValue = vchildren[0];
        } else if (vchildren && vchildren.length || null != fc) innerDiffNode(out, vchildren, context, mountAll, hydrating || null != props.dangerouslySetInnerHTML);
        diffAttributes(out, vnode.attributes, props);
        isSvgMode = prevSvgMode;
        return out;
    }
    function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
        var j, c, f, vchild, child, originalChildren = dom.childNodes, children = [], keyed = {}, keyedLen = 0, min = 0, len = originalChildren.length, childrenLen = 0, vlen = vchildren ? vchildren.length : 0;
        if (0 !== len) for (var i = 0; i < len; i++) {
            var _child = originalChildren[i], props = _child.__preactattr_, key = vlen && props ? _child._component ? _child._component.__k : props.key : null;
            if (null != key) {
                keyedLen++;
                keyed[key] = _child;
            } else if (props || (void 0 !== _child.splitText ? isHydrating ? _child.nodeValue.trim() : !0 : isHydrating)) children[childrenLen++] = _child;
        }
        if (0 !== vlen) for (var i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            var key = vchild.key;
            if (null != key) {
                if (keyedLen && void 0 !== keyed[key]) {
                    child = keyed[key];
                    keyed[key] = void 0;
                    keyedLen--;
                }
            } else if (min < childrenLen) for (j = min; j < childrenLen; j++) if (void 0 !== children[j] && isSameNodeType(c = children[j], vchild, isHydrating)) {
                child = c;
                children[j] = void 0;
                if (j === childrenLen - 1) childrenLen--;
                if (j === min) min++;
                break;
            }
            child = idiff(child, vchild, context, mountAll);
            f = originalChildren[i];
            if (child && child !== dom && child !== f) if (null == f) dom.appendChild(child); else if (child === f.nextSibling) removeNode(f); else dom.insertBefore(child, f);
        }
        if (keyedLen) for (var i in keyed) if (void 0 !== keyed[i]) recollectNodeTree(keyed[i], !1);
        while (min <= childrenLen) if (void 0 !== (child = children[childrenLen--])) recollectNodeTree(child, !1);
    }
    function recollectNodeTree(node, unmountOnly) {
        var component = node._component;
        if (component) unmountComponent(component); else {
            if (null != node.__preactattr_) applyRef(node.__preactattr_.ref, null);
            if (!1 === unmountOnly || null == node.__preactattr_) removeNode(node);
            removeChildren(node);
        }
    }
    function removeChildren(node) {
        node = node.lastChild;
        while (node) {
            var next = node.previousSibling;
            recollectNodeTree(node, !0);
            node = next;
        }
    }
    function diffAttributes(dom, attrs, old) {
        var name;
        for (name in old) if ((!attrs || null == attrs[name]) && null != old[name]) setAccessor(dom, name, old[name], old[name] = void 0, isSvgMode);
        for (name in attrs) if (!('children' === name || 'innerHTML' === name || name in old && attrs[name] === ('value' === name || 'checked' === name ? dom[name] : old[name]))) setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    }
    function createComponent(Ctor, props, context) {
        var inst, i = recyclerComponents.length;
        if (Ctor.prototype && Ctor.prototype.render) {
            inst = new Ctor(props, context);
            Component.call(inst, props, context);
        } else {
            inst = new Component(props, context);
            inst.constructor = Ctor;
            inst.render = doRender;
        }
        while (i--) if (recyclerComponents[i].constructor === Ctor) {
            inst.__b = recyclerComponents[i].__b;
            recyclerComponents.splice(i, 1);
            return inst;
        }
        return inst;
    }
    function doRender(props, state, context) {
        return this.constructor(props, context);
    }
    function setComponentProps(component, props, renderMode, context, mountAll) {
        if (!component.__x) {
            component.__x = !0;
            component.__r = props.ref;
            component.__k = props.key;
            delete props.ref;
            delete props.key;
            if (void 0 === component.constructor.getDerivedStateFromProps) if (!component.base || mountAll) {
                if (component.componentWillMount) component.componentWillMount();
            } else if (component.componentWillReceiveProps) component.componentWillReceiveProps(props, context);
            if (context && context !== component.context) {
                if (!component.__c) component.__c = component.context;
                component.context = context;
            }
            if (!component.__p) component.__p = component.props;
            component.props = props;
            component.__x = !1;
            if (0 !== renderMode) if (1 === renderMode || !1 !== options.syncComponentUpdates || !component.base) renderComponent(component, 1, mountAll); else enqueueRender(component);
            applyRef(component.__r, component);
        }
    }
    function renderComponent(component, renderMode, mountAll, isChild) {
        if (!component.__x) {
            var rendered, inst, cbase, props = component.props, state = component.state, context = component.context, previousProps = component.__p || props, previousState = component.__s || state, previousContext = component.__c || context, isUpdate = component.base, nextBase = component.__b, initialBase = isUpdate || nextBase, initialChildComponent = component._component, skip = !1, snapshot = previousContext;
            if (component.constructor.getDerivedStateFromProps) {
                state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
                component.state = state;
            }
            if (isUpdate) {
                component.props = previousProps;
                component.state = previousState;
                component.context = previousContext;
                if (2 !== renderMode && component.shouldComponentUpdate && !1 === component.shouldComponentUpdate(props, state, context)) skip = !0; else if (component.componentWillUpdate) component.componentWillUpdate(props, state, context);
                component.props = props;
                component.state = state;
                component.context = context;
            }
            component.__p = component.__s = component.__c = component.__b = null;
            component.__d = !1;
            if (!skip) {
                rendered = component.render(props, state, context);
                if (component.getChildContext) context = extend(extend({}, context), component.getChildContext());
                if (isUpdate && component.getSnapshotBeforeUpdate) snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
                var toUnmount, base, childComponent = rendered && rendered.nodeName;
                if ('function' == typeof childComponent) {
                    var childProps = getNodeProps(rendered);
                    inst = initialChildComponent;
                    if (inst && inst.constructor === childComponent && childProps.key == inst.__k) setComponentProps(inst, childProps, 1, context, !1); else {
                        toUnmount = inst;
                        component._component = inst = createComponent(childComponent, childProps, context);
                        inst.__b = inst.__b || nextBase;
                        inst.__u = component;
                        setComponentProps(inst, childProps, 0, context, !1);
                        renderComponent(inst, 1, mountAll, !0);
                    }
                    base = inst.base;
                } else {
                    cbase = initialBase;
                    toUnmount = initialChildComponent;
                    if (toUnmount) cbase = component._component = null;
                    if (initialBase || 1 === renderMode) {
                        if (cbase) cbase._component = null;
                        base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, !0);
                    }
                }
                if (initialBase && base !== initialBase && inst !== initialChildComponent) {
                    var baseParent = initialBase.parentNode;
                    if (baseParent && base !== baseParent) {
                        baseParent.replaceChild(base, initialBase);
                        if (!toUnmount) {
                            initialBase._component = null;
                            recollectNodeTree(initialBase, !1);
                        }
                    }
                }
                if (toUnmount) unmountComponent(toUnmount);
                component.base = base;
                if (base && !isChild) {
                    var componentRef = component, t = component;
                    while (t = t.__u) (componentRef = t).base = base;
                    base._component = componentRef;
                    base._componentConstructor = componentRef.constructor;
                }
            }
            if (!isUpdate || mountAll) mounts.push(component); else if (!skip) {
                if (component.componentDidUpdate) component.componentDidUpdate(previousProps, previousState, snapshot);
                if (options.afterUpdate) options.afterUpdate(component);
            }
            while (component.__h.length) component.__h.pop().call(component);
            if (!diffLevel && !isChild) flushMounts();
        }
    }
    function buildComponentFromVNode(dom, vnode, context, mountAll) {
        var c = dom && dom._component, originalComponent = c, oldDom = dom, isDirectOwner = c && dom._componentConstructor === vnode.nodeName, isOwner = isDirectOwner, props = getNodeProps(vnode);
        while (c && !isOwner && (c = c.__u)) isOwner = c.constructor === vnode.nodeName;
        if (c && isOwner && (!mountAll || c._component)) {
            setComponentProps(c, props, 3, context, mountAll);
            dom = c.base;
        } else {
            if (originalComponent && !isDirectOwner) {
                unmountComponent(originalComponent);
                dom = oldDom = null;
            }
            c = createComponent(vnode.nodeName, props, context);
            if (dom && !c.__b) {
                c.__b = dom;
                oldDom = null;
            }
            setComponentProps(c, props, 1, context, mountAll);
            dom = c.base;
            if (oldDom && dom !== oldDom) {
                oldDom._component = null;
                recollectNodeTree(oldDom, !1);
            }
        }
        return dom;
    }
    function unmountComponent(component) {
        if (options.beforeUnmount) options.beforeUnmount(component);
        var base = component.base;
        component.__x = !0;
        if (component.componentWillUnmount) component.componentWillUnmount();
        component.base = null;
        var inner = component._component;
        if (inner) unmountComponent(inner); else if (base) {
            if (null != base.__preactattr_) applyRef(base.__preactattr_.ref, null);
            component.__b = base;
            removeNode(base);
            recyclerComponents.push(component);
            removeChildren(base);
        }
        applyRef(component.__r, null);
    }
    function Component(props, context) {
        this.__d = !0;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
        this.__h = [];
    }
    function render(vnode, parent, merge) {
        return diff(merge, vnode, {}, !1, parent, !1);
    }
    function createRef() {
        return {};
    }
    var VNode = function() {};
    var options = {};
    var stack = [];
    var EMPTY_CHILDREN = [];
    var defer = 'function' == typeof Promise ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
    var items = [];
    var mounts = [];
    var diffLevel = 0;
    var isSvgMode = !1;
    var hydrating = !1;
    var recyclerComponents = [];
    extend(Component.prototype, {
        setState: function(state, callback) {
            if (!this.__s) this.__s = this.state;
            this.state = extend(extend({}, this.state), 'function' == typeof state ? state(this.state, this.props) : state);
            if (callback) this.__h.push(callback);
            enqueueRender(this);
        },
        forceUpdate: function(callback) {
            if (callback) this.__h.push(callback);
            renderComponent(this, 2);
        },
        render: function() {}
    });
    var preact = {
        h: h,
        createElement: h,
        cloneElement: cloneElement,
        createRef: createRef,
        Component: Component,
        render: render,
        rerender: rerender,
        options: options
    };
    if ('undefined' != typeof module) module.exports = preact; else self.preact = preact;
}();

},{}],15:[function(require,module,exports){
module.exports = prettierBytes

function prettierBytes (num) {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new TypeError('Expected a number, got ' + typeof num)
  }

  var neg = num < 0
  var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (neg) {
    num = -num
  }

  if (num < 1) {
    return (neg ? '-' : '') + num + ' B'
  }

  var exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
  num = Number(num / Math.pow(1000, exponent))
  var unit = units[exponent]

  if (num >= 10 || num % 1 === 0) {
    // Do not show decimals when the number is two-digit, or if the number has no
    // decimal component.
    return (neg ? '-' : '') + num.toFixed(0) + ' ' + unit
  } else {
    return (neg ? '-' : '') + num.toFixed(1) + ' ' + unit
  }
}

},{}],16:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , undef;

/**
 * Decode a URI encoded string.
 *
 * @param {String} input The URI encoded string.
 * @returns {String|Null} The decoded string.
 * @api private
 */
function decode(input) {
  try {
    return decodeURIComponent(input.replace(/\+/g, ' '));
  } catch (e) {
    return null;
  }
}

/**
 * Attempts to encode a given input.
 *
 * @param {String} input The string that needs to be encoded.
 * @returns {String|Null} The encoded string.
 * @api private
 */
function encode(input) {
  try {
    return encodeURIComponent(input);
  } catch (e) {
    return null;
  }
}

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?&]+)=?([^&]*)/g
    , result = {}
    , part;

  while (part = parser.exec(query)) {
    var key = decode(part[1])
      , value = decode(part[2]);

    //
    // Prevent overriding of existing properties. This ensures that build-in
    // methods like `toString` or __proto__ are not overriden by malicious
    // querystrings.
    //
    // In the case if failed decoding, we want to omit the key/value pairs
    // from the result.
    //
    if (key === null || value === null || key in result) continue;
    result[key] = value;
  }

  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';

  var pairs = []
    , value
    , key;

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';

  for (key in obj) {
    if (has.call(obj, key)) {
      value = obj[key];

      //
      // Edge cases where we actually want to encode the value to an empty
      // string instead of the stringified value.
      //
      if (!value && (value === null || value === undef || isNaN(value))) {
        value = '';
      }

      key = encodeURIComponent(key);
      value = encodeURIComponent(value);

      //
      // If we failed to encode the strings, we should bail out as we don't
      // want to add invalid strings to the query.
      //
      if (key === null || value === null) continue;
      pairs.push(key +'='+ value);
    }
  }

  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
exports.stringify = querystringify;
exports.parse = querystring;

},{}],17:[function(require,module,exports){
'use strict';

/**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
module.exports = function required(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;

  if (!port) return false;

  switch (protocol) {
    case 'http':
    case 'ws':
    return port !== 80;

    case 'https':
    case 'wss':
    return port !== 443;

    case 'ftp':
    return port !== 21;

    case 'gopher':
    return port !== 70;

    case 'file':
    return false;
  }

  return port !== 0;
};

},{}],18:[function(require,module,exports){
(function (process){
module.exports = runParallel

function runParallel (tasks, cb) {
  var results, pending, keys
  var isSync = true

  if (Array.isArray(tasks)) {
    results = []
    pending = tasks.length
  } else {
    keys = Object.keys(tasks)
    results = {}
    pending = keys.length
  }

  function done (err) {
    function end () {
      if (cb) cb(err, results)
      cb = null
    }
    if (isSync) process.nextTick(end)
    else end()
  }

  function each (i, err, result) {
    results[i] = result
    if (--pending === 0 || err) {
      done(err)
    }
  }

  if (!pending) {
    // empty
    done(null)
  } else if (keys) {
    // object
    keys.forEach(function (key) {
      tasks[key](function (err, result) { each(key, err, result) })
    })
  } else {
    // array
    tasks.forEach(function (task, i) {
      task(function (err, result) { each(i, err, result) })
    })
  }

  isSync = false
}

}).call(this,require('_process'))

},{"_process":59}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isCordova = function isCordova() {
  return typeof window != "undefined" && (typeof window.PhoneGap != "undefined" || typeof window.Cordova != "undefined" || typeof window.cordova != "undefined");
};

exports.default = isCordova;
},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";

exports.default = isReactNative;
},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * readAsByteArray converts a File object to a Uint8Array.
 * This function is only used on the Apache Cordova platform.
 * See https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#read-a-file
 */
function readAsByteArray(chunk, callback) {
  var reader = new FileReader();
  reader.onload = function () {
    callback(null, new Uint8Array(reader.result));
  };
  reader.onerror = function (err) {
    callback(err);
  };
  reader.readAsArrayBuffer(chunk);
}

exports.default = readAsByteArray;
},{}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.newRequest = newRequest;
exports.resolveUrl = resolveUrl;

var _urlParse = require("url-parse");

var _urlParse2 = _interopRequireDefault(_urlParse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function newRequest() {
  return new window.XMLHttpRequest();
} /* global window */
function resolveUrl(origin, link) {
  return new _urlParse2.default(link, origin).toString();
}
},{"url-parse":30}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getSource = getSource;

var _isReactNative = require("./isReactNative");

var _isReactNative2 = _interopRequireDefault(_isReactNative);

var _uriToBlob = require("./uriToBlob");

var _uriToBlob2 = _interopRequireDefault(_uriToBlob);

var _isCordova = require("./isCordova");

var _isCordova2 = _interopRequireDefault(_isCordova);

var _readAsByteArray = require("./readAsByteArray");

var _readAsByteArray2 = _interopRequireDefault(_readAsByteArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FileSource = function () {
  function FileSource(file) {
    _classCallCheck(this, FileSource);

    this._file = file;
    this.size = file.size;
  }

  _createClass(FileSource, [{
    key: "slice",
    value: function slice(start, end, callback) {
      // In Apache Cordova applications, a File must be resolved using
      // FileReader instances, see
      // https://cordova.apache.org/docs/en/8.x/reference/cordova-plugin-file/index.html#read-a-file
      if ((0, _isCordova2.default)()) {
        (0, _readAsByteArray2.default)(this._file.slice(start, end), function (err, chunk) {
          if (err) return callback(err);

          callback(null, chunk);
        });
        return;
      }

      callback(null, this._file.slice(start, end));
    }
  }, {
    key: "close",
    value: function close() {}
  }]);

  return FileSource;
}();

var StreamSource = function () {
  function StreamSource(reader, chunkSize) {
    _classCallCheck(this, StreamSource);

    this._chunkSize = chunkSize;
    this._buffer = undefined;
    this._bufferOffset = 0;
    this._reader = reader;
    this._done = false;
  }

  _createClass(StreamSource, [{
    key: "slice",
    value: function slice(start, end, callback) {
      if (start < this._bufferOffset) {
        callback(new Error("Requested data is before the reader's current offset"));
        return;
      }

      return this._readUntilEnoughDataOrDone(start, end, callback);
    }
  }, {
    key: "_readUntilEnoughDataOrDone",
    value: function _readUntilEnoughDataOrDone(start, end, callback) {
      var _this = this;

      var hasEnoughData = end <= this._bufferOffset + len(this._buffer);
      if (this._done || hasEnoughData) {
        var value = this._getDataFromBuffer(start, end);
        callback(null, value, value == null ? this._done : false);
        return;
      }
      this._reader.read().then(function (_ref) {
        var value = _ref.value,
            done = _ref.done;

        if (done) {
          _this._done = true;
        } else if (_this._buffer === undefined) {
          _this._buffer = value;
        } else {
          _this._buffer = concat(_this._buffer, value);
        }

        _this._readUntilEnoughDataOrDone(start, end, callback);
      }).catch(function (err) {
        callback(new Error("Error during read: " + err));
      });
    }
  }, {
    key: "_getDataFromBuffer",
    value: function _getDataFromBuffer(start, end) {
      // Remove data from buffer before `start`.
      // Data might be reread from the buffer if an upload fails, so we can only
      // safely delete data when it comes *before* what is currently being read.
      if (start > this._bufferOffset) {
        this._buffer = this._buffer.slice(start - this._bufferOffset);
        this._bufferOffset = start;
      }
      // If the buffer is empty after removing old data, all data has been read.
      var hasAllDataBeenRead = len(this._buffer) === 0;
      if (this._done && hasAllDataBeenRead) {
        return null;
      }
      // We already removed data before `start`, so we just return the first
      // chunk from the buffer.
      return this._buffer.slice(0, end - start);
    }
  }, {
    key: "close",
    value: function close() {
      if (this._reader.cancel) {
        this._reader.cancel();
      }
    }
  }]);

  return StreamSource;
}();

function len(blobOrArray) {
  if (blobOrArray === undefined) return 0;
  if (blobOrArray.size !== undefined) return blobOrArray.size;
  return blobOrArray.length;
}

/*
  Typed arrays and blobs don't have a concat method.
  This function helps StreamSource accumulate data to reach chunkSize.
*/
function concat(a, b) {
  if (a.concat) {
    // Is `a` an Array?
    return a.concat(b);
  }
  if (a instanceof Blob) {
    return new Blob([a, b], { type: a.type });
  }
  if (a.set) {
    // Is `a` a typed array?
    var c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
  }
  throw new Error("Unknown data type");
}

function getSource(input, chunkSize, callback) {
  // In React Native, when user selects a file, instead of a File or Blob,
  // you usually get a file object {} with a uri property that contains
  // a local path to the file. We use XMLHttpRequest to fetch
  // the file blob, before uploading with tus.
  // TODO: The __tus__forceReactNative property is currently used to force
  // a React Native environment during testing. This should be removed
  // once we move away from PhantomJS and can overwrite navigator.product
  // properly.
  if ((_isReactNative2.default || window.__tus__forceReactNative) && input && typeof input.uri !== "undefined") {
    (0, _uriToBlob2.default)(input.uri, function (err, blob) {
      if (err) {
        return callback(new Error("tus: cannot fetch `file.uri` as Blob, make sure the uri is correct and accessible. " + err));
      }
      callback(null, new FileSource(blob));
    });
    return;
  }

  // Since we emulate the Blob type in our tests (not all target browsers
  // support it), we cannot use `instanceof` for testing whether the input value
  // can be handled. Instead, we simply check is the slice() function and the
  // size property are available.
  if (typeof input.slice === "function" && typeof input.size !== "undefined") {
    callback(null, new FileSource(input));
    return;
  }

  if (typeof input.read === "function") {
    chunkSize = +chunkSize;
    if (!isFinite(chunkSize)) {
      callback(new Error("cannot create source for stream without a finite value for the `chunkSize` option"));
      return;
    }
    callback(null, new StreamSource(input, chunkSize));
    return;
  }

  callback(new Error("source object may only be an instance of File, Blob, or Reader in this environment"));
}
},{"./isCordova":19,"./isReactNative":20,"./readAsByteArray":21,"./uriToBlob":25}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getStorage = getStorage;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* global window, localStorage */

var hasStorage = false;
try {
  hasStorage = "localStorage" in window;

  // Attempt to store and read entries from the local storage to detect Private
  // Mode on Safari on iOS (see #49)
  var key = "tusSupport";
  localStorage.setItem(key, localStorage.getItem(key));
} catch (e) {
  // If we try to access localStorage inside a sandboxed iframe, a SecurityError
  // is thrown. When in private mode on iOS Safari, a QuotaExceededError is
  // thrown (see #49)
  if (e.code === e.SECURITY_ERR || e.code === e.QUOTA_EXCEEDED_ERR) {
    hasStorage = false;
  } else {
    throw e;
  }
}

var canStoreURLs = exports.canStoreURLs = hasStorage;

var LocalStorage = function () {
  function LocalStorage() {
    _classCallCheck(this, LocalStorage);
  }

  _createClass(LocalStorage, [{
    key: "setItem",
    value: function setItem(key, value, cb) {
      if (!hasStorage) return cb();
      cb(null, localStorage.setItem(key, value));
    }
  }, {
    key: "getItem",
    value: function getItem(key, cb) {
      if (!hasStorage) return cb();
      cb(null, localStorage.getItem(key));
    }
  }, {
    key: "removeItem",
    value: function removeItem(key, cb) {
      if (!hasStorage) return cb();
      cb(null, localStorage.removeItem(key));
    }
  }]);

  return LocalStorage;
}();

function getStorage() {
  return new LocalStorage();
}
},{}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * uriToBlob resolves a URI to a Blob object. This is used for
 * React Native to retrieve a file (identified by a file://
 * URI) as a blob.
 */
function uriToBlob(uri, done) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.onload = function () {
    var blob = xhr.response;
    done(null, blob);
  };
  xhr.onerror = function (err) {
    done(err);
  };
  xhr.open("GET", uri);
  xhr.send();
}

exports.default = uriToBlob;
},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DetailedError = function (_Error) {
  _inherits(DetailedError, _Error);

  function DetailedError(error) {
    var causingErr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var xhr = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, DetailedError);

    var _this = _possibleConstructorReturn(this, (DetailedError.__proto__ || Object.getPrototypeOf(DetailedError)).call(this, error.message));

    _this.originalRequest = xhr;
    _this.causingError = causingErr;

    var message = error.message;
    if (causingErr != null) {
      message += ", caused by " + causingErr.toString();
    }
    if (xhr != null) {
      message += ", originated from request (response code: " + xhr.status + ", response text: " + xhr.responseText + ")";
    }
    _this.message = message;
    return _this;
  }

  return DetailedError;
}(Error);

exports.default = DetailedError;
},{}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fingerprint;

var _isReactNative = require("./node/isReactNative");

var _isReactNative2 = _interopRequireDefault(_isReactNative);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @return {String}
 */
function fingerprint(file, options) {
  if (_isReactNative2.default) {
    return reactNativeFingerprint(file, options);
  }

  return ["tus", file.name, file.type, file.size, file.lastModified, options.endpoint].join("-");
}

function reactNativeFingerprint(file, options) {
  var exifHash = file.exif ? hashCode(JSON.stringify(file.exif)) : "noexif";
  return ["tus", file.name || "noname", file.size || "nosize", exifHash, options.endpoint].join("/");
}

function hashCode(str) {
  // from https://stackoverflow.com/a/8831937/151666
  var hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
},{"./node/isReactNative":20}],28:[function(require,module,exports){
"use strict";

var _upload = require("./upload");

var _upload2 = _interopRequireDefault(_upload);

var _storage = require("./node/storage");

var storage = _interopRequireWildcard(_storage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global window */
var defaultOptions = _upload2.default.defaultOptions;


var moduleExport = {
  Upload: _upload2.default,
  canStoreURLs: storage.canStoreURLs,
  defaultOptions: defaultOptions
};

if (typeof window !== "undefined") {
  // Browser environment using XMLHttpRequest
  var _window = window,
      XMLHttpRequest = _window.XMLHttpRequest,
      Blob = _window.Blob;


  moduleExport.isSupported = XMLHttpRequest && Blob && typeof Blob.prototype.slice === "function";
} else {
  // Node.js environment using http module
  moduleExport.isSupported = true;
  // make FileStorage module available as it will not be set by default.
  moduleExport.FileStorage = storage.FileStorage;
}

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
module.exports = moduleExport;
},{"./node/storage":24,"./upload":29}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global window */


// We import the files used inside the Node environment which are rewritten
// for browsers using the rules defined in the package.json


var _fingerprint = require("./fingerprint");

var _fingerprint2 = _interopRequireDefault(_fingerprint);

var _error = require("./error");

var _error2 = _interopRequireDefault(_error);

var _extend = require("extend");

var _extend2 = _interopRequireDefault(_extend);

var _jsBase = require("js-base64");

var _request = require("./node/request");

var _source = require("./node/source");

var _storage = require("./node/storage");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultOptions = {
  endpoint: null,
  fingerprint: _fingerprint2.default,
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false,
  uploadUrl: null,
  uploadSize: null,
  overridePatchMethod: false,
  retryDelays: null,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  urlStorage: null
};

var Upload = function () {
  function Upload(file, options) {
    _classCallCheck(this, Upload);

    this.options = (0, _extend2.default)(true, {}, defaultOptions, options);

    // The storage module used to store URLs
    this._storage = this.options.urlStorage;

    // The underlying File/Blob object
    this.file = file;

    // The URL against which the file will be uploaded
    this.url = null;

    // The underlying XHR object for the current PATCH request
    this._xhr = null;

    // The fingerpinrt for the current file (set after start())
    this._fingerprint = null;

    // The offset used in the current PATCH request
    this._offset = null;

    // True if the current PATCH request has been aborted
    this._aborted = false;

    // The file's size in bytes
    this._size = null;

    // The Source object which will wrap around the given file and provides us
    // with a unified interface for getting its size and slice chunks from its
    // content allowing us to easily handle Files, Blobs, Buffers and Streams.
    this._source = null;

    // The current count of attempts which have been made. Null indicates none.
    this._retryAttempt = 0;

    // The timeout's ID which is used to delay the next retry
    this._retryTimeout = null;

    // The offset of the remote upload before the latest attempt was started.
    this._offsetBeforeRetry = 0;
  }

  _createClass(Upload, [{
    key: "start",
    value: function start() {
      var _this = this;

      var file = this.file;

      if (!file) {
        this._emitError(new Error("tus: no file or stream to upload provided"));
        return;
      }

      if (!this.options.endpoint && !this.options.uploadUrl) {
        this._emitError(new Error("tus: neither an endpoint or an upload URL is provided"));
        return;
      }

      if (this.options.resume && this._storage == null) {
        this._storage = (0, _storage.getStorage)();
      }

      if (this._source) {
        this._start(this._source);
      } else {
        (0, _source.getSource)(file, this.options.chunkSize, function (err, source) {
          if (err) {
            _this._emitError(err);
            return;
          }

          _this._source = source;
          _this._start(source);
        });
      }
    }
  }, {
    key: "_start",
    value: function _start(source) {
      var _this2 = this;

      var file = this.file;

      // First, we look at the uploadLengthDeferred option.
      // Next, we check if the caller has supplied a manual upload size.
      // Finally, we try to use the calculated size from the source object.
      if (this.options.uploadLengthDeferred) {
        this._size = null;
      } else if (this.options.uploadSize != null) {
        this._size = +this.options.uploadSize;
        if (isNaN(this._size)) {
          this._emitError(new Error("tus: cannot convert `uploadSize` option into a number"));
          return;
        }
      } else {
        this._size = source.size;
        if (this._size == null) {
          this._emitError(new Error("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option"));
          return;
        }
      }

      var retryDelays = this.options.retryDelays;
      if (retryDelays != null) {
        if (Object.prototype.toString.call(retryDelays) !== "[object Array]") {
          this._emitError(new Error("tus: the `retryDelays` option must either be an array or null"));
          return;
        } else {
          var errorCallback = this.options.onError;
          this.options.onError = function (err) {
            // Restore the original error callback which may have been set.
            _this2.options.onError = errorCallback;

            // We will reset the attempt counter if
            // - we were already able to connect to the server (offset != null) and
            // - we were able to upload a small chunk of data to the server
            var shouldResetDelays = _this2._offset != null && _this2._offset > _this2._offsetBeforeRetry;
            if (shouldResetDelays) {
              _this2._retryAttempt = 0;
            }

            var isOnline = true;
            if (typeof window !== "undefined" && "navigator" in window && window.navigator.onLine === false) {
              isOnline = false;
            }

            // We only attempt a retry if
            // - we didn't exceed the maxium number of retries, yet, and
            // - this error was caused by a request or it's response and
            // - the error is server error (i.e. no a status 4xx or a 409 or 423) and
            // - the browser does not indicate that we are offline
            var status = err.originalRequest ? err.originalRequest.status : 0;
            var isServerError = !inStatusCategory(status, 400) || status === 409 || status === 423;
            var shouldRetry = _this2._retryAttempt < retryDelays.length && err.originalRequest != null && isServerError && isOnline;

            if (!shouldRetry) {
              _this2._emitError(err);
              return;
            }

            var delay = retryDelays[_this2._retryAttempt++];

            _this2._offsetBeforeRetry = _this2._offset;
            _this2.options.uploadUrl = _this2.url;

            _this2._retryTimeout = setTimeout(function () {
              _this2.start();
            }, delay);
          };
        }
      }

      // Reset the aborted flag when the upload is started or else the
      // _startUpload will stop before sending a request if the upload has been
      // aborted previously.
      this._aborted = false;

      // The upload had been started previously and we should reuse this URL.
      if (this.url != null) {
        this._resumeUpload();
        return;
      }

      // A URL has manually been specified, so we try to resume
      if (this.options.uploadUrl != null) {
        this.url = this.options.uploadUrl;
        this._resumeUpload();
        return;
      }

      // Try to find the endpoint for the file in the storage
      if (this._hasStorage()) {
        this._fingerprint = this.options.fingerprint(file, this.options);
        this._storage.getItem(this._fingerprint, function (err, resumedUrl) {
          if (err) {
            _this2._emitError(err);
            return;
          }

          if (resumedUrl != null) {
            _this2.url = resumedUrl;
            _this2._resumeUpload();
          } else {
            _this2._createUpload();
          }
        });
      } else {
        // An upload has not started for the file yet, so we start a new one
        this._createUpload();
      }
    }
  }, {
    key: "abort",
    value: function abort() {
      if (this._xhr !== null) {
        this._xhr.abort();
        this._source.close();
      }
      this._aborted = true;

      if (this._retryTimeout != null) {
        clearTimeout(this._retryTimeout);
        this._retryTimeout = null;
      }
    }
  }, {
    key: "_hasStorage",
    value: function _hasStorage() {
      return this.options.resume && this._storage;
    }
  }, {
    key: "_emitXhrError",
    value: function _emitXhrError(xhr, err, causingErr) {
      this._emitError(new _error2.default(err, causingErr, xhr));
    }
  }, {
    key: "_emitError",
    value: function _emitError(err) {
      if (typeof this.options.onError === "function") {
        this.options.onError(err);
      } else {
        throw err;
      }
    }
  }, {
    key: "_emitSuccess",
    value: function _emitSuccess() {
      if (typeof this.options.onSuccess === "function") {
        this.options.onSuccess();
      }
    }

    /**
     * Publishes notification when data has been sent to the server. This
     * data may not have been accepted by the server yet.
     * @param  {number} bytesSent  Number of bytes sent to the server.
     * @param  {number} bytesTotal Total number of bytes to be sent to the server.
     */

  }, {
    key: "_emitProgress",
    value: function _emitProgress(bytesSent, bytesTotal) {
      if (typeof this.options.onProgress === "function") {
        this.options.onProgress(bytesSent, bytesTotal);
      }
    }

    /**
     * Publishes notification when a chunk of data has been sent to the server
     * and accepted by the server.
     * @param  {number} chunkSize  Size of the chunk that was accepted by the
     *                             server.
     * @param  {number} bytesAccepted Total number of bytes that have been
     *                                accepted by the server.
     * @param  {number} bytesTotal Total number of bytes to be sent to the server.
     */

  }, {
    key: "_emitChunkComplete",
    value: function _emitChunkComplete(chunkSize, bytesAccepted, bytesTotal) {
      if (typeof this.options.onChunkComplete === "function") {
        this.options.onChunkComplete(chunkSize, bytesAccepted, bytesTotal);
      }
    }

    /**
     * Set the headers used in the request and the withCredentials property
     * as defined in the options
     *
     * @param {XMLHttpRequest} xhr
     */

  }, {
    key: "_setupXHR",
    value: function _setupXHR(xhr) {
      this._xhr = xhr;

      xhr.setRequestHeader("Tus-Resumable", "1.0.0");
      var headers = this.options.headers;

      for (var name in headers) {
        xhr.setRequestHeader(name, headers[name]);
      }

      xhr.withCredentials = this.options.withCredentials;
    }

    /**
     * Create a new upload using the creation extension by sending a POST
     * request to the endpoint. After successful creation the file will be
     * uploaded
     *
     * @api private
     */

  }, {
    key: "_createUpload",
    value: function _createUpload() {
      var _this3 = this;

      if (!this.options.endpoint) {
        this._emitError(new Error("tus: unable to create upload because no endpoint is provided"));
        return;
      }

      var xhr = (0, _request.newRequest)();
      xhr.open("POST", this.options.endpoint, true);

      xhr.onload = function () {
        if (!inStatusCategory(xhr.status, 200)) {
          _this3._emitXhrError(xhr, new Error("tus: unexpected response while creating upload"));
          return;
        }

        var location = xhr.getResponseHeader("Location");
        if (location == null) {
          _this3._emitXhrError(xhr, new Error("tus: invalid or missing Location header"));
          return;
        }

        _this3.url = (0, _request.resolveUrl)(_this3.options.endpoint, location);

        if (_this3._size === 0) {
          // Nothing to upload and file was successfully created
          _this3._emitSuccess();
          _this3._source.close();
          return;
        }

        if (_this3._hasStorage()) {
          _this3._storage.setItem(_this3._fingerprint, _this3.url, function (err) {
            if (err) {
              _this3._emitError(err);
            }
          });
        }

        _this3._offset = 0;
        _this3._startUpload();
      };

      xhr.onerror = function (err) {
        _this3._emitXhrError(xhr, new Error("tus: failed to create upload"), err);
      };

      this._setupXHR(xhr);
      if (this.options.uploadLengthDeferred) {
        xhr.setRequestHeader("Upload-Defer-Length", 1);
      } else {
        xhr.setRequestHeader("Upload-Length", this._size);
      }

      // Add metadata if values have been added
      var metadata = encodeMetadata(this.options.metadata);
      if (metadata !== "") {
        xhr.setRequestHeader("Upload-Metadata", metadata);
      }

      xhr.send(null);
    }

    /*
     * Try to resume an existing upload. First a HEAD request will be sent
     * to retrieve the offset. If the request fails a new upload will be
     * created. In the case of a successful response the file will be uploaded.
     *
     * @api private
     */

  }, {
    key: "_resumeUpload",
    value: function _resumeUpload() {
      var _this4 = this;

      var xhr = (0, _request.newRequest)();
      xhr.open("HEAD", this.url, true);

      xhr.onload = function () {
        if (!inStatusCategory(xhr.status, 200)) {
          if (_this4.options.resume && _this4._storage && inStatusCategory(xhr.status, 400)) {
            // Remove stored fingerprint and corresponding endpoint,
            // on client errors since the file can not be found
            _this4._storage.removeItem(_this4._fingerprint, function (err) {
              if (err) {
                _this4._emitError(err);
              }
            });
          }

          // If the upload is locked (indicated by the 423 Locked status code), we
          // emit an error instead of directly starting a new upload. This way the
          // retry logic can catch the error and will retry the upload. An upload
          // is usually locked for a short period of time and will be available
          // afterwards.
          if (xhr.status === 423) {
            _this4._emitXhrError(xhr, new Error("tus: upload is currently locked; retry later"));
            return;
          }

          if (!_this4.options.endpoint) {
            // Don't attempt to create a new upload if no endpoint is provided.
            _this4._emitXhrError(xhr, new Error("tus: unable to resume upload (new upload cannot be created without an endpoint)"));
            return;
          }

          // Try to create a new upload
          _this4.url = null;
          _this4._createUpload();
          return;
        }

        var offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
        if (isNaN(offset)) {
          _this4._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
          return;
        }

        var length = parseInt(xhr.getResponseHeader("Upload-Length"), 10);
        if (isNaN(length) && !_this4.options.uploadLengthDeferred) {
          _this4._emitXhrError(xhr, new Error("tus: invalid or missing length value"));
          return;
        }

        // Upload has already been completed and we do not need to send additional
        // data to the server
        if (offset === length) {
          _this4._emitProgress(length, length);
          _this4._emitSuccess();
          return;
        }

        _this4._offset = offset;
        _this4._startUpload();
      };

      xhr.onerror = function (err) {
        _this4._emitXhrError(xhr, new Error("tus: failed to resume upload"), err);
      };

      this._setupXHR(xhr);
      xhr.send(null);
    }

    /**
     * Start uploading the file using PATCH requests. The file will be divided
     * into chunks as specified in the chunkSize option. During the upload
     * the onProgress event handler may be invoked multiple times.
     *
     * @api private
     */

  }, {
    key: "_startUpload",
    value: function _startUpload() {
      var _this5 = this;

      // If the upload has been aborted, we will not send the next PATCH request.
      // This is important if the abort method was called during a callback, such
      // as onChunkComplete or onProgress.
      if (this._aborted) {
        return;
      }

      var xhr = (0, _request.newRequest)();

      // Some browser and servers may not support the PATCH method. For those
      // cases, you can tell tus-js-client to use a POST request with the
      // X-HTTP-Method-Override header for simulating a PATCH request.
      if (this.options.overridePatchMethod) {
        xhr.open("POST", this.url, true);
        xhr.setRequestHeader("X-HTTP-Method-Override", "PATCH");
      } else {
        xhr.open("PATCH", this.url, true);
      }

      xhr.onload = function () {
        if (!inStatusCategory(xhr.status, 200)) {
          _this5._emitXhrError(xhr, new Error("tus: unexpected response while uploading chunk"));
          return;
        }

        var offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
        if (isNaN(offset)) {
          _this5._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
          return;
        }

        _this5._emitProgress(offset, _this5._size);
        _this5._emitChunkComplete(offset - _this5._offset, offset, _this5._size);

        _this5._offset = offset;

        if (offset == _this5._size) {
          if (_this5.options.removeFingerprintOnSuccess && _this5.options.resume) {
            // Remove stored fingerprint and corresponding endpoint. This causes
            // new upload of the same file must be treated as a different file.
            Storage.removeItem(_this5._fingerprint);
          }

          // Yay, finally done :)
          _this5._emitSuccess();
          _this5._source.close();
          return;
        }

        _this5._startUpload();
      };

      xhr.onerror = function (err) {
        // Don't emit an error if the upload was aborted manually
        if (_this5._aborted) {
          return;
        }

        _this5._emitXhrError(xhr, new Error("tus: failed to upload chunk at offset " + _this5._offset), err);
      };

      // Test support for progress events before attaching an event listener
      if ("upload" in xhr) {
        xhr.upload.onprogress = function (e) {
          if (!e.lengthComputable) {
            return;
          }

          _this5._emitProgress(start + e.loaded, _this5._size);
        };
      }

      this._setupXHR(xhr);

      xhr.setRequestHeader("Upload-Offset", this._offset);
      xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");

      var start = this._offset;
      var end = this._offset + this.options.chunkSize;

      // The specified chunkSize may be Infinity or the calcluated end position
      // may exceed the file's size. In both cases, we limit the end position to
      // the input's total size for simpler calculations and correctness.
      if ((end === Infinity || end > this._size) && !this.options.uploadLengthDeferred) {
        end = this._size;
      }

      this._source.slice(start, end, function (err, value, complete) {
        if (err) {
          _this5._emitError(err);
          return;
        }

        if (_this5.options.uploadLengthDeferred) {
          if (complete) {
            _this5._size = _this5._offset + (value && value.size ? value.size : 0);
            xhr.setRequestHeader("Upload-Length", _this5._size);
          }
        }

        if (value === null) {
          xhr.send();
        } else {
          xhr.send(value);
          _this5._emitProgress(_this5._offset, _this5._size);
        }
      });
    }
  }]);

  return Upload;
}();

function encodeMetadata(metadata) {
  var encoded = [];

  for (var key in metadata) {
    encoded.push(key + " " + _jsBase.Base64.encode(metadata[key]));
  }

  return encoded.join(",");
}

/**
 * Checks whether a given status is in the range of the expected category.
 * For example, only a status between 200 and 299 will satisfy the category 200.
 *
 * @api private
 */
function inStatusCategory(status, category) {
  return status >= category && status < category + 100;
}

Upload.defaultOptions = defaultOptions;

exports.default = Upload;
},{"./error":26,"./fingerprint":27,"./node/request":22,"./node/source":23,"./node/storage":24,"extend":8,"js-base64":10}],30:[function(require,module,exports){
(function (global){
'use strict';

var required = require('requires-port')
  , qs = require('querystringify')
  , slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//
  , protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i
  , whitespace = '[\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\\u2029\\uFEFF]'
  , left = new RegExp('^'+ whitespace +'+');

/**
 * Trim a given string.
 *
 * @param {String} str String to trim.
 * @public
 */
function trimLeft(str) {
  return (str ? str : '').toString().replace(left, '');
}

/**
 * These are the parse rules for the URL parser, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
var rules = [
  ['#', 'hash'],                        // Extract from the back.
  ['?', 'query'],                       // Extract from the back.
  function sanitize(address) {          // Sanitize what is left of the address
    return address.replace('\\', '/');
  },
  ['/', 'pathname'],                    // Extract from the back.
  ['@', 'auth', 1],                     // Extract from the front.
  [NaN, 'host', undefined, 1, 1],       // Set left over value.
  [/:(\d+)$/, 'port', undefined, 1],    // RegExp the back.
  [NaN, 'hostname', undefined, 1, 1]    // Set left over.
];

/**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
var ignore = { hash: 1, query: 1 };

/**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @public
 */
function lolcation(loc) {
  var globalVar;

  if (typeof window !== 'undefined') globalVar = window;
  else if (typeof global !== 'undefined') globalVar = global;
  else if (typeof self !== 'undefined') globalVar = self;
  else globalVar = {};

  var location = globalVar.location || {};
  loc = loc || location;

  var finaldestination = {}
    , type = typeof loc
    , key;

  if ('blob:' === loc.protocol) {
    finaldestination = new Url(unescape(loc.pathname), {});
  } else if ('string' === type) {
    finaldestination = new Url(loc, {});
    for (key in ignore) delete finaldestination[key];
  } else if ('object' === type) {
    for (key in loc) {
      if (key in ignore) continue;
      finaldestination[key] = loc[key];
    }

    if (finaldestination.slashes === undefined) {
      finaldestination.slashes = slashes.test(loc.href);
    }
  }

  return finaldestination;
}

/**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase.
 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
 * @property {String} rest Rest of the URL that is not part of the protocol.
 */

/**
 * Extract protocol information from a URL with/without double slash ("//").
 *
 * @param {String} address URL we want to extract from.
 * @return {ProtocolExtract} Extracted information.
 * @private
 */
function extractProtocol(address) {
  address = trimLeft(address);
  var match = protocolre.exec(address);

  return {
    protocol: match[1] ? match[1].toLowerCase() : '',
    slashes: !!match[2],
    rest: match[3]
  };
}

/**
 * Resolve a relative URL pathname against a base URL pathname.
 *
 * @param {String} relative Pathname of the relative URL.
 * @param {String} base Pathname of the base URL.
 * @return {String} Resolved pathname.
 * @private
 */
function resolve(relative, base) {
  if (relative === '') return base;

  var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/'))
    , i = path.length
    , last = path[i - 1]
    , unshift = false
    , up = 0;

  while (i--) {
    if (path[i] === '.') {
      path.splice(i, 1);
    } else if (path[i] === '..') {
      path.splice(i, 1);
      up++;
    } else if (up) {
      if (i === 0) unshift = true;
      path.splice(i, 1);
      up--;
    }
  }

  if (unshift) path.unshift('');
  if (last === '.' || last === '..') path.push('');

  return path.join('/');
}

/**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * It is worth noting that we should not use `URL` as class name to prevent
 * clashes with the global URL instance that got introduced in browsers.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} [location] Location defaults for relative paths.
 * @param {Boolean|Function} [parser] Parser for the query string.
 * @private
 */
function Url(address, location, parser) {
  address = trimLeft(address);

  if (!(this instanceof Url)) {
    return new Url(address, location, parser);
  }

  var relative, extracted, parse, instruction, index, key
    , instructions = rules.slice()
    , type = typeof location
    , url = this
    , i = 0;

  //
  // The following if statements allows this module two have compatibility with
  // 2 different API:
  //
  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
  //    where the boolean indicates that the query string should also be parsed.
  //
  // 2. The `URL` interface of the browser which accepts a URL, object as
  //    arguments. The supplied object will be used as default values / fall-back
  //    for relative paths.
  //
  if ('object' !== type && 'string' !== type) {
    parser = location;
    location = null;
  }

  if (parser && 'function' !== typeof parser) parser = qs.parse;

  location = lolcation(location);

  //
  // Extract protocol information before running the instructions.
  //
  extracted = extractProtocol(address || '');
  relative = !extracted.protocol && !extracted.slashes;
  url.slashes = extracted.slashes || relative && location.slashes;
  url.protocol = extracted.protocol || location.protocol || '';
  address = extracted.rest;

  //
  // When the authority component is absent the URL starts with a path
  // component.
  //
  if (!extracted.slashes) instructions[3] = [/(.*)/, 'pathname'];

  for (; i < instructions.length; i++) {
    instruction = instructions[i];

    if (typeof instruction === 'function') {
      address = instruction(address);
      continue;
    }

    parse = instruction[0];
    key = instruction[1];

    if (parse !== parse) {
      url[key] = address;
    } else if ('string' === typeof parse) {
      if (~(index = address.indexOf(parse))) {
        if ('number' === typeof instruction[2]) {
          url[key] = address.slice(0, index);
          address = address.slice(index + instruction[2]);
        } else {
          url[key] = address.slice(index);
          address = address.slice(0, index);
        }
      }
    } else if ((index = parse.exec(address))) {
      url[key] = index[1];
      address = address.slice(0, index.index);
    }

    url[key] = url[key] || (
      relative && instruction[3] ? location[key] || '' : ''
    );

    //
    // Hostname, host and protocol should be lowercased so they can be used to
    // create a proper `origin`.
    //
    if (instruction[4]) url[key] = url[key].toLowerCase();
  }

  //
  // Also parse the supplied query string in to an object. If we're supplied
  // with a custom parser as function use that instead of the default build-in
  // parser.
  //
  if (parser) url.query = parser(url.query);

  //
  // If the URL is relative, resolve the pathname against the base URL.
  //
  if (
      relative
    && location.slashes
    && url.pathname.charAt(0) !== '/'
    && (url.pathname !== '' || location.pathname !== '')
  ) {
    url.pathname = resolve(url.pathname, location.pathname);
  }

  //
  // We should not add port numbers if they are already the default port number
  // for a given protocol. As the host also contains the port number we're going
  // override it with the hostname which contains no port number.
  //
  if (!required(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }

  //
  // Parse down the `auth` for the username and password.
  //
  url.username = url.password = '';
  if (url.auth) {
    instruction = url.auth.split(':');
    url.username = instruction[0] || '';
    url.password = instruction[1] || '';
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  //
  // The href is just the compiled result.
  //
  url.href = url.toString();
}

/**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function
 *                               used to parse the query.
 *                               When setting the protocol, double slash will be
 *                               removed from the final url if it is true.
 * @returns {URL} URL instance for chaining.
 * @public
 */
function set(part, value, fn) {
  var url = this;

  switch (part) {
    case 'query':
      if ('string' === typeof value && value.length) {
        value = (fn || qs.parse)(value);
      }

      url[part] = value;
      break;

    case 'port':
      url[part] = value;

      if (!required(value, url.protocol)) {
        url.host = url.hostname;
        url[part] = '';
      } else if (value) {
        url.host = url.hostname +':'+ value;
      }

      break;

    case 'hostname':
      url[part] = value;

      if (url.port) value += ':'+ url.port;
      url.host = value;
      break;

    case 'host':
      url[part] = value;

      if (/:\d+$/.test(value)) {
        value = value.split(':');
        url.port = value.pop();
        url.hostname = value.join(':');
      } else {
        url.hostname = value;
        url.port = '';
      }

      break;

    case 'protocol':
      url.protocol = value.toLowerCase();
      url.slashes = !fn;
      break;

    case 'pathname':
    case 'hash':
      if (value) {
        var char = part === 'pathname' ? '/' : '#';
        url[part] = value.charAt(0) !== char ? char + value : value;
      } else {
        url[part] = value;
      }
      break;

    default:
      url[part] = value;
  }

  for (var i = 0; i < rules.length; i++) {
    var ins = rules[i];

    if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  url.href = url.toString();

  return url;
}

/**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String} Compiled version of the URL.
 * @public
 */
function toString(stringify) {
  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

  var query
    , url = this
    , protocol = url.protocol;

  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

  var result = protocol + (url.slashes ? '//' : '');

  if (url.username) {
    result += url.username;
    if (url.password) result += ':'+ url.password;
    result += '@';
  }

  result += url.host + url.pathname;

  query = 'object' === typeof url.query ? stringify(url.query) : url.query;
  if (query) result += '?' !== query.charAt(0) ? '?'+ query : query;

  if (url.hash) result += url.hash;

  return result;
}

Url.prototype = { set: set, toString: toString };

//
// Expose the URL parser and some additional properties that might be useful for
// others or testing.
//
Url.extractProtocol = extractProtocol;
Url.location = lolcation;
Url.trimLeft = trimLeft;
Url.qs = qs;

module.exports = Url;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"querystringify":16,"requires-port":17}],31:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],32:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  # wildcard

  Very simple wildcard matching, which is designed to provide the same
  functionality that is found in the
  [eve](https://github.com/adobe-webplatform/eve) eventing library.

  ## Usage

  It works with strings:

  <<< examples/strings.js

  Arrays:

  <<< examples/arrays.js

  Objects (matching against keys):

  <<< examples/objects.js

  While the library works in Node, if you are are looking for file-based
  wildcard matching then you should have a look at:

  <https://github.com/isaacs/node-glob>
**/

function WildcardMatcher(text, separator) {
  this.text = text = text || '';
  this.hasWild = ~text.indexOf('*');
  this.separator = separator;
  this.parts = text.split(separator);
}

WildcardMatcher.prototype.match = function(input) {
  var matches = true;
  var parts = this.parts;
  var ii;
  var partsCount = parts.length;
  var testParts;

  if (typeof input == 'string' || input instanceof String) {
    if (!this.hasWild && this.text != input) {
      matches = false;
    } else {
      testParts = (input || '').split(this.separator);
      for (ii = 0; matches && ii < partsCount; ii++) {
        if (parts[ii] === '*')  {
          continue;
        } else if (ii < testParts.length) {
          matches = parts[ii] === testParts[ii];
        } else {
          matches = false;
        }
      }

      // If matches, then return the component parts
      matches = matches && testParts;
    }
  }
  else if (typeof input.splice == 'function') {
    matches = [];

    for (ii = input.length; ii--; ) {
      if (this.match(input[ii])) {
        matches[matches.length] = input[ii];
      }
    }
  }
  else if (typeof input == 'object') {
    matches = {};

    for (var key in input) {
      if (this.match(key)) {
        matches[key] = input[key];
      }
    }
  }

  return matches;
};

module.exports = function(text, test, separator) {
  var matcher = new WildcardMatcher(text, separator || /[\/\.]/);
  if (typeof test != 'undefined') {
    return matcher.match(test);
  }

  return matcher;
};

},{}],33:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AuthError = function (_Error) {
  _inherits(AuthError, _Error);

  function AuthError() {
    _classCallCheck(this, AuthError);

    var _this = _possibleConstructorReturn(this, _Error.call(this, 'Authorization required'));

    _this.name = 'AuthError';
    _this.isAuthError = true;
    return _this;
  }

  return AuthError;
}(Error);

module.exports = AuthError;

},{}],34:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RequestClient = require('./RequestClient');
var tokenStorage = require('./tokenStorage');

var _getName = function _getName(id) {
  return id.split('-').map(function (s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }).join(' ');
};

module.exports = function (_RequestClient) {
  _inherits(Provider, _RequestClient);

  function Provider(uppy, opts) {
    _classCallCheck(this, Provider);

    var _this = _possibleConstructorReturn(this, _RequestClient.call(this, uppy, opts));

    _this.provider = opts.provider;
    _this.id = _this.provider;
    _this.authProvider = opts.authProvider || _this.provider;
    _this.name = _this.opts.name || _getName(_this.id);
    _this.pluginId = _this.opts.pluginId;
    _this.tokenKey = 'companion-' + _this.pluginId + '-auth-token';
    return _this;
  }

  Provider.prototype.headers = function headers() {
    var _this2 = this;

    return new Promise(function (resolve, reject) {
      _RequestClient.prototype.headers.call(_this2).then(function (headers) {
        _this2.getAuthToken().then(function (token) {
          resolve(_extends({}, headers, { 'uppy-auth-token': token }));
        });
      }).catch(reject);
    });
  };

  Provider.prototype.onReceiveResponse = function onReceiveResponse(response) {
    response = _RequestClient.prototype.onReceiveResponse.call(this, response);
    var authenticated = response.status !== 401;
    this.uppy.getPlugin(this.pluginId).setPluginState({ authenticated: authenticated });
    return response;
  };

  // @todo(i.olarewaju) consider whether or not this method should be exposed


  Provider.prototype.setAuthToken = function setAuthToken(token) {
    return this.uppy.getPlugin(this.pluginId).storage.setItem(this.tokenKey, token);
  };

  Provider.prototype.getAuthToken = function getAuthToken() {
    return this.uppy.getPlugin(this.pluginId).storage.getItem(this.tokenKey);
  };

  Provider.prototype.authUrl = function authUrl() {
    return this.hostname + '/' + this.id + '/connect';
  };

  Provider.prototype.fileUrl = function fileUrl(id) {
    return this.hostname + '/' + this.id + '/get/' + id;
  };

  Provider.prototype.list = function list(directory) {
    return this.get(this.id + '/list/' + (directory || ''));
  };

  Provider.prototype.logout = function logout() {
    var _this3 = this;

    var redirect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : location.href;

    return new Promise(function (resolve, reject) {
      _this3.get(_this3.id + '/logout?redirect=' + redirect).then(function (res) {
        _this3.uppy.getPlugin(_this3.pluginId).storage.removeItem(_this3.tokenKey).then(function () {
          return resolve(res);
        }).catch(reject);
      }).catch(reject);
    });
  };

  Provider.initPlugin = function initPlugin(plugin, opts, defaultOpts) {
    plugin.type = 'acquirer';
    plugin.files = [];
    if (defaultOpts) {
      plugin.opts = _extends({}, defaultOpts, opts);
    }

    if (opts.serverUrl || opts.serverPattern) {
      throw new Error('`serverUrl` and `serverPattern` have been renamed to `companionUrl` and `companionAllowedHosts` respectively in the 0.30.5 release. Please consult the docs (for example, https://uppy.io/docs/instagram/ for the Instagram plugin) and use the updated options.`');
    }

    if (opts.companionAllowedHosts) {
      var pattern = opts.companionAllowedHosts;
      // validate companionAllowedHosts param
      if (typeof pattern !== 'string' && !Array.isArray(pattern) && !(pattern instanceof RegExp)) {
        throw new TypeError(plugin.id + ': the option "companionAllowedHosts" must be one of string, Array, RegExp');
      }
      plugin.opts.companionAllowedHosts = pattern;
    } else {
      // does not start with https://
      if (/^(?!https?:\/\/).*$/i.test(opts.companionUrl)) {
        plugin.opts.companionAllowedHosts = 'https://' + opts.companionUrl.replace(/^\/\//, '');
      } else {
        plugin.opts.companionAllowedHosts = opts.companionUrl;
      }
    }

    plugin.storage = plugin.opts.storage || tokenStorage;
  };

  return Provider;
}(RequestClient);

},{"./RequestClient":35,"./tokenStorage":38}],35:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthError = require('./AuthError');

// Remove the trailing slash so we can always safely append /xyz.
function stripSlash(url) {
  return url.replace(/\/$/, '');
}

module.exports = function () {
  function RequestClient(uppy, opts) {
    _classCallCheck(this, RequestClient);

    this.uppy = uppy;
    this.opts = opts;
    this.onReceiveResponse = this.onReceiveResponse.bind(this);
  }

  RequestClient.prototype.headers = function headers() {
    return Promise.resolve(_extends({}, this.defaultHeaders, this.opts.serverHeaders || {}));
  };

  RequestClient.prototype._getPostResponseFunc = function _getPostResponseFunc(skip) {
    var _this = this;

    return function (response) {
      if (!skip) {
        return _this.onReceiveResponse(response);
      }

      return response;
    };
  };

  RequestClient.prototype.onReceiveResponse = function onReceiveResponse(response) {
    var state = this.uppy.getState();
    var companion = state.companion || {};
    var host = this.opts.companionUrl;
    var headers = response.headers;
    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      var _extends2;

      this.uppy.setState({
        companion: _extends({}, companion, (_extends2 = {}, _extends2[host] = headers.get('i-am'), _extends2))
      });
    }
    return response;
  };

  RequestClient.prototype._getUrl = function _getUrl(url) {
    if (/^(https?:|)\/\//.test(url)) {
      return url;
    }
    return this.hostname + '/' + url;
  };

  RequestClient.prototype._json = function _json(res) {
    if (res.status === 401) {
      throw new AuthError();
    }

    if (res.status < 200 || res.status > 300) {
      throw new Error('Failed request to ' + res.url + '. ' + res.statusText);
    }
    return res.json();
  };

  RequestClient.prototype.get = function get(path, skipPostResponse) {
    var _this2 = this;

    return new Promise(function (resolve, reject) {
      _this2.headers().then(function (headers) {
        fetch(_this2._getUrl(path), {
          method: 'get',
          headers: headers,
          credentials: 'same-origin'
        }).then(_this2._getPostResponseFunc(skipPostResponse)).then(function (res) {
          return _this2._json(res).then(resolve);
        }).catch(function (err) {
          err = err.isAuthError ? err : new Error('Could not get ' + _this2._getUrl(path) + '. ' + err);
          reject(err);
        });
      });
    });
  };

  RequestClient.prototype.post = function post(path, data, skipPostResponse) {
    var _this3 = this;

    return new Promise(function (resolve, reject) {
      _this3.headers().then(function (headers) {
        fetch(_this3._getUrl(path), {
          method: 'post',
          headers: headers,
          credentials: 'same-origin',
          body: JSON.stringify(data)
        }).then(_this3._getPostResponseFunc(skipPostResponse)).then(function (res) {
          return _this3._json(res).then(resolve);
        }).catch(function (err) {
          err = err.isAuthError ? err : new Error('Could not post ' + _this3._getUrl(path) + '. ' + err);
          reject(err);
        });
      });
    });
  };

  RequestClient.prototype.delete = function _delete(path, data, skipPostResponse) {
    var _this4 = this;

    return new Promise(function (resolve, reject) {
      _this4.headers().then(function (headers) {
        fetch(_this4.hostname + '/' + path, {
          method: 'delete',
          headers: headers,
          credentials: 'same-origin',
          body: data ? JSON.stringify(data) : null
        }).then(_this4._getPostResponseFunc(skipPostResponse)).then(function (res) {
          return _this4._json(res).then(resolve);
        }).catch(function (err) {
          err = err.isAuthError ? err : new Error('Could not delete ' + _this4._getUrl(path) + '. ' + err);
          reject(err);
        });
      });
    });
  };

  _createClass(RequestClient, [{
    key: 'hostname',
    get: function get() {
      var _uppy$getState = this.uppy.getState(),
          companion = _uppy$getState.companion;

      var host = this.opts.companionUrl;
      return stripSlash(companion && companion[host] ? companion[host] : host);
    }
  }, {
    key: 'defaultHeaders',
    get: function get() {
      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
    }
  }]);

  return RequestClient;
}();

},{"./AuthError":33}],36:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ee = require('namespace-emitter');

module.exports = function () {
  function UppySocket(opts) {
    var _this = this;

    _classCallCheck(this, UppySocket);

    this.queued = [];
    this.isOpen = false;
    this.socket = new WebSocket(opts.target);
    this.emitter = ee();

    this.socket.onopen = function (e) {
      _this.isOpen = true;

      while (_this.queued.length > 0 && _this.isOpen) {
        var first = _this.queued[0];
        _this.send(first.action, first.payload);
        _this.queued = _this.queued.slice(1);
      }
    };

    this.socket.onclose = function (e) {
      _this.isOpen = false;
    };

    this._handleMessage = this._handleMessage.bind(this);

    this.socket.onmessage = this._handleMessage;

    this.close = this.close.bind(this);
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.once = this.once.bind(this);
    this.send = this.send.bind(this);
  }

  UppySocket.prototype.close = function close() {
    return this.socket.close();
  };

  UppySocket.prototype.send = function send(action, payload) {
    // attach uuid

    if (!this.isOpen) {
      this.queued.push({ action: action, payload: payload });
      return;
    }

    this.socket.send(JSON.stringify({
      action: action,
      payload: payload
    }));
  };

  UppySocket.prototype.on = function on(action, handler) {
    this.emitter.on(action, handler);
  };

  UppySocket.prototype.emit = function emit(action, payload) {
    this.emitter.emit(action, payload);
  };

  UppySocket.prototype.once = function once(action, handler) {
    this.emitter.once(action, handler);
  };

  UppySocket.prototype._handleMessage = function _handleMessage(e) {
    try {
      var message = JSON.parse(e.data);
      this.emit(message.action, message.payload);
    } catch (err) {
      console.log(err);
    }
  };

  return UppySocket;
}();

},{"namespace-emitter":13}],37:[function(require,module,exports){
'use-strict';
/**
 * Manages communications with Companion
 */

var RequestClient = require('./RequestClient');
var Provider = require('./Provider');
var Socket = require('./Socket');

module.exports = {
  RequestClient: RequestClient,
  Provider: Provider,
  Socket: Socket
};

},{"./Provider":34,"./RequestClient":35,"./Socket":36}],38:[function(require,module,exports){
'use strict';
/**
 * This module serves as an Async wrapper for LocalStorage
 */

module.exports.setItem = function (key, value) {
  return new Promise(function (resolve) {
    localStorage.setItem(key, value);
    resolve();
  });
};

module.exports.getItem = function (key) {
  return Promise.resolve(localStorage.getItem(key));
};

module.exports.removeItem = function (key) {
  return new Promise(function (resolve) {
    localStorage.removeItem(key);
    resolve();
  });
};

},{}],39:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var preact = require('preact');
var findDOMElement = require('./../../utils/lib/findDOMElement');

/**
 * Defer a frequent call to the microtask queue.
 */
function debounce(fn) {
  var calling = null;
  var latestArgs = null;
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    latestArgs = args;
    if (!calling) {
      calling = Promise.resolve().then(function () {
        calling = null;
        // At this point `args` may be different from the most
        // recent state, if multiple calls happened since this task
        // was queued. So we use the `latestArgs`, which definitely
        // is the most recent call.
        return fn.apply(undefined, latestArgs);
      });
    }
    return calling;
  };
}

/**
 * Boilerplate that all Plugins share - and should not be used
 * directly. It also shows which methods final plugins should implement/override,
 * this deciding on structure.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @return {array | string} files or success/fail message
 */
module.exports = function () {
  function Plugin(uppy, opts) {
    _classCallCheck(this, Plugin);

    this.uppy = uppy;
    this.opts = opts || {};

    this.update = this.update.bind(this);
    this.mount = this.mount.bind(this);
    this.install = this.install.bind(this);
    this.uninstall = this.uninstall.bind(this);
  }

  Plugin.prototype.getPluginState = function getPluginState() {
    var _uppy$getState = this.uppy.getState(),
        plugins = _uppy$getState.plugins;

    return plugins[this.id] || {};
  };

  Plugin.prototype.setPluginState = function setPluginState(update) {
    var _extends2;

    var _uppy$getState2 = this.uppy.getState(),
        plugins = _uppy$getState2.plugins;

    this.uppy.setState({
      plugins: _extends({}, plugins, (_extends2 = {}, _extends2[this.id] = _extends({}, plugins[this.id], update), _extends2))
    });
  };

  Plugin.prototype.update = function update(state) {
    if (typeof this.el === 'undefined') {
      return;
    }

    if (this._updateUI) {
      this._updateUI(state);
    }
  };

  /**
  * Called when plugin is mounted, whether in DOM or into another plugin.
  * Needed because sometimes plugins are mounted separately/after `install`,
  * so this.el and this.parent might not be available in `install`.
  * This is the case with @uppy/react plugins, for example.
  */


  Plugin.prototype.onMount = function onMount() {};

  /**
   * Check if supplied `target` is a DOM element or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */


  Plugin.prototype.mount = function mount(target, plugin) {
    var _this = this;

    var callerPluginName = plugin.id;

    var targetElement = findDOMElement(target);

    if (targetElement) {
      this.isTargetDOMEl = true;

      // API for plugins that require a synchronous rerender.
      this.rerender = function (state) {
        // plugin could be removed, but this.rerender is debounced below,
        // so it could still be called even after uppy.removePlugin or uppy.close
        // hence the check
        if (!_this.uppy.getPlugin(_this.id)) return;
        _this.el = preact.render(_this.render(state), targetElement, _this.el);
      };
      this._updateUI = debounce(this.rerender);

      this.uppy.log('Installing ' + callerPluginName + ' to a DOM element');

      // clear everything inside the target container
      if (this.opts.replaceTargetContent) {
        targetElement.innerHTML = '';
      }

      this.el = preact.render(this.render(this.uppy.getState()), targetElement);

      this.onMount();
      return this.el;
    }

    var targetPlugin = void 0;
    if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object' && target instanceof Plugin) {
      // Targeting a plugin *instance*
      targetPlugin = target;
    } else if (typeof target === 'function') {
      // Targeting a plugin type
      var Target = target;
      // Find the target plugin instance.
      this.uppy.iteratePlugins(function (plugin) {
        if (plugin instanceof Target) {
          targetPlugin = plugin;
          return false;
        }
      });
    }

    if (targetPlugin) {
      this.uppy.log('Installing ' + callerPluginName + ' to ' + targetPlugin.id);
      this.parent = targetPlugin;
      this.el = targetPlugin.addTarget(plugin);

      this.onMount();
      return this.el;
    }

    this.uppy.log('Not installing ' + callerPluginName);
    throw new Error('Invalid target option given to ' + callerPluginName + '. Please make sure that the element \n      exists on the page, or that the plugin you are targeting has been installed. Check that the <script> tag initializing Uppy \n      comes at the bottom of the page, before the closing </body> tag (see https://github.com/transloadit/uppy/issues/1042).');
  };

  Plugin.prototype.render = function render(state) {
    throw new Error('Extend the render method to add your plugin to a DOM element');
  };

  Plugin.prototype.addTarget = function addTarget(plugin) {
    throw new Error('Extend the addTarget method to add your plugin to another plugin\'s target');
  };

  Plugin.prototype.unmount = function unmount() {
    if (this.isTargetDOMEl && this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  };

  Plugin.prototype.install = function install() {};

  Plugin.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  return Plugin;
}();

},{"./../../utils/lib/findDOMElement":48,"preact":14}],40:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Translator = require('./../../utils/lib/Translator');
var ee = require('namespace-emitter');
var cuid = require('cuid');
// const throttle = require('lodash.throttle')
var prettyBytes = require('prettier-bytes');
var match = require('mime-match');
var DefaultStore = require('./../../store-default');
var getFileType = require('./../../utils/lib/getFileType');
var getFileNameAndExtension = require('./../../utils/lib/getFileNameAndExtension');
var generateFileID = require('./../../utils/lib/generateFileID');
var getTimeStamp = require('./../../utils/lib/getTimeStamp');
var supportsUploadProgress = require('./supportsUploadProgress');
var Plugin = require('./Plugin'); // Exported from here.

/**
 * Uppy Core module.
 * Manages plugins, state updates, acts as an event bus,
 * adds/removes files and metadata.
 */

var Uppy = function () {
  /**
  * Instantiate Uppy
  * @param {object} opts — Uppy options
  */
  function Uppy(opts) {
    var _this = this;

    _classCallCheck(this, Uppy);

    this.defaultLocale = {
      strings: {
        youCanOnlyUploadX: {
          0: 'You can only upload %{smart_count} file',
          1: 'You can only upload %{smart_count} files',
          2: 'You can only upload %{smart_count} files'
        },
        youHaveToAtLeastSelectX: {
          0: 'You have to select at least %{smart_count} file',
          1: 'You have to select at least %{smart_count} files',
          2: 'You have to select at least %{smart_count} files'
        },
        exceedsSize: 'This file exceeds maximum allowed size of',
        youCanOnlyUploadFileTypes: 'You can only upload: %{types}',
        companionError: 'Connection with Companion failed',
        companionAuthError: 'Authorization required',
        failedToUpload: 'Failed to upload %{file}',
        noInternetConnection: 'No Internet connection',
        connectedToInternet: 'Connected to the Internet',
        // Strings for remote providers
        noFilesFound: 'You have no files or folders here',
        selectXFiles: {
          0: 'Select %{smart_count} file',
          1: 'Select %{smart_count} files',
          2: 'Select %{smart_count} files'
        },
        cancel: 'Cancel',
        logOut: 'Log out',
        filter: 'Filter',
        resetFilter: 'Reset filter',
        loading: 'Loading...',
        authenticateWithTitle: 'Please authenticate with %{pluginName} to select files',
        authenticateWith: 'Connect to %{pluginName}'
      }

      // set default options
    };var defaultOptions = {
      id: 'uppy',
      autoProceed: false,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: null,
        maxNumberOfFiles: null,
        minNumberOfFiles: null,
        allowedFileTypes: null
      },
      meta: {},
      onBeforeFileAdded: function onBeforeFileAdded(currentFile, files) {
        return currentFile;
      },
      onBeforeUpload: function onBeforeUpload(files) {
        return files;
      },
      store: DefaultStore()

      // Merge default options with the ones set by user
    };this.opts = _extends({}, defaultOptions, opts);
    this.opts.restrictions = _extends({}, defaultOptions.restrictions, this.opts.restrictions);

    // i18n
    this.translator = new Translator([this.defaultLocale, this.opts.locale]);
    this.locale = this.translator.locale;
    this.i18n = this.translator.translate.bind(this.translator);
    this.i18nArray = this.translator.translateArray.bind(this.translator);

    // Container for different types of plugins
    this.plugins = {};

    this.getState = this.getState.bind(this);
    this.getPlugin = this.getPlugin.bind(this);
    this.setFileMeta = this.setFileMeta.bind(this);
    this.setFileState = this.setFileState.bind(this);
    this.log = this.log.bind(this);
    this.info = this.info.bind(this);
    this.hideInfo = this.hideInfo.bind(this);
    this.addFile = this.addFile.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.pauseResume = this.pauseResume.bind(this);
    this._calculateProgress = this._calculateProgress.bind(this);
    this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
    this.resetProgress = this.resetProgress.bind(this);

    this.pauseAll = this.pauseAll.bind(this);
    this.resumeAll = this.resumeAll.bind(this);
    this.retryAll = this.retryAll.bind(this);
    this.cancelAll = this.cancelAll.bind(this);
    this.retryUpload = this.retryUpload.bind(this);
    this.upload = this.upload.bind(this);

    this.emitter = ee();
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.once = this.emitter.once.bind(this.emitter);
    this.emit = this.emitter.emit.bind(this.emitter);

    this.preProcessors = [];
    this.uploaders = [];
    this.postProcessors = [];

    this.store = this.opts.store;
    this.setState({
      plugins: {},
      files: {},
      currentUploads: {},
      allowNewUpload: true,
      capabilities: {
        uploadProgress: supportsUploadProgress(),
        individualCancellation: true,
        resumableUploads: false
      },
      totalProgress: 0,
      meta: _extends({}, this.opts.meta),
      info: {
        isHidden: true,
        type: 'info',
        message: ''
      }
    });

    this._storeUnsubscribe = this.store.subscribe(function (prevState, nextState, patch) {
      _this.emit('state-update', prevState, nextState, patch);
      _this.updateAll(nextState);
    });

    // for debugging and testing
    // this.updateNum = 0
    if (this.opts.debug && typeof window !== 'undefined') {
      window['uppyLog'] = '';
      window[this.opts.id] = this;
    }

    this._addListeners();
  }

  Uppy.prototype.on = function on(event, callback) {
    this.emitter.on(event, callback);
    return this;
  };

  Uppy.prototype.off = function off(event, callback) {
    this.emitter.off(event, callback);
    return this;
  };

  /**
   * Iterate on all plugins and run `update` on them.
   * Called each time state changes.
   *
   */


  Uppy.prototype.updateAll = function updateAll(state) {
    this.iteratePlugins(function (plugin) {
      plugin.update(state);
    });
  };

  /**
   * Updates state with a patch
   *
   * @param {object} patch {foo: 'bar'}
   */


  Uppy.prototype.setState = function setState(patch) {
    this.store.setState(patch);
  };

  /**
   * Returns current state.
   * @return {object}
   */


  Uppy.prototype.getState = function getState() {
    return this.store.getState();
  };

  /**
  * Back compat for when uppy.state is used instead of uppy.getState().
  */


  /**
  * Shorthand to set state for a specific file.
  */
  Uppy.prototype.setFileState = function setFileState(fileID, state) {
    var _extends2;

    if (!this.getState().files[fileID]) {
      throw new Error('Can\u2019t set state for ' + fileID + ' (the file could have been removed)');
    }

    this.setState({
      files: _extends({}, this.getState().files, (_extends2 = {}, _extends2[fileID] = _extends({}, this.getState().files[fileID], state), _extends2))
    });
  };

  Uppy.prototype.resetProgress = function resetProgress() {
    var defaultProgress = {
      percentage: 0,
      bytesUploaded: 0,
      uploadComplete: false,
      uploadStarted: false
    };
    var files = _extends({}, this.getState().files);
    var updatedFiles = {};
    Object.keys(files).forEach(function (fileID) {
      var updatedFile = _extends({}, files[fileID]);
      updatedFile.progress = _extends({}, updatedFile.progress, defaultProgress);
      updatedFiles[fileID] = updatedFile;
    });

    this.setState({
      files: updatedFiles,
      totalProgress: 0
    });

    // TODO Document on the website
    this.emit('reset-progress');
  };

  Uppy.prototype.addPreProcessor = function addPreProcessor(fn) {
    this.preProcessors.push(fn);
  };

  Uppy.prototype.removePreProcessor = function removePreProcessor(fn) {
    var i = this.preProcessors.indexOf(fn);
    if (i !== -1) {
      this.preProcessors.splice(i, 1);
    }
  };

  Uppy.prototype.addPostProcessor = function addPostProcessor(fn) {
    this.postProcessors.push(fn);
  };

  Uppy.prototype.removePostProcessor = function removePostProcessor(fn) {
    var i = this.postProcessors.indexOf(fn);
    if (i !== -1) {
      this.postProcessors.splice(i, 1);
    }
  };

  Uppy.prototype.addUploader = function addUploader(fn) {
    this.uploaders.push(fn);
  };

  Uppy.prototype.removeUploader = function removeUploader(fn) {
    var i = this.uploaders.indexOf(fn);
    if (i !== -1) {
      this.uploaders.splice(i, 1);
    }
  };

  Uppy.prototype.setMeta = function setMeta(data) {
    var updatedMeta = _extends({}, this.getState().meta, data);
    var updatedFiles = _extends({}, this.getState().files);

    Object.keys(updatedFiles).forEach(function (fileID) {
      updatedFiles[fileID] = _extends({}, updatedFiles[fileID], {
        meta: _extends({}, updatedFiles[fileID].meta, data)
      });
    });

    this.log('Adding metadata:');
    this.log(data);

    this.setState({
      meta: updatedMeta,
      files: updatedFiles
    });
  };

  Uppy.prototype.setFileMeta = function setFileMeta(fileID, data) {
    var updatedFiles = _extends({}, this.getState().files);
    if (!updatedFiles[fileID]) {
      this.log('Was trying to set metadata for a file that’s not with us anymore: ', fileID);
      return;
    }
    var newMeta = _extends({}, updatedFiles[fileID].meta, data);
    updatedFiles[fileID] = _extends({}, updatedFiles[fileID], {
      meta: newMeta
    });
    this.setState({ files: updatedFiles });
  };

  /**
   * Get a file object.
   *
   * @param {string} fileID The ID of the file object to return.
   */


  Uppy.prototype.getFile = function getFile(fileID) {
    return this.getState().files[fileID];
  };

  /**
   * Get all files in an array.
   */


  Uppy.prototype.getFiles = function getFiles() {
    var _getState = this.getState(),
        files = _getState.files;

    return Object.keys(files).map(function (fileID) {
      return files[fileID];
    });
  };

  /**
  * Check if minNumberOfFiles restriction is reached before uploading.
  *
  * @private
  */


  Uppy.prototype._checkMinNumberOfFiles = function _checkMinNumberOfFiles(files) {
    var minNumberOfFiles = this.opts.restrictions.minNumberOfFiles;

    if (Object.keys(files).length < minNumberOfFiles) {
      throw new Error('' + this.i18n('youHaveToAtLeastSelectX', { smart_count: minNumberOfFiles }));
    }
  };

  /**
  * Check if file passes a set of restrictions set in options: maxFileSize,
  * maxNumberOfFiles and allowedFileTypes.
  *
  * @param {object} file object to check
  * @private
  */


  Uppy.prototype._checkRestrictions = function _checkRestrictions(file) {
    var _opts$restrictions = this.opts.restrictions,
        maxFileSize = _opts$restrictions.maxFileSize,
        maxNumberOfFiles = _opts$restrictions.maxNumberOfFiles,
        allowedFileTypes = _opts$restrictions.allowedFileTypes;


    if (maxNumberOfFiles) {
      if (Object.keys(this.getState().files).length + 1 > maxNumberOfFiles) {
        throw new Error('' + this.i18n('youCanOnlyUploadX', { smart_count: maxNumberOfFiles }));
      }
    }

    if (allowedFileTypes) {
      var isCorrectFileType = allowedFileTypes.some(function (type) {
        // if (!file.type) return false

        // is this is a mime-type
        if (type.indexOf('/') > -1) {
          if (!file.type) return false;
          return match(file.type, type);
        }

        // otherwise this is likely an extension
        if (type[0] === '.') {
          return file.extension.toLowerCase() === type.substr(1).toLowerCase();
        }
        return false;
      });

      if (!isCorrectFileType) {
        var allowedFileTypesString = allowedFileTypes.join(', ');
        throw new Error(this.i18n('youCanOnlyUploadFileTypes', { types: allowedFileTypesString }));
      }
    }

    // We can't check maxFileSize if the size is unknown.
    if (maxFileSize && file.data.size != null) {
      if (file.data.size > maxFileSize) {
        throw new Error(this.i18n('exceedsSize') + ' ' + prettyBytes(maxFileSize));
      }
    }
  };

  /**
  * Add a new file to `state.files`. This will run `onBeforeFileAdded`,
  * try to guess file type in a clever way, check file against restrictions,
  * and start an upload if `autoProceed === true`.
  *
  * @param {object} file object to add
  */


  Uppy.prototype.addFile = function addFile(file) {
    var _this2 = this,
        _extends3;

    var _getState2 = this.getState(),
        files = _getState2.files,
        allowNewUpload = _getState2.allowNewUpload;

    var onError = function onError(msg) {
      var err = (typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) === 'object' ? msg : new Error(msg);
      _this2.log(err.message);
      _this2.info(err.message, 'error', 5000);
      throw err;
    };

    if (allowNewUpload === false) {
      onError(new Error('Cannot add new files: already uploading.'));
    }

    var onBeforeFileAddedResult = this.opts.onBeforeFileAdded(file, files);

    if (onBeforeFileAddedResult === false) {
      this.log('Not adding file because onBeforeFileAdded returned false');
      return;
    }

    if ((typeof onBeforeFileAddedResult === 'undefined' ? 'undefined' : _typeof(onBeforeFileAddedResult)) === 'object' && onBeforeFileAddedResult) {
      // warning after the change in 0.24
      if (onBeforeFileAddedResult.then) {
        throw new TypeError('onBeforeFileAdded() returned a Promise, but this is no longer supported. It must be synchronous.');
      }
      file = onBeforeFileAddedResult;
    }

    var fileType = getFileType(file);
    var fileName = void 0;
    if (file.name) {
      fileName = file.name;
    } else if (fileType.split('/')[0] === 'image') {
      fileName = fileType.split('/')[0] + '.' + fileType.split('/')[1];
    } else {
      fileName = 'noname';
    }
    var fileExtension = getFileNameAndExtension(fileName).extension;
    var isRemote = file.isRemote || false;

    var fileID = generateFileID(file);

    var meta = file.meta || {};
    meta.name = fileName;
    meta.type = fileType;

    // `null` means the size is unknown.
    var size = isFinite(file.data.size) ? file.data.size : null;
    var newFile = {
      source: file.source || '',
      id: fileID,
      name: fileName,
      extension: fileExtension || '',
      meta: _extends({}, this.getState().meta, meta),
      type: fileType,
      data: file.data,
      progress: {
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: size,
        uploadComplete: false,
        uploadStarted: false
      },
      size: size,
      isRemote: isRemote,
      remote: file.remote || '',
      preview: file.preview
    };

    try {
      this._checkRestrictions(newFile);
    } catch (err) {
      this.emit('restriction-failed', newFile, err);
      onError(err);
    }

    this.setState({
      files: _extends({}, files, (_extends3 = {}, _extends3[fileID] = newFile, _extends3))
    });

    this.emit('file-added', newFile);
    this.log('Added file: ' + fileName + ', ' + fileID + ', mime type: ' + fileType);

    if (this.opts.autoProceed && !this.scheduledAutoProceed) {
      this.scheduledAutoProceed = setTimeout(function () {
        _this2.scheduledAutoProceed = null;
        _this2.upload().catch(function (err) {
          console.error(err.stack || err.message || err);
        });
      }, 4);
    }
  };

  Uppy.prototype.removeFile = function removeFile(fileID) {
    var _this3 = this;

    var _getState3 = this.getState(),
        files = _getState3.files,
        currentUploads = _getState3.currentUploads;

    var updatedFiles = _extends({}, files);
    var removedFile = updatedFiles[fileID];
    delete updatedFiles[fileID];

    // Remove this file from its `currentUpload`.
    var updatedUploads = _extends({}, currentUploads);
    var removeUploads = [];
    Object.keys(updatedUploads).forEach(function (uploadID) {
      var newFileIDs = currentUploads[uploadID].fileIDs.filter(function (uploadFileID) {
        return uploadFileID !== fileID;
      });
      // Remove the upload if no files are associated with it anymore.
      if (newFileIDs.length === 0) {
        removeUploads.push(uploadID);
        return;
      }

      updatedUploads[uploadID] = _extends({}, currentUploads[uploadID], {
        fileIDs: newFileIDs
      });
    });

    this.setState({
      currentUploads: updatedUploads,
      files: updatedFiles
    });

    removeUploads.forEach(function (uploadID) {
      _this3._removeUpload(uploadID);
    });

    this._calculateTotalProgress();
    this.emit('file-removed', removedFile);
    this.log('File removed: ' + removedFile.id);
  };

  Uppy.prototype.pauseResume = function pauseResume(fileID) {
    if (!this.getState().capabilities.resumableUploads || this.getFile(fileID).uploadComplete) {
      return;
    }

    var wasPaused = this.getFile(fileID).isPaused || false;
    var isPaused = !wasPaused;

    this.setFileState(fileID, {
      isPaused: isPaused
    });

    this.emit('upload-pause', fileID, isPaused);

    return isPaused;
  };

  Uppy.prototype.pauseAll = function pauseAll() {
    var updatedFiles = _extends({}, this.getState().files);
    var inProgressUpdatedFiles = Object.keys(updatedFiles).filter(function (file) {
      return !updatedFiles[file].progress.uploadComplete && updatedFiles[file].progress.uploadStarted;
    });

    inProgressUpdatedFiles.forEach(function (file) {
      var updatedFile = _extends({}, updatedFiles[file], {
        isPaused: true
      });
      updatedFiles[file] = updatedFile;
    });
    this.setState({ files: updatedFiles });

    this.emit('pause-all');
  };

  Uppy.prototype.resumeAll = function resumeAll() {
    var updatedFiles = _extends({}, this.getState().files);
    var inProgressUpdatedFiles = Object.keys(updatedFiles).filter(function (file) {
      return !updatedFiles[file].progress.uploadComplete && updatedFiles[file].progress.uploadStarted;
    });

    inProgressUpdatedFiles.forEach(function (file) {
      var updatedFile = _extends({}, updatedFiles[file], {
        isPaused: false,
        error: null
      });
      updatedFiles[file] = updatedFile;
    });
    this.setState({ files: updatedFiles });

    this.emit('resume-all');
  };

  Uppy.prototype.retryAll = function retryAll() {
    var updatedFiles = _extends({}, this.getState().files);
    var filesToRetry = Object.keys(updatedFiles).filter(function (file) {
      return updatedFiles[file].error;
    });

    filesToRetry.forEach(function (file) {
      var updatedFile = _extends({}, updatedFiles[file], {
        isPaused: false,
        error: null
      });
      updatedFiles[file] = updatedFile;
    });
    this.setState({
      files: updatedFiles,
      error: null
    });

    this.emit('retry-all', filesToRetry);

    var uploadID = this._createUpload(filesToRetry);
    return this._runUpload(uploadID);
  };

  Uppy.prototype.cancelAll = function cancelAll() {
    var _this4 = this;

    this.emit('cancel-all');

    var files = Object.keys(this.getState().files);
    files.forEach(function (fileID) {
      _this4.removeFile(fileID);
    });

    this.setState({
      allowNewUpload: true,
      totalProgress: 0,
      error: null
    });
  };

  Uppy.prototype.retryUpload = function retryUpload(fileID) {
    var updatedFiles = _extends({}, this.getState().files);
    var updatedFile = _extends({}, updatedFiles[fileID], { error: null, isPaused: false });
    updatedFiles[fileID] = updatedFile;
    this.setState({
      files: updatedFiles
    });

    this.emit('upload-retry', fileID);

    var uploadID = this._createUpload([fileID]);
    return this._runUpload(uploadID);
  };

  Uppy.prototype.reset = function reset() {
    this.cancelAll();
  };

  Uppy.prototype._calculateProgress = function _calculateProgress(file, data) {
    if (!this.getFile(file.id)) {
      this.log('Not setting progress for a file that has been removed: ' + file.id);
      return;
    }

    // bytesTotal may be null or zero; in that case we can't divide by it
    var canHavePercentage = isFinite(data.bytesTotal) && data.bytesTotal > 0;
    this.setFileState(file.id, {
      progress: _extends({}, this.getFile(file.id).progress, {
        bytesUploaded: data.bytesUploaded,
        bytesTotal: data.bytesTotal,
        percentage: canHavePercentage
        // TODO(goto-bus-stop) flooring this should probably be the choice of the UI?
        // we get more accurate calculations if we don't round this at all.
        ? Math.floor(data.bytesUploaded / data.bytesTotal * 100) : 0
      })
    });

    this._calculateTotalProgress();
  };

  Uppy.prototype._calculateTotalProgress = function _calculateTotalProgress() {
    // calculate total progress, using the number of files currently uploading,
    // multiplied by 100 and the summ of individual progress of each file
    var files = this.getFiles();

    var inProgress = files.filter(function (file) {
      return file.progress.uploadStarted;
    });

    if (inProgress.length === 0) {
      this.emit('progress', 0);
      this.setState({ totalProgress: 0 });
      return;
    }

    var sizedFiles = inProgress.filter(function (file) {
      return file.progress.bytesTotal != null;
    });
    var unsizedFiles = inProgress.filter(function (file) {
      return file.progress.bytesTotal == null;
    });

    if (sizedFiles.length === 0) {
      var progressMax = inProgress.length;
      var currentProgress = unsizedFiles.reduce(function (acc, file) {
        return acc + file.progress.percentage;
      }, 0);
      var _totalProgress = Math.round(currentProgress / progressMax * 100);
      this.setState({ totalProgress: _totalProgress });
      return;
    }

    var totalSize = sizedFiles.reduce(function (acc, file) {
      return acc + file.progress.bytesTotal;
    }, 0);
    var averageSize = totalSize / sizedFiles.length;
    totalSize += averageSize * unsizedFiles.length;

    var uploadedSize = 0;
    sizedFiles.forEach(function (file) {
      uploadedSize += file.progress.bytesUploaded;
    });
    unsizedFiles.forEach(function (file) {
      uploadedSize += averageSize * (file.progress.percentage || 0);
    });

    var totalProgress = totalSize === 0 ? 0 : Math.round(uploadedSize / totalSize * 100);

    this.setState({ totalProgress: totalProgress });
    this.emit('progress', totalProgress);
  };

  /**
   * Registers listeners for all global actions, like:
   * `error`, `file-removed`, `upload-progress`
   */


  Uppy.prototype._addListeners = function _addListeners() {
    var _this5 = this;

    this.on('error', function (error) {
      _this5.setState({ error: error.message });
    });

    this.on('upload-error', function (file, error, response) {
      _this5.setFileState(file.id, {
        error: error.message,
        response: response
      });

      _this5.setState({ error: error.message });

      var message = _this5.i18n('failedToUpload', { file: file.name });
      if ((typeof error === 'undefined' ? 'undefined' : _typeof(error)) === 'object' && error.message) {
        message = { message: message, details: error.message };
      }
      _this5.info(message, 'error', 5000);
    });

    this.on('upload', function () {
      _this5.setState({ error: null });
    });

    this.on('upload-started', function (file, upload) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      _this5.setFileState(file.id, {
        progress: {
          uploadStarted: Date.now(),
          uploadComplete: false,
          percentage: 0,
          bytesUploaded: 0,
          bytesTotal: file.size
        }
      });
    });

    // upload progress events can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    // see also: https://github.com/tus/tus-js-client/commit/9940f27b2361fd7e10ba58b09b60d82422183bbb
    // const _throttledCalculateProgress = throttle(this._calculateProgress, 100, { leading: true, trailing: true })

    this.on('upload-progress', this._calculateProgress);

    this.on('upload-success', function (file, uploadResp) {
      var currentProgress = _this5.getFile(file.id).progress;
      _this5.setFileState(file.id, {
        progress: _extends({}, currentProgress, {
          uploadComplete: true,
          percentage: 100,
          bytesUploaded: currentProgress.bytesTotal
        }),
        response: uploadResp,
        uploadURL: uploadResp.uploadURL,
        isPaused: false
      });

      _this5._calculateTotalProgress();
    });

    this.on('preprocess-progress', function (file, progress) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      _this5.setFileState(file.id, {
        progress: _extends({}, _this5.getFile(file.id).progress, {
          preprocess: progress
        })
      });
    });

    this.on('preprocess-complete', function (file) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      var files = _extends({}, _this5.getState().files);
      files[file.id] = _extends({}, files[file.id], {
        progress: _extends({}, files[file.id].progress)
      });
      delete files[file.id].progress.preprocess;

      _this5.setState({ files: files });
    });

    this.on('postprocess-progress', function (file, progress) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      _this5.setFileState(file.id, {
        progress: _extends({}, _this5.getState().files[file.id].progress, {
          postprocess: progress
        })
      });
    });

    this.on('postprocess-complete', function (file) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      var files = _extends({}, _this5.getState().files);
      files[file.id] = _extends({}, files[file.id], {
        progress: _extends({}, files[file.id].progress)
      });
      delete files[file.id].progress.postprocess;
      // TODO should we set some kind of `fullyComplete` property on the file object
      // so it's easier to see that the file is upload…fully complete…rather than
      // what we have to do now (`uploadComplete && !postprocess`)

      _this5.setState({ files: files });
    });

    this.on('restored', function () {
      // Files may have changed--ensure progress is still accurate.
      _this5._calculateTotalProgress();
    });

    // show informer if offline
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', function () {
        return _this5.updateOnlineStatus();
      });
      window.addEventListener('offline', function () {
        return _this5.updateOnlineStatus();
      });
      setTimeout(function () {
        return _this5.updateOnlineStatus();
      }, 3000);
    }
  };

  Uppy.prototype.updateOnlineStatus = function updateOnlineStatus() {
    var online = typeof window.navigator.onLine !== 'undefined' ? window.navigator.onLine : true;
    if (!online) {
      this.emit('is-offline');
      this.info(this.i18n('noInternetConnection'), 'error', 0);
      this.wasOffline = true;
    } else {
      this.emit('is-online');
      if (this.wasOffline) {
        this.emit('back-online');
        this.info(this.i18n('connectedToInternet'), 'success', 3000);
        this.wasOffline = false;
      }
    }
  };

  Uppy.prototype.getID = function getID() {
    return this.opts.id;
  };

  /**
   * Registers a plugin with Core.
   *
   * @param {object} Plugin object
   * @param {object} [opts] object with options to be passed to Plugin
   * @return {Object} self for chaining
   */


  Uppy.prototype.use = function use(Plugin, opts) {
    if (typeof Plugin !== 'function') {
      var msg = 'Expected a plugin class, but got ' + (Plugin === null ? 'null' : typeof Plugin === 'undefined' ? 'undefined' : _typeof(Plugin)) + '.' + ' Please verify that the plugin was imported and spelled correctly.';
      throw new TypeError(msg);
    }

    // Instantiate
    var plugin = new Plugin(this, opts);
    var pluginId = plugin.id;
    this.plugins[plugin.type] = this.plugins[plugin.type] || [];

    if (!pluginId) {
      throw new Error('Your plugin must have an id');
    }

    if (!plugin.type) {
      throw new Error('Your plugin must have a type');
    }

    var existsPluginAlready = this.getPlugin(pluginId);
    if (existsPluginAlready) {
      var _msg = 'Already found a plugin named \'' + existsPluginAlready.id + '\'. ' + ('Tried to use: \'' + pluginId + '\'.\n') + 'Uppy plugins must have unique \'id\' options. See https://uppy.io/docs/plugins/#id.';
      throw new Error(_msg);
    }

    this.plugins[plugin.type].push(plugin);
    plugin.install();

    return this;
  };

  /**
   * Find one Plugin by name.
   *
   * @param {string} id plugin id
   * @return {object | boolean}
   */


  Uppy.prototype.getPlugin = function getPlugin(id) {
    var foundPlugin = null;
    this.iteratePlugins(function (plugin) {
      if (plugin.id === id) {
        foundPlugin = plugin;
        return false;
      }
    });
    return foundPlugin;
  };

  /**
   * Iterate through all `use`d plugins.
   *
   * @param {function} method that will be run on each plugin
   */


  Uppy.prototype.iteratePlugins = function iteratePlugins(method) {
    var _this6 = this;

    Object.keys(this.plugins).forEach(function (pluginType) {
      _this6.plugins[pluginType].forEach(method);
    });
  };

  /**
   * Uninstall and remove a plugin.
   *
   * @param {object} instance The plugin instance to remove.
   */


  Uppy.prototype.removePlugin = function removePlugin(instance) {
    this.log('Removing plugin ' + instance.id);
    this.emit('plugin-remove', instance);

    if (instance.uninstall) {
      instance.uninstall();
    }

    var list = this.plugins[instance.type].slice();
    var index = list.indexOf(instance);
    if (index !== -1) {
      list.splice(index, 1);
      this.plugins[instance.type] = list;
    }

    var updatedState = this.getState();
    delete updatedState.plugins[instance.id];
    this.setState(updatedState);
  };

  /**
   * Uninstall all plugins and close down this Uppy instance.
   */


  Uppy.prototype.close = function close() {
    var _this7 = this;

    this.log('Closing Uppy instance ' + this.opts.id + ': removing all files and uninstalling plugins');

    this.reset();

    this._storeUnsubscribe();

    this.iteratePlugins(function (plugin) {
      _this7.removePlugin(plugin);
    });
  };

  /**
  * Set info message in `state.info`, so that UI plugins like `Informer`
  * can display the message.
  *
  * @param {string | object} message Message to be displayed by the informer
  * @param {string} [type]
  * @param {number} [duration]
  */

  Uppy.prototype.info = function info(message) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';
    var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3000;

    var isComplexMessage = (typeof message === 'undefined' ? 'undefined' : _typeof(message)) === 'object';

    this.setState({
      info: {
        isHidden: false,
        type: type,
        message: isComplexMessage ? message.message : message,
        details: isComplexMessage ? message.details : null
      }
    });

    this.emit('info-visible');

    clearTimeout(this.infoTimeoutID);
    if (duration === 0) {
      this.infoTimeoutID = undefined;
      return;
    }

    // hide the informer after `duration` milliseconds
    this.infoTimeoutID = setTimeout(this.hideInfo, duration);
  };

  Uppy.prototype.hideInfo = function hideInfo() {
    var newInfo = _extends({}, this.getState().info, {
      isHidden: true
    });
    this.setState({
      info: newInfo
    });
    this.emit('info-hidden');
  };

  /**
   * Logs stuff to console, only if `debug` is set to true. Silent in production.
   *
   * @param {String|Object} message to log
   * @param {String} [type] optional `error` or `warning`
   */


  Uppy.prototype.log = function log(message, type) {
    if (!this.opts.debug) {
      return;
    }

    var prefix = '[Uppy] [' + getTimeStamp() + ']';

    if (type === 'error') {
      console.error(prefix, message);
      return;
    }

    if (type === 'warning') {
      console.warn(prefix, message);
      return;
    }

    console.log(prefix, message);
  };

  /**
   * Obsolete, event listeners are now added in the constructor.
   */


  Uppy.prototype.run = function run() {
    this.log('Calling run() is no longer necessary.', 'warning');
    return this;
  };

  /**
   * Restore an upload by its ID.
   */


  Uppy.prototype.restore = function restore(uploadID) {
    this.log('Core: attempting to restore upload "' + uploadID + '"');

    if (!this.getState().currentUploads[uploadID]) {
      this._removeUpload(uploadID);
      return Promise.reject(new Error('Nonexistent upload'));
    }

    return this._runUpload(uploadID);
  };

  /**
   * Create an upload for a bunch of files.
   *
   * @param {Array<string>} fileIDs File IDs to include in this upload.
   * @return {string} ID of this upload.
   */


  Uppy.prototype._createUpload = function _createUpload(fileIDs) {
    var _extends4;

    var _getState4 = this.getState(),
        allowNewUpload = _getState4.allowNewUpload,
        currentUploads = _getState4.currentUploads;

    if (!allowNewUpload) {
      throw new Error('Cannot create a new upload: already uploading.');
    }

    var uploadID = cuid();

    this.emit('upload', {
      id: uploadID,
      fileIDs: fileIDs
    });

    this.setState({
      allowNewUpload: this.opts.allowMultipleUploads !== false,

      currentUploads: _extends({}, currentUploads, (_extends4 = {}, _extends4[uploadID] = {
        fileIDs: fileIDs,
        step: 0,
        result: {}
      }, _extends4))
    });

    return uploadID;
  };

  Uppy.prototype._getUpload = function _getUpload(uploadID) {
    var _getState5 = this.getState(),
        currentUploads = _getState5.currentUploads;

    return currentUploads[uploadID];
  };

  /**
   * Add data to an upload's result object.
   *
   * @param {string} uploadID The ID of the upload.
   * @param {object} data Data properties to add to the result object.
   */


  Uppy.prototype.addResultData = function addResultData(uploadID, data) {
    var _extends5;

    if (!this._getUpload(uploadID)) {
      this.log('Not setting result for an upload that has been removed: ' + uploadID);
      return;
    }
    var currentUploads = this.getState().currentUploads;
    var currentUpload = _extends({}, currentUploads[uploadID], {
      result: _extends({}, currentUploads[uploadID].result, data)
    });
    this.setState({
      currentUploads: _extends({}, currentUploads, (_extends5 = {}, _extends5[uploadID] = currentUpload, _extends5))
    });
  };

  /**
   * Remove an upload, eg. if it has been canceled or completed.
   *
   * @param {string} uploadID The ID of the upload.
   */


  Uppy.prototype._removeUpload = function _removeUpload(uploadID) {
    var currentUploads = _extends({}, this.getState().currentUploads);
    delete currentUploads[uploadID];

    this.setState({
      currentUploads: currentUploads
    });
  };

  /**
   * Run an upload. This picks up where it left off in case the upload is being restored.
   *
   * @private
   */


  Uppy.prototype._runUpload = function _runUpload(uploadID) {
    var _this8 = this;

    var uploadData = this.getState().currentUploads[uploadID];
    var restoreStep = uploadData.step;

    var steps = [].concat(this.preProcessors, this.uploaders, this.postProcessors);
    var lastStep = Promise.resolve();
    steps.forEach(function (fn, step) {
      // Skip this step if we are restoring and have already completed this step before.
      if (step < restoreStep) {
        return;
      }

      lastStep = lastStep.then(function () {
        var _extends6;

        var _getState6 = _this8.getState(),
            currentUploads = _getState6.currentUploads;

        var currentUpload = _extends({}, currentUploads[uploadID], {
          step: step
        });
        _this8.setState({
          currentUploads: _extends({}, currentUploads, (_extends6 = {}, _extends6[uploadID] = currentUpload, _extends6))
        });

        // TODO give this the `currentUpload` object as its only parameter maybe?
        // Otherwise when more metadata may be added to the upload this would keep getting more parameters
        return fn(currentUpload.fileIDs, uploadID);
      }).then(function (result) {
        return null;
      });
    });

    // Not returning the `catch`ed promise, because we still want to return a rejected
    // promise from this method if the upload failed.
    lastStep.catch(function (err) {
      _this8.emit('error', err, uploadID);
      _this8._removeUpload(uploadID);
    });

    return lastStep.then(function () {
      // Set result data.
      var _getState7 = _this8.getState(),
          currentUploads = _getState7.currentUploads;

      var currentUpload = currentUploads[uploadID];
      if (!currentUpload) {
        return;
      }

      var files = currentUpload.fileIDs.map(function (fileID) {
        return _this8.getFile(fileID);
      });
      var successful = files.filter(function (file) {
        return !file.error;
      });
      var failed = files.filter(function (file) {
        return file.error;
      });
      _this8.addResultData(uploadID, { successful: successful, failed: failed, uploadID: uploadID });
    }).then(function () {
      // Emit completion events.
      // This is in a separate function so that the `currentUploads` variable
      // always refers to the latest state. In the handler right above it refers
      // to an outdated object without the `.result` property.
      var _getState8 = _this8.getState(),
          currentUploads = _getState8.currentUploads;

      if (!currentUploads[uploadID]) {
        return;
      }
      var currentUpload = currentUploads[uploadID];
      var result = currentUpload.result;
      _this8.emit('complete', result);

      _this8._removeUpload(uploadID);

      return result;
    }).then(function (result) {
      if (result == null) {
        _this8.log('Not setting result for an upload that has been removed: ' + uploadID);
      }
      return result;
    });
  };

  /**
   * Start an upload for all the files that are not currently being uploaded.
   *
   * @return {Promise}
   */


  Uppy.prototype.upload = function upload() {
    var _this9 = this;

    if (!this.plugins.uploader) {
      this.log('No uploader type plugins are used', 'warning');
    }

    var files = this.getState().files;
    var onBeforeUploadResult = this.opts.onBeforeUpload(files);

    if (onBeforeUploadResult === false) {
      return Promise.reject(new Error('Not starting the upload because onBeforeUpload returned false'));
    }

    if (onBeforeUploadResult && (typeof onBeforeUploadResult === 'undefined' ? 'undefined' : _typeof(onBeforeUploadResult)) === 'object') {
      // warning after the change in 0.24
      if (onBeforeUploadResult.then) {
        throw new TypeError('onBeforeUpload() returned a Promise, but this is no longer supported. It must be synchronous.');
      }

      files = onBeforeUploadResult;
    }

    return Promise.resolve().then(function () {
      return _this9._checkMinNumberOfFiles(files);
    }).then(function () {
      var _getState9 = _this9.getState(),
          currentUploads = _getState9.currentUploads;
      // get a list of files that are currently assigned to uploads


      var currentlyUploadingFiles = Object.keys(currentUploads).reduce(function (prev, curr) {
        return prev.concat(currentUploads[curr].fileIDs);
      }, []);

      var waitingFileIDs = [];
      Object.keys(files).forEach(function (fileID) {
        var file = _this9.getFile(fileID);
        // if the file hasn't started uploading and hasn't already been assigned to an upload..
        if (!file.progress.uploadStarted && currentlyUploadingFiles.indexOf(fileID) === -1) {
          waitingFileIDs.push(file.id);
        }
      });

      var uploadID = _this9._createUpload(waitingFileIDs);
      return _this9._runUpload(uploadID);
    }).catch(function (err) {
      var message = (typeof err === 'undefined' ? 'undefined' : _typeof(err)) === 'object' ? err.message : err;
      var details = (typeof err === 'undefined' ? 'undefined' : _typeof(err)) === 'object' ? err.details : null;
      _this9.log(message + ' ' + details);
      _this9.info({ message: message, details: details }, 'error', 4000);
      return Promise.reject((typeof err === 'undefined' ? 'undefined' : _typeof(err)) === 'object' ? err : new Error(err));
    });
  };

  _createClass(Uppy, [{
    key: 'state',
    get: function get() {
      return this.getState();
    }
  }]);

  return Uppy;
}();

module.exports = function (opts) {
  return new Uppy(opts);
};

// Expose class constructor.
module.exports.Uppy = Uppy;
module.exports.Plugin = Plugin;

},{"./../../store-default":44,"./../../utils/lib/Translator":46,"./../../utils/lib/generateFileID":49,"./../../utils/lib/getFileNameAndExtension":50,"./../../utils/lib/getFileType":51,"./../../utils/lib/getTimeStamp":53,"./Plugin":39,"./supportsUploadProgress":41,"cuid":1,"mime-match":12,"namespace-emitter":13,"prettier-bytes":15}],41:[function(require,module,exports){
// Edge 15.x does not fire 'progress' events on uploads.
// See https://github.com/transloadit/uppy/issues/945
// And https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12224510/
module.exports = function supportsUploadProgress(userAgent) {
  // Allow passing in userAgent for tests
  if (userAgent == null) {
    userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
  }
  // Assume it works because basically everything supports progress events.
  if (!userAgent) return true;

  var m = /Edge\/(\d+\.\d+)/.exec(userAgent);
  if (!m) return true;

  var edgeVersion = m[1];

  var _edgeVersion$split = edgeVersion.split('.'),
      major = _edgeVersion$split[0],
      minor = _edgeVersion$split[1];

  major = parseInt(major, 10);
  minor = parseInt(minor, 10);

  // Worked before:
  // Edge 40.15063.0.0
  // Microsoft EdgeHTML 15.15063
  if (major < 15 || major === 15 && minor < 15063) {
    return true;
  }

  // Fixed in:
  // Microsoft EdgeHTML 18.18218
  if (major > 18 || major === 18 && minor >= 18218) {
    return true;
  }

  // other versions don't work.
  return false;
};

},{}],42:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./../../core'),
    Plugin = _require.Plugin;

var Translator = require('./../../utils/lib/Translator');
var toArray = require('./../../utils/lib/toArray');
var dragDrop = require('drag-drop');

var _require2 = require('preact'),
    h = _require2.h;

/**
 * Drag & Drop plugin
 *
 */


module.exports = function (_Plugin) {
  _inherits(DragDrop, _Plugin);

  function DragDrop(uppy, opts) {
    _classCallCheck(this, DragDrop);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.type = 'acquirer';
    _this.id = _this.opts.id || 'DragDrop';
    _this.title = 'Drag & Drop';

    _this.defaultLocale = {
      strings: {
        dropHereOr: 'Drop files here or %{browse}',
        browse: 'browse'
      }

      // Default options
    };var defaultOpts = {
      target: null,
      inputName: 'files[]',
      width: '100%',
      height: '100%',
      note: null

      // Merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOpts, opts);

    // Check for browser dragDrop support
    _this.isDragDropSupported = _this.checkDragDropSupport();

    // i18n
    _this.translator = new Translator([_this.defaultLocale, _this.uppy.locale, _this.opts.locale]);
    _this.i18n = _this.translator.translate.bind(_this.translator);
    _this.i18nArray = _this.translator.translateArray.bind(_this.translator);

    // Bind `this` to class methods
    _this.handleDrop = _this.handleDrop.bind(_this);
    _this.handleInputChange = _this.handleInputChange.bind(_this);
    _this.checkDragDropSupport = _this.checkDragDropSupport.bind(_this);
    _this.render = _this.render.bind(_this);
    return _this;
  }

  /**
   * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
   * @return {Boolean}
   */


  DragDrop.prototype.checkDragDropSupport = function checkDragDropSupport() {
    var div = document.createElement('div');

    if (!('draggable' in div) || !('ondragstart' in div && 'ondrop' in div)) {
      return false;
    }

    if (!('FormData' in window)) {
      return false;
    }

    if (!('FileReader' in window)) {
      return false;
    }

    return true;
  };

  DragDrop.prototype.handleDrop = function handleDrop(files) {
    var _this2 = this;

    this.uppy.log('[DragDrop] Files dropped');

    files.forEach(function (file) {
      try {
        _this2.uppy.addFile({
          source: _this2.id,
          name: file.name,
          type: file.type,
          data: file
        });
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    });
  };

  DragDrop.prototype.handleInputChange = function handleInputChange(ev) {
    var _this3 = this;

    this.uppy.log('[DragDrop] Files selected through input');

    var files = toArray(ev.target.files);

    files.forEach(function (file) {
      try {
        _this3.uppy.addFile({
          source: _this3.id,
          name: file.name,
          type: file.type,
          data: file
        });
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    });
  };

  DragDrop.prototype.render = function render(state) {
    var _this4 = this;

    /* http://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/ */
    var hiddenInputStyle = {
      width: '0.1px',
      height: '0.1px',
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: -1
    };
    var DragDropClass = 'uppy-Root uppy-DragDrop-container ' + (this.isDragDropSupported ? 'uppy-DragDrop--is-dragdrop-supported' : '');
    var DragDropStyle = {
      width: this.opts.width,
      height: this.opts.height
    };
    var restrictions = this.uppy.opts.restrictions;

    // empty value="" on file input, so that the input is cleared after a file is selected,
    // because Uppy will be handling the upload and so we can select same file
    // after removing — otherwise browser thinks it’s already selected
    return h(
      'div',
      { 'class': DragDropClass, style: DragDropStyle },
      h(
        'div',
        { 'class': 'uppy-DragDrop-inner' },
        h(
          'svg',
          { 'aria-hidden': 'true', 'class': 'UppyIcon uppy-DragDrop-arrow', width: '16', height: '16', viewBox: '0 0 16 16' },
          h('path', { d: 'M11 10V0H5v10H2l6 6 6-6h-3zm0 0', 'fill-rule': 'evenodd' })
        ),
        h(
          'label',
          { 'class': 'uppy-DragDrop-label' },
          h('input', { style: hiddenInputStyle,
            'class': 'uppy-DragDrop-input',
            type: 'file',
            name: this.opts.inputName,
            multiple: restrictions.maxNumberOfFiles !== 1,
            accept: restrictions.allowedFileTypes,
            ref: function ref(input) {
              _this4.input = input;
            },
            onchange: this.handleInputChange,
            value: '' }),
          this.i18nArray('dropHereOr', {
            browse: h(
              'span',
              { 'class': 'uppy-DragDrop-dragText' },
              this.i18n('browse')
            )
          })
        ),
        h(
          'span',
          { 'class': 'uppy-DragDrop-note' },
          this.opts.note
        )
      )
    );
  };

  DragDrop.prototype.install = function install() {
    var _this5 = this;

    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
    this.removeDragDropListener = dragDrop(this.el, function (files) {
      _this5.handleDrop(files);
      _this5.uppy.log(files);
    });
  };

  DragDrop.prototype.uninstall = function uninstall() {
    this.unmount();
    this.removeDragDropListener();
  };

  return DragDrop;
}(Plugin);

},{"./../../core":40,"./../../utils/lib/Translator":46,"./../../utils/lib/toArray":58,"drag-drop":5,"preact":14}],43:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./../../core'),
    Plugin = _require.Plugin;

var _require2 = require('preact'),
    h = _require2.h;

/**
 * Progress bar
 *
 */


module.exports = function (_Plugin) {
  _inherits(ProgressBar, _Plugin);

  function ProgressBar(uppy, opts) {
    _classCallCheck(this, ProgressBar);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.id = _this.opts.id || 'ProgressBar';
    _this.title = 'Progress Bar';
    _this.type = 'progressindicator';

    // set default options
    var defaultOptions = {
      target: 'body',
      replaceTargetContent: false,
      fixed: false,
      hideAfterFinish: true

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    _this.render = _this.render.bind(_this);
    return _this;
  }

  ProgressBar.prototype.render = function render(state) {
    var progress = state.totalProgress || 0;
    var isHidden = progress === 100 && this.opts.hideAfterFinish;
    return h(
      'div',
      { 'class': 'uppy uppy-ProgressBar', style: { position: this.opts.fixed ? 'fixed' : 'initial' }, 'aria-hidden': isHidden },
      h('div', { 'class': 'uppy-ProgressBar-inner', style: { width: progress + '%' } }),
      h(
        'div',
        { 'class': 'uppy-ProgressBar-percentage' },
        progress
      )
    );
  };

  ProgressBar.prototype.install = function install() {
    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
  };

  ProgressBar.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  return ProgressBar;
}(Plugin);

},{"./../../core":40,"preact":14}],44:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Default store that keeps state in a simple object.
 */
var DefaultStore = function () {
  function DefaultStore() {
    _classCallCheck(this, DefaultStore);

    this.state = {};
    this.callbacks = [];
  }

  DefaultStore.prototype.getState = function getState() {
    return this.state;
  };

  DefaultStore.prototype.setState = function setState(patch) {
    var prevState = _extends({}, this.state);
    var nextState = _extends({}, this.state, patch);

    this.state = nextState;
    this._publish(prevState, nextState, patch);
  };

  DefaultStore.prototype.subscribe = function subscribe(listener) {
    var _this = this;

    this.callbacks.push(listener);
    return function () {
      // Remove the listener.
      _this.callbacks.splice(_this.callbacks.indexOf(listener), 1);
    };
  };

  DefaultStore.prototype._publish = function _publish() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this.callbacks.forEach(function (listener) {
      listener.apply(undefined, args);
    });
  };

  return DefaultStore;
}();

module.exports = function defaultStore() {
  return new DefaultStore();
};

},{}],45:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./../../core'),
    Plugin = _require.Plugin;

var tus = require('tus-js-client');

var _require2 = require('./../../companion-client'),
    Provider = _require2.Provider,
    RequestClient = _require2.RequestClient,
    Socket = _require2.Socket;

var emitSocketProgress = require('./../../utils/lib/emitSocketProgress');
var getSocketHost = require('./../../utils/lib/getSocketHost');
var settle = require('./../../utils/lib/settle');
var limitPromises = require('./../../utils/lib/limitPromises');

// Extracted from https://github.com/tus/tus-js-client/blob/master/lib/upload.js#L13
// excepted we removed 'fingerprint' key to avoid adding more dependencies
var tusDefaultOptions = {
  endpoint: '',
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false,
  uploadUrl: null,
  uploadSize: null,
  overridePatchMethod: false,
  retryDelays: null

  /**
   * Create a wrapper around an event emitter with a `remove` method to remove
   * all events that were added using the wrapped emitter.
   */
};function createEventTracker(emitter) {
  var events = [];
  return {
    on: function on(event, fn) {
      events.push([event, fn]);
      return emitter.on(event, fn);
    },
    remove: function remove() {
      events.forEach(function (_ref) {
        var event = _ref[0],
            fn = _ref[1];

        emitter.off(event, fn);
      });
    }
  };
}

/**
 * Tus resumable file uploader
 *
 */
module.exports = function (_Plugin) {
  _inherits(Tus, _Plugin);

  function Tus(uppy, opts) {
    _classCallCheck(this, Tus);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.type = 'uploader';
    _this.id = 'Tus';
    _this.title = 'Tus';

    // set default options
    var defaultOptions = {
      resume: true,
      autoRetry: true,
      useFastRemoteRetry: true,
      limit: 0,
      retryDelays: [0, 1000, 3000, 5000]

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    // Simultaneous upload limiting is shared across all uploads with this plugin.
    if (typeof _this.opts.limit === 'number' && _this.opts.limit !== 0) {
      _this.limitUploads = limitPromises(_this.opts.limit);
    } else {
      _this.limitUploads = function (fn) {
        return fn;
      };
    }

    _this.uploaders = Object.create(null);
    _this.uploaderEvents = Object.create(null);
    _this.uploaderSockets = Object.create(null);

    _this.handleResetProgress = _this.handleResetProgress.bind(_this);
    _this.handleUpload = _this.handleUpload.bind(_this);
    return _this;
  }

  Tus.prototype.handleResetProgress = function handleResetProgress() {
    var files = _extends({}, this.uppy.getState().files);
    Object.keys(files).forEach(function (fileID) {
      // Only clone the file object if it has a Tus `uploadUrl` attached.
      if (files[fileID].tus && files[fileID].tus.uploadUrl) {
        var tusState = _extends({}, files[fileID].tus);
        delete tusState.uploadUrl;
        files[fileID] = _extends({}, files[fileID], { tus: tusState });
      }
    });

    this.uppy.setState({ files: files });
  };

  /**
   * Clean up all references for a file's upload: the tus.Upload instance,
   * any events related to the file, and the Companion WebSocket connection.
   */


  Tus.prototype.resetUploaderReferences = function resetUploaderReferences(fileID) {
    if (this.uploaders[fileID]) {
      this.uploaders[fileID].abort();
      this.uploaders[fileID] = null;
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID].remove();
      this.uploaderEvents[fileID] = null;
    }
    if (this.uploaderSockets[fileID]) {
      this.uploaderSockets[fileID].close();
      this.uploaderSockets[fileID] = null;
    }
  };

  /**
   * Create a new Tus upload
   *
   * @param {object} file for use with upload
   * @param {integer} current file in a queue
   * @param {integer} total number of files in a queue
   * @returns {Promise}
   */


  Tus.prototype.upload = function upload(file, current, total) {
    var _this2 = this;

    this.resetUploaderReferences(file.id);

    // Create a new tus upload
    return new Promise(function (resolve, reject) {
      var optsTus = _extends({}, tusDefaultOptions, _this2.opts,
      // Install file-specific upload overrides.
      file.tus || {});

      optsTus.onError = function (err) {
        _this2.uppy.log(err);
        _this2.uppy.emit('upload-error', file, err);
        err.message = 'Failed because: ' + err.message;

        _this2.resetUploaderReferences(file.id);
        reject(err);
      };

      optsTus.onProgress = function (bytesUploaded, bytesTotal) {
        _this2.onReceiveUploadUrl(file, upload.url);
        _this2.uppy.emit('upload-progress', file, {
          uploader: _this2,
          bytesUploaded: bytesUploaded,
          bytesTotal: bytesTotal
        });
      };

      optsTus.onSuccess = function () {
        var uploadResp = {
          uploadURL: upload.url
        };

        _this2.uppy.emit('upload-success', file, uploadResp);

        if (upload.url) {
          _this2.uppy.log('Download ' + upload.file.name + ' from ' + upload.url);
        }

        _this2.resetUploaderReferences(file.id);
        resolve(upload);
      };

      var copyProp = function copyProp(obj, srcProp, destProp) {
        if (Object.prototype.hasOwnProperty.call(obj, srcProp) && !Object.prototype.hasOwnProperty.call(obj, destProp)) {
          obj[destProp] = obj[srcProp];
        }
      };

      // tusd uses metadata fields 'filetype' and 'filename'
      var meta = _extends({}, file.meta);
      copyProp(meta, 'type', 'filetype');
      copyProp(meta, 'name', 'filename');
      optsTus.metadata = meta;

      var upload = new tus.Upload(file.data, optsTus);
      _this2.uploaders[file.id] = upload;
      _this2.uploaderEvents[file.id] = createEventTracker(_this2.uppy);

      _this2.onFileRemove(file.id, function (targetFileID) {
        _this2.resetUploaderReferences(file.id);
        resolve('upload ' + targetFileID + ' was removed');
      });

      _this2.onPause(file.id, function (isPaused) {
        if (isPaused) {
          upload.abort();
        } else {
          upload.start();
        }
      });

      _this2.onPauseAll(file.id, function () {
        upload.abort();
      });

      _this2.onCancelAll(file.id, function () {
        _this2.resetUploaderReferences(file.id);
        resolve('upload ' + file.id + ' was canceled');
      });

      _this2.onResumeAll(file.id, function () {
        if (file.error) {
          upload.abort();
        }
        upload.start();
      });

      if (!file.isPaused) {
        upload.start();
      }
    });
  };

  Tus.prototype.uploadRemote = function uploadRemote(file, current, total) {
    var _this3 = this;

    this.resetUploaderReferences(file.id);

    var opts = _extends({}, this.opts,
    // Install file-specific upload overrides.
    file.tus || {});

    return new Promise(function (resolve, reject) {
      _this3.uppy.log(file.remote.url);
      if (file.serverToken) {
        return _this3.connectToServerSocket(file).then(function () {
          return resolve();
        }).catch(reject);
      }

      _this3.uppy.emit('upload-started', file);
      var Client = file.remote.providerOptions.provider ? Provider : RequestClient;
      var client = new Client(_this3.uppy, file.remote.providerOptions);
      client.post(file.remote.url, _extends({}, file.remote.body, {
        endpoint: opts.endpoint,
        uploadUrl: opts.uploadUrl,
        protocol: 'tus',
        size: file.data.size,
        metadata: file.meta
      })).then(function (res) {
        _this3.uppy.setFileState(file.id, { serverToken: res.token });
        file = _this3.uppy.getFile(file.id);
        return file;
      }).then(function (file) {
        return _this3.connectToServerSocket(file);
      }).then(function () {
        resolve();
      }).catch(function (err) {
        reject(new Error(err));
      });
    });
  };

  Tus.prototype.connectToServerSocket = function connectToServerSocket(file) {
    var _this4 = this;

    return new Promise(function (resolve, reject) {
      var token = file.serverToken;
      var host = getSocketHost(file.remote.companionUrl);
      var socket = new Socket({ target: host + '/api/' + token });
      _this4.uploaderSockets[file.id] = socket;
      _this4.uploaderEvents[file.id] = createEventTracker(_this4.uppy);

      _this4.onFileRemove(file.id, function () {
        socket.send('pause', {});
        resolve('upload ' + file.id + ' was removed');
      });

      _this4.onPause(file.id, function (isPaused) {
        isPaused ? socket.send('pause', {}) : socket.send('resume', {});
      });

      _this4.onPauseAll(file.id, function () {
        return socket.send('pause', {});
      });

      _this4.onCancelAll(file.id, function () {
        return socket.send('pause', {});
      });

      _this4.onResumeAll(file.id, function () {
        if (file.error) {
          socket.send('pause', {});
        }
        socket.send('resume', {});
      });

      _this4.onRetry(file.id, function () {
        socket.send('pause', {});
        socket.send('resume', {});
      });

      _this4.onRetryAll(file.id, function () {
        socket.send('pause', {});
        socket.send('resume', {});
      });

      if (file.isPaused) {
        socket.send('pause', {});
      }

      socket.on('progress', function (progressData) {
        return emitSocketProgress(_this4, progressData, file);
      });

      socket.on('error', function (errData) {
        var message = errData.error.message;

        var error = _extends(new Error(message), { cause: errData.error });

        // If the remote retry optimisation should not be used,
        // close the socket—this will tell companion to clear state and delete the file.
        if (!_this4.opts.useFastRemoteRetry) {
          _this4.resetUploaderReferences(file.id);
          // Remove the serverToken so that a new one will be created for the retry.
          _this4.uppy.setFileState(file.id, {
            serverToken: null
          });
        }

        _this4.uppy.emit('upload-error', file, error);
        reject(error);
      });

      socket.on('success', function (data) {
        var uploadResp = {
          uploadURL: data.url
        };

        _this4.uppy.emit('upload-success', file, uploadResp);
        _this4.resetUploaderReferences(file.id);
        resolve();
      });
    });
  };

  /**
   * Store the uploadUrl on the file options, so that when Golden Retriever
   * restores state, we will continue uploading to the correct URL.
   */


  Tus.prototype.onReceiveUploadUrl = function onReceiveUploadUrl(file, uploadURL) {
    var currentFile = this.uppy.getFile(file.id);
    if (!currentFile) return;
    // Only do the update if we didn't have an upload URL yet.
    if (!currentFile.tus || currentFile.tus.uploadUrl !== uploadURL) {
      this.uppy.log('[Tus] Storing upload url');
      this.uppy.setFileState(currentFile.id, {
        tus: _extends({}, currentFile.tus, {
          uploadUrl: uploadURL
        })
      });
    }
  };

  Tus.prototype.onFileRemove = function onFileRemove(fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', function (file) {
      if (fileID === file.id) cb(file.id);
    });
  };

  Tus.prototype.onPause = function onPause(fileID, cb) {
    this.uploaderEvents[fileID].on('upload-pause', function (targetFileID, isPaused) {
      if (fileID === targetFileID) {
        // const isPaused = this.uppy.pauseResume(fileID)
        cb(isPaused);
      }
    });
  };

  Tus.prototype.onRetry = function onRetry(fileID, cb) {
    this.uploaderEvents[fileID].on('upload-retry', function (targetFileID) {
      if (fileID === targetFileID) {
        cb();
      }
    });
  };

  Tus.prototype.onRetryAll = function onRetryAll(fileID, cb) {
    var _this5 = this;

    this.uploaderEvents[fileID].on('retry-all', function (filesToRetry) {
      if (!_this5.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.onPauseAll = function onPauseAll(fileID, cb) {
    var _this6 = this;

    this.uploaderEvents[fileID].on('pause-all', function () {
      if (!_this6.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.onCancelAll = function onCancelAll(fileID, cb) {
    var _this7 = this;

    this.uploaderEvents[fileID].on('cancel-all', function () {
      if (!_this7.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.onResumeAll = function onResumeAll(fileID, cb) {
    var _this8 = this;

    this.uploaderEvents[fileID].on('resume-all', function () {
      if (!_this8.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.uploadFiles = function uploadFiles(files) {
    var _this9 = this;

    var actions = files.map(function (file, i) {
      var current = parseInt(i, 10) + 1;
      var total = files.length;

      if (file.error) {
        return function () {
          return Promise.reject(new Error(file.error));
        };
      } else if (file.isRemote) {
        // We emit upload-started here, so that it's also emitted for files
        // that have to wait due to the `limit` option.
        _this9.uppy.emit('upload-started', file);
        return _this9.uploadRemote.bind(_this9, file, current, total);
      } else {
        _this9.uppy.emit('upload-started', file);
        return _this9.upload.bind(_this9, file, current, total);
      }
    });

    var promises = actions.map(function (action) {
      var limitedAction = _this9.limitUploads(action);
      return limitedAction();
    });

    return settle(promises);
  };

  Tus.prototype.handleUpload = function handleUpload(fileIDs) {
    var _this10 = this;

    if (fileIDs.length === 0) {
      this.uppy.log('Tus: no files to upload!');
      return Promise.resolve();
    }

    this.uppy.log('Tus is uploading...');
    var filesToUpload = fileIDs.map(function (fileID) {
      return _this10.uppy.getFile(fileID);
    });

    return this.uploadFiles(filesToUpload).then(function () {
      return null;
    });
  };

  Tus.prototype.install = function install() {
    this.uppy.setState({
      capabilities: _extends({}, this.uppy.getState().capabilities, {
        resumableUploads: true
      })
    });
    this.uppy.addUploader(this.handleUpload);

    this.uppy.on('reset-progress', this.handleResetProgress);

    if (this.opts.autoRetry) {
      this.uppy.on('back-online', this.uppy.retryAll);
    }
  };

  Tus.prototype.uninstall = function uninstall() {
    this.uppy.setState({
      capabilities: _extends({}, this.uppy.getState().capabilities, {
        resumableUploads: false
      })
    });
    this.uppy.removeUploader(this.handleUpload);

    if (this.opts.autoRetry) {
      this.uppy.off('back-online', this.uppy.retryAll);
    }
  };

  return Tus;
}(Plugin);

},{"./../../companion-client":37,"./../../core":40,"./../../utils/lib/emitSocketProgress":47,"./../../utils/lib/getSocketHost":52,"./../../utils/lib/limitPromises":55,"./../../utils/lib/settle":57,"tus-js-client":28}],46:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Translates strings with interpolation & pluralization support.
 * Extensible with custom dictionaries and pluralization functions.
 *
 * Borrows heavily from and inspired by Polyglot https://github.com/airbnb/polyglot.js,
 * basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
 * and can be easily added among with dictionaries, nested objects are used for pluralization
 * as opposed to `||||` delimeter
 *
 * Usage example: `translator.translate('files_chosen', {smart_count: 3})`
 *
 * @param {object|Array<object>} locale Locale or list of locales.
 */
module.exports = function () {
  function Translator(locales) {
    var _this = this;

    _classCallCheck(this, Translator);

    this.locale = {
      strings: {},
      pluralize: function pluralize(n) {
        if (n === 1) {
          return 0;
        }
        return 1;
      }
    };

    if (Array.isArray(locales)) {
      locales.forEach(function (locale) {
        return _this._apply(locale);
      });
    } else {
      this._apply(locales);
    }
  }

  Translator.prototype._apply = function _apply(locale) {
    if (!locale || !locale.strings) {
      return;
    }

    var prevLocale = this.locale;
    this.locale = _extends({}, prevLocale, {
      strings: _extends({}, prevLocale.strings, locale.strings)
    });
    this.locale.pluralize = locale.pluralize || prevLocale.pluralize;
  };

  /**
   * Takes a string with placeholder variables like `%{smart_count} file selected`
   * and replaces it with values from options `{smart_count: 5}`
   *
   * @license https://github.com/airbnb/polyglot.js/blob/master/LICENSE
   * taken from https://github.com/airbnb/polyglot.js/blob/master/lib/polyglot.js#L299
   *
   * @param {string} phrase that needs interpolation, with placeholders
   * @param {object} options with values that will be used to replace placeholders
   * @return {string} interpolated
   */


  Translator.prototype.interpolate = function interpolate(phrase, options) {
    var _String$prototype = String.prototype,
        split = _String$prototype.split,
        replace = _String$prototype.replace;

    var dollarRegex = /\$/g;
    var dollarBillsYall = '$$$$';
    var interpolated = [phrase];

    for (var arg in options) {
      if (arg !== '_' && options.hasOwnProperty(arg)) {
        // Ensure replacement value is escaped to prevent special $-prefixed
        // regex replace tokens. the "$$$$" is needed because each "$" needs to
        // be escaped with "$" itself, and we need two in the resulting output.
        var replacement = options[arg];
        if (typeof replacement === 'string') {
          replacement = replace.call(options[arg], dollarRegex, dollarBillsYall);
        }
        // We create a new `RegExp` each time instead of using a more-efficient
        // string replace so that the same argument can be replaced multiple times
        // in the same phrase.
        interpolated = insertReplacement(interpolated, new RegExp('%\\{' + arg + '\\}', 'g'), replacement);
      }
    }

    return interpolated;

    function insertReplacement(source, rx, replacement) {
      var newParts = [];
      source.forEach(function (chunk) {
        split.call(chunk, rx).forEach(function (raw, i, list) {
          if (raw !== '') {
            newParts.push(raw);
          }

          // Interlace with the `replacement` value
          if (i < list.length - 1) {
            newParts.push(replacement);
          }
        });
      });
      return newParts;
    }
  };

  /**
   * Public translate method
   *
   * @param {string} key
   * @param {object} options with values that will be used later to replace placeholders in string
   * @return {string} translated (and interpolated)
   */


  Translator.prototype.translate = function translate(key, options) {
    return this.translateArray(key, options).join('');
  };

  /**
   * Get a translation and return the translated and interpolated parts as an array.
   * @param {string} key
   * @param {object} options with values that will be used to replace placeholders
   * @return {Array} The translated and interpolated parts, in order.
   */


  Translator.prototype.translateArray = function translateArray(key, options) {
    if (options && typeof options.smart_count !== 'undefined') {
      var plural = this.locale.pluralize(options.smart_count);
      return this.interpolate(this.locale.strings[key][plural], options);
    }

    return this.interpolate(this.locale.strings[key], options);
  };

  return Translator;
}();

},{}],47:[function(require,module,exports){
var throttle = require('lodash.throttle');

function _emitSocketProgress(uploader, progressData, file) {
  var progress = progressData.progress,
      bytesUploaded = progressData.bytesUploaded,
      bytesTotal = progressData.bytesTotal;

  if (progress) {
    uploader.uppy.log('Upload progress: ' + progress);
    uploader.uppy.emit('upload-progress', file, {
      uploader: uploader,
      bytesUploaded: bytesUploaded,
      bytesTotal: bytesTotal
    });
  }
}

module.exports = throttle(_emitSocketProgress, 300, { leading: true, trailing: true });

},{"lodash.throttle":11}],48:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isDOMElement = require('./isDOMElement');

/**
 * Find a DOM element.
 *
 * @param {Node|string} element
 * @return {Node|null}
 */
module.exports = function findDOMElement(element) {
  var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

  if (typeof element === 'string') {
    return context.querySelector(element);
  }

  if ((typeof element === 'undefined' ? 'undefined' : _typeof(element)) === 'object' && isDOMElement(element)) {
    return element;
  }
};

},{"./isDOMElement":54}],49:[function(require,module,exports){
/**
 * Takes a file object and turns it into fileID, by converting file.name to lowercase,
 * removing extra characters and adding type, size and lastModified
 *
 * @param {Object} file
 * @return {String} the fileID
 *
 */
module.exports = function generateFileID(file) {
  // filter is needed to not join empty values with `-`
  return ['uppy', file.name ? file.name.toLowerCase().replace(/[^A-Z0-9]/ig, '') : '', file.type, file.data.size, file.data.lastModified].filter(function (val) {
    return val;
  }).join('-');
};

},{}],50:[function(require,module,exports){
/**
* Takes a full filename string and returns an object {name, extension}
*
* @param {string} fullFileName
* @return {object} {name, extension}
*/
module.exports = function getFileNameAndExtension(fullFileName) {
  var re = /(?:\.([^.]+))?$/;
  var fileExt = re.exec(fullFileName)[1];
  var fileName = fullFileName.replace('.' + fileExt, '');
  return {
    name: fileName,
    extension: fileExt
  };
};

},{}],51:[function(require,module,exports){
var getFileNameAndExtension = require('./getFileNameAndExtension');
var mimeTypes = require('./mimeTypes');

module.exports = function getFileType(file) {
  var fileExtension = file.name ? getFileNameAndExtension(file.name).extension : null;
  fileExtension = fileExtension ? fileExtension.toLowerCase() : null;

  if (file.isRemote) {
    // some remote providers do not support file types
    return file.type ? file.type : mimeTypes[fileExtension];
  }

  // check if mime type is set in the file object
  if (file.type) {
    return file.type;
  }

  // see if we can map extension to a mime type
  if (fileExtension && mimeTypes[fileExtension]) {
    return mimeTypes[fileExtension];
  }

  // if all fails, fall back to a generic byte stream type
  return 'application/octet-stream';
};

},{"./getFileNameAndExtension":50,"./mimeTypes":56}],52:[function(require,module,exports){
module.exports = function getSocketHost(url) {
  // get the host domain
  var regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?(?:www\.)?([^\n]+)/i;
  var host = regex.exec(url)[1];
  var socketProtocol = /^http:\/\//i.test(url) ? 'ws' : 'wss';

  return socketProtocol + '://' + host;
};

},{}],53:[function(require,module,exports){
/**
 * Returns a timestamp in the format of `hours:minutes:seconds`
*/
module.exports = function getTimeStamp() {
  var date = new Date();
  var hours = pad(date.getHours().toString());
  var minutes = pad(date.getMinutes().toString());
  var seconds = pad(date.getSeconds().toString());
  return hours + ':' + minutes + ':' + seconds;
};

/**
 * Adds zero to strings shorter than two characters
*/
function pad(str) {
  return str.length !== 2 ? 0 + str : str;
}

},{}],54:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Check if an object is a DOM element. Duck-typing based on `nodeType`.
 *
 * @param {*} obj
 */
module.exports = function isDOMElement(obj) {
  return obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj.nodeType === Node.ELEMENT_NODE;
};

},{}],55:[function(require,module,exports){
/**
 * Limit the amount of simultaneously pending Promises.
 * Returns a function that, when passed a function `fn`,
 * will make sure that at most `limit` calls to `fn` are pending.
 *
 * @param {number} limit
 * @return {function()}
 */
module.exports = function limitPromises(limit) {
  var pending = 0;
  var queue = [];
  return function (fn) {
    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var call = function call() {
        pending++;
        var promise = fn.apply(undefined, args);
        promise.then(onfinish, onfinish);
        return promise;
      };

      if (pending >= limit) {
        return new Promise(function (resolve, reject) {
          queue.push(function () {
            call().then(resolve, reject);
          });
        });
      }
      return call();
    };
  };
  function onfinish() {
    pending--;
    var next = queue.shift();
    if (next) next();
  }
};

},{}],56:[function(require,module,exports){
module.exports = {
  'md': 'text/markdown',
  'markdown': 'text/markdown',
  'mp4': 'video/mp4',
  'mp3': 'audio/mp3',
  'svg': 'image/svg+xml',
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'yaml': 'text/yaml',
  'yml': 'text/yaml',
  'csv': 'text/csv',
  'avi': 'video/x-msvideo',
  'mks': 'video/x-matroska',
  'mkv': 'video/x-matroska',
  'mov': 'video/quicktime',
  'doc': 'application/msword',
  'docm': 'application/vnd.ms-word.document.macroenabled.12',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'dot': 'application/msword',
  'dotm': 'application/vnd.ms-word.template.macroenabled.12',
  'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'xla': 'application/vnd.ms-excel',
  'xlam': 'application/vnd.ms-excel.addin.macroenabled.12',
  'xlc': 'application/vnd.ms-excel',
  'xlf': 'application/x-xliff+xml',
  'xlm': 'application/vnd.ms-excel',
  'xls': 'application/vnd.ms-excel',
  'xlsb': 'application/vnd.ms-excel.sheet.binary.macroenabled.12',
  'xlsm': 'application/vnd.ms-excel.sheet.macroenabled.12',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xlt': 'application/vnd.ms-excel',
  'xltm': 'application/vnd.ms-excel.template.macroenabled.12',
  'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'xlw': 'application/vnd.ms-excel'
};

},{}],57:[function(require,module,exports){
module.exports = function settle(promises) {
  var resolutions = [];
  var rejections = [];
  function resolved(value) {
    resolutions.push(value);
  }
  function rejected(error) {
    rejections.push(error);
  }

  var wait = Promise.all(promises.map(function (promise) {
    return promise.then(resolved, rejected);
  }));

  return wait.then(function () {
    return {
      successful: resolutions,
      failed: rejections
    };
  });
};

},{}],58:[function(require,module,exports){
/**
 * Converts list into array
*/
module.exports = function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
};

},{}],59:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],60:[function(require,module,exports){
require('es6-promise/auto');
require('whatwg-fetch');
var Uppy = require('./../../../../packages/@uppy/core');
var DragDrop = require('./../../../../packages/@uppy/drag-drop');
var ProgressBar = require('./../../../../packages/@uppy/progress-bar');
var Tus = require('./../../../../packages/@uppy/tus');

var uppyOne = new Uppy({ debug: true, autoProceed: true });
uppyOne.use(DragDrop, { target: '.UppyDragDrop-One' }).use(Tus, { endpoint: 'https://master.tus.io/files/' }).use(ProgressBar, { target: '.UppyDragDrop-One-Progress', hideAfterFinish: false });

var uppyTwo = new Uppy({ debug: true, autoProceed: false });
uppyTwo.use(DragDrop, { target: '#UppyDragDrop-Two' }).use(Tus, { endpoint: 'https://master.tus.io/files/' }).use(ProgressBar, { target: '.UppyDragDrop-Two-Progress', hideAfterFinish: false });

var uploadBtn = document.querySelector('.UppyDragDrop-Two-Upload');
uploadBtn.addEventListener('click', function () {
  uppyTwo.upload();
});

},{"./../../../../packages/@uppy/core":40,"./../../../../packages/@uppy/drag-drop":42,"./../../../../packages/@uppy/progress-bar":43,"./../../../../packages/@uppy/tus":45,"es6-promise/auto":6,"whatwg-fetch":31}]},{},[60])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvY3VpZC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9jdWlkL2xpYi9maW5nZXJwcmludC5icm93c2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2N1aWQvbGliL2dldFJhbmRvbVZhbHVlLmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvY3VpZC9saWIvcGFkLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2RyYWctZHJvcC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9hdXRvLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvZXM2LXByb21pc2UuanMiLCIuLi9ub2RlX21vZHVsZXMvZXh0ZW5kL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2ZsYXR0ZW4vaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvanMtYmFzZTY0L2Jhc2U2NC5qcyIsIi4uL25vZGVfbW9kdWxlcy9sb2Rhc2gudGhyb3R0bGUvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvbWltZS1tYXRjaC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9uYW1lc3BhY2UtZW1pdHRlci9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9wcmVhY3QvZGlzdC9wcmVhY3QuanMiLCIuLi9ub2RlX21vZHVsZXMvcHJldHRpZXItYnl0ZXMvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmdpZnkvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvcmVxdWlyZXMtcG9ydC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9ydW4tcGFyYWxsZWwvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvdHVzLWpzLWNsaWVudC9saWIuZXM1L2Jyb3dzZXIvaXNDb3Jkb3ZhLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS9icm93c2VyL2lzUmVhY3ROYXRpdmUuanMiLCIuLi9ub2RlX21vZHVsZXMvdHVzLWpzLWNsaWVudC9saWIuZXM1L2Jyb3dzZXIvcmVhZEFzQnl0ZUFycmF5LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS9icm93c2VyL3JlcXVlc3QuanMiLCIuLi9ub2RlX21vZHVsZXMvdHVzLWpzLWNsaWVudC9saWIuZXM1L2Jyb3dzZXIvc291cmNlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS9icm93c2VyL3N0b3JhZ2UuanMiLCIuLi9ub2RlX21vZHVsZXMvdHVzLWpzLWNsaWVudC9saWIuZXM1L2Jyb3dzZXIvdXJpVG9CbG9iLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS9lcnJvci5qcyIsIi4uL25vZGVfbW9kdWxlcy90dXMtanMtY2xpZW50L2xpYi5lczUvZmluZ2VycHJpbnQuanMiLCIuLi9ub2RlX21vZHVsZXMvdHVzLWpzLWNsaWVudC9saWIuZXM1L2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS91cGxvYWQuanMiLCIuLi9ub2RlX21vZHVsZXMvdXJsLXBhcnNlL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3doYXR3Zy1mZXRjaC9kaXN0L2ZldGNoLnVtZC5qcyIsIi4uL25vZGVfbW9kdWxlcy93aWxkY2FyZC9pbmRleC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L2NvbXBhbmlvbi1jbGllbnQvc3JjL0F1dGhFcnJvci5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L2NvbXBhbmlvbi1jbGllbnQvc3JjL1Byb3ZpZGVyLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvY29tcGFuaW9uLWNsaWVudC9zcmMvUmVxdWVzdENsaWVudC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L2NvbXBhbmlvbi1jbGllbnQvc3JjL1NvY2tldC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L2NvbXBhbmlvbi1jbGllbnQvc3JjL2luZGV4LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvY29tcGFuaW9uLWNsaWVudC9zcmMvdG9rZW5TdG9yYWdlLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvY29yZS9zcmMvUGx1Z2luLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvY29yZS9zcmMvaW5kZXguanMiLCIuLi9wYWNrYWdlcy9AdXBweS9jb3JlL3NyYy9zdXBwb3J0c1VwbG9hZFByb2dyZXNzLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvZHJhZy1kcm9wL3NyYy9pbmRleC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L3Byb2dyZXNzLWJhci9zcmMvaW5kZXguanMiLCIuLi9wYWNrYWdlcy9AdXBweS9zdG9yZS1kZWZhdWx0L3NyYy9pbmRleC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L3R1cy9zcmMvaW5kZXguanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvVHJhbnNsYXRvci5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L3V0aWxzL3NyYy9lbWl0U29ja2V0UHJvZ3Jlc3MuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvZmluZERPTUVsZW1lbnQuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvZ2VuZXJhdGVGaWxlSUQuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvZ2V0RmlsZU5hbWVBbmRFeHRlbnNpb24uanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvZ2V0RmlsZVR5cGUuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvZ2V0U29ja2V0SG9zdC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L3V0aWxzL3NyYy9nZXRUaW1lU3RhbXAuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvaXNET01FbGVtZW50LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL2xpbWl0UHJvbWlzZXMuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvbWltZVR5cGVzLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL3NldHRsZS5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L3V0aWxzL3NyYy90b0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9leGFtcGxlcy9kcmFnZHJvcC9hcHAuZXM2Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNW9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QVUsZ0JBQVYsQ0FBMkIsT0FBM0IsRUFBb0MsWUFBWTtBQUM5QyxVQUFRLE1BQVI7QUFDRCxDQUZEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyoqXG4gKiBjdWlkLmpzXG4gKiBDb2xsaXNpb24tcmVzaXN0YW50IFVJRCBnZW5lcmF0b3IgZm9yIGJyb3dzZXJzIGFuZCBub2RlLlxuICogU2VxdWVudGlhbCBmb3IgZmFzdCBkYiBsb29rdXBzIGFuZCByZWNlbmN5IHNvcnRpbmcuXG4gKiBTYWZlIGZvciBlbGVtZW50IElEcyBhbmQgc2VydmVyLXNpZGUgbG9va3Vwcy5cbiAqXG4gKiBFeHRyYWN0ZWQgZnJvbSBDTENUUlxuICpcbiAqIENvcHlyaWdodCAoYykgRXJpYyBFbGxpb3R0IDIwMTJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxudmFyIGZpbmdlcnByaW50ID0gcmVxdWlyZSgnLi9saWIvZmluZ2VycHJpbnQuanMnKTtcbnZhciBwYWQgPSByZXF1aXJlKCcuL2xpYi9wYWQuanMnKTtcbnZhciBnZXRSYW5kb21WYWx1ZSA9IHJlcXVpcmUoJy4vbGliL2dldFJhbmRvbVZhbHVlLmpzJyk7XG5cbnZhciBjID0gMCxcbiAgYmxvY2tTaXplID0gNCxcbiAgYmFzZSA9IDM2LFxuICBkaXNjcmV0ZVZhbHVlcyA9IE1hdGgucG93KGJhc2UsIGJsb2NrU2l6ZSk7XG5cbmZ1bmN0aW9uIHJhbmRvbUJsb2NrICgpIHtcbiAgcmV0dXJuIHBhZCgoZ2V0UmFuZG9tVmFsdWUoKSAqXG4gICAgZGlzY3JldGVWYWx1ZXMgPDwgMClcbiAgICAudG9TdHJpbmcoYmFzZSksIGJsb2NrU2l6ZSk7XG59XG5cbmZ1bmN0aW9uIHNhZmVDb3VudGVyICgpIHtcbiAgYyA9IGMgPCBkaXNjcmV0ZVZhbHVlcyA/IGMgOiAwO1xuICBjKys7IC8vIHRoaXMgaXMgbm90IHN1YmxpbWluYWxcbiAgcmV0dXJuIGMgLSAxO1xufVxuXG5mdW5jdGlvbiBjdWlkICgpIHtcbiAgLy8gU3RhcnRpbmcgd2l0aCBhIGxvd2VyY2FzZSBsZXR0ZXIgbWFrZXNcbiAgLy8gaXQgSFRNTCBlbGVtZW50IElEIGZyaWVuZGx5LlxuICB2YXIgbGV0dGVyID0gJ2MnLCAvLyBoYXJkLWNvZGVkIGFsbG93cyBmb3Igc2VxdWVudGlhbCBhY2Nlc3NcblxuICAgIC8vIHRpbWVzdGFtcFxuICAgIC8vIHdhcm5pbmc6IHRoaXMgZXhwb3NlcyB0aGUgZXhhY3QgZGF0ZSBhbmQgdGltZVxuICAgIC8vIHRoYXQgdGhlIHVpZCB3YXMgY3JlYXRlZC5cbiAgICB0aW1lc3RhbXAgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkpLnRvU3RyaW5nKGJhc2UpLFxuXG4gICAgLy8gUHJldmVudCBzYW1lLW1hY2hpbmUgY29sbGlzaW9ucy5cbiAgICBjb3VudGVyID0gcGFkKHNhZmVDb3VudGVyKCkudG9TdHJpbmcoYmFzZSksIGJsb2NrU2l6ZSksXG5cbiAgICAvLyBBIGZldyBjaGFycyB0byBnZW5lcmF0ZSBkaXN0aW5jdCBpZHMgZm9yIGRpZmZlcmVudFxuICAgIC8vIGNsaWVudHMgKHNvIGRpZmZlcmVudCBjb21wdXRlcnMgYXJlIGZhciBsZXNzXG4gICAgLy8gbGlrZWx5IHRvIGdlbmVyYXRlIHRoZSBzYW1lIGlkKVxuICAgIHByaW50ID0gZmluZ2VycHJpbnQoKSxcblxuICAgIC8vIEdyYWIgc29tZSBtb3JlIGNoYXJzIGZyb20gTWF0aC5yYW5kb20oKVxuICAgIHJhbmRvbSA9IHJhbmRvbUJsb2NrKCkgKyByYW5kb21CbG9jaygpO1xuXG4gIHJldHVybiBsZXR0ZXIgKyB0aW1lc3RhbXAgKyBjb3VudGVyICsgcHJpbnQgKyByYW5kb207XG59XG5cbmN1aWQuc2x1ZyA9IGZ1bmN0aW9uIHNsdWcgKCkge1xuICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKDM2KSxcbiAgICBjb3VudGVyID0gc2FmZUNvdW50ZXIoKS50b1N0cmluZygzNikuc2xpY2UoLTQpLFxuICAgIHByaW50ID0gZmluZ2VycHJpbnQoKS5zbGljZSgwLCAxKSArXG4gICAgICBmaW5nZXJwcmludCgpLnNsaWNlKC0xKSxcbiAgICByYW5kb20gPSByYW5kb21CbG9jaygpLnNsaWNlKC0yKTtcblxuICByZXR1cm4gZGF0ZS5zbGljZSgtMikgK1xuICAgIGNvdW50ZXIgKyBwcmludCArIHJhbmRvbTtcbn07XG5cbmN1aWQuaXNDdWlkID0gZnVuY3Rpb24gaXNDdWlkIChzdHJpbmdUb0NoZWNrKSB7XG4gIGlmICh0eXBlb2Ygc3RyaW5nVG9DaGVjayAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgaWYgKHN0cmluZ1RvQ2hlY2suc3RhcnRzV2l0aCgnYycpKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuY3VpZC5pc1NsdWcgPSBmdW5jdGlvbiBpc1NsdWcgKHN0cmluZ1RvQ2hlY2spIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmdUb0NoZWNrICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICB2YXIgc3RyaW5nTGVuZ3RoID0gc3RyaW5nVG9DaGVjay5sZW5ndGg7XG4gIGlmIChzdHJpbmdMZW5ndGggPj0gNyAmJiBzdHJpbmdMZW5ndGggPD0gMTApIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59O1xuXG5jdWlkLmZpbmdlcnByaW50ID0gZmluZ2VycHJpbnQ7XG5cbm1vZHVsZS5leHBvcnRzID0gY3VpZDtcbiIsInZhciBwYWQgPSByZXF1aXJlKCcuL3BhZC5qcycpO1xuXG52YXIgZW52ID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgPyB3aW5kb3cgOiBzZWxmO1xudmFyIGdsb2JhbENvdW50ID0gT2JqZWN0LmtleXMoZW52KS5sZW5ndGg7XG52YXIgbWltZVR5cGVzTGVuZ3RoID0gbmF2aWdhdG9yLm1pbWVUeXBlcyA/IG5hdmlnYXRvci5taW1lVHlwZXMubGVuZ3RoIDogMDtcbnZhciBjbGllbnRJZCA9IHBhZCgobWltZVR5cGVzTGVuZ3RoICtcbiAgbmF2aWdhdG9yLnVzZXJBZ2VudC5sZW5ndGgpLnRvU3RyaW5nKDM2KSArXG4gIGdsb2JhbENvdW50LnRvU3RyaW5nKDM2KSwgNCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZmluZ2VycHJpbnQgKCkge1xuICByZXR1cm4gY2xpZW50SWQ7XG59O1xuIiwiXG52YXIgZ2V0UmFuZG9tVmFsdWU7XG5cbnZhciBjcnlwdG8gPSB3aW5kb3cuY3J5cHRvIHx8IHdpbmRvdy5tc0NyeXB0bztcblxuaWYgKGNyeXB0bykge1xuICAgIHZhciBsaW0gPSBNYXRoLnBvdygyLCAzMikgLSAxO1xuICAgIGdldFJhbmRvbVZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hYnMoY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDMyQXJyYXkoMSkpWzBdIC8gbGltKTtcbiAgICB9O1xufSBlbHNlIHtcbiAgICBnZXRSYW5kb21WYWx1ZSA9IE1hdGgucmFuZG9tO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJhbmRvbVZhbHVlO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYWQgKG51bSwgc2l6ZSkge1xuICB2YXIgcyA9ICcwMDAwMDAwMDAnICsgbnVtO1xuICByZXR1cm4gcy5zdWJzdHIocy5sZW5ndGggLSBzaXplKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRyYWdEcm9wXG5cbnZhciBmbGF0dGVuID0gcmVxdWlyZSgnZmxhdHRlbicpXG52YXIgcGFyYWxsZWwgPSByZXF1aXJlKCdydW4tcGFyYWxsZWwnKVxuXG5mdW5jdGlvbiBkcmFnRHJvcCAoZWxlbSwgbGlzdGVuZXJzKSB7XG4gIGlmICh0eXBlb2YgZWxlbSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSBlbGVtXG4gICAgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW0pXG4gICAgaWYgKCFlbGVtKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiJyArIHNlbGVjdG9yICsgJ1wiIGRvZXMgbm90IG1hdGNoIGFueSBIVE1MIGVsZW1lbnRzJylcbiAgICB9XG4gIH1cblxuICBpZiAoIWVsZW0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiJyArIGVsZW0gKyAnXCIgaXMgbm90IGEgdmFsaWQgSFRNTCBlbGVtZW50JylcbiAgfVxuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgbGlzdGVuZXJzID0geyBvbkRyb3A6IGxpc3RlbmVycyB9XG4gIH1cblxuICB2YXIgdGltZW91dFxuXG4gIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgb25EcmFnRW50ZXIsIGZhbHNlKVxuICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgb25EcmFnT3ZlciwgZmFsc2UpXG4gIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2xlYXZlJywgb25EcmFnTGVhdmUsIGZhbHNlKVxuICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCBvbkRyb3AsIGZhbHNlKVxuXG4gIC8vIEZ1bmN0aW9uIHRvIHJlbW92ZSBkcmFnLWRyb3AgbGlzdGVuZXJzXG4gIHJldHVybiBmdW5jdGlvbiByZW1vdmUgKCkge1xuICAgIHJlbW92ZURyYWdDbGFzcygpXG4gICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBvbkRyYWdFbnRlciwgZmFsc2UpXG4gICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIG9uRHJhZ092ZXIsIGZhbHNlKVxuICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJhZ2xlYXZlJywgb25EcmFnTGVhdmUsIGZhbHNlKVxuICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJvcCcsIG9uRHJvcCwgZmFsc2UpXG4gIH1cblxuICBmdW5jdGlvbiBvbkRyYWdFbnRlciAoZSkge1xuICAgIGlmIChsaXN0ZW5lcnMub25EcmFnRW50ZXIpIHtcbiAgICAgIGxpc3RlbmVycy5vbkRyYWdFbnRlcihlKVxuICAgIH1cblxuICAgIC8vIFByZXZlbnQgZXZlbnRcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBvbkRyYWdPdmVyIChlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGlmIChlLmRhdGFUcmFuc2Zlci5pdGVtcykge1xuICAgICAgLy8gT25seSBhZGQgXCJkcmFnXCIgY2xhc3Mgd2hlbiBgaXRlbXNgIGNvbnRhaW5zIGl0ZW1zIHRoYXQgYXJlIGFibGUgdG8gYmVcbiAgICAgIC8vIGhhbmRsZWQgYnkgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzIChmaWxlcyB2cy4gdGV4dClcbiAgICAgIHZhciBpdGVtcyA9IHRvQXJyYXkoZS5kYXRhVHJhbnNmZXIuaXRlbXMpXG4gICAgICB2YXIgZmlsZUl0ZW1zID0gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7IHJldHVybiBpdGVtLmtpbmQgPT09ICdmaWxlJyB9KVxuICAgICAgdmFyIHRleHRJdGVtcyA9IGl0ZW1zLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gaXRlbS5raW5kID09PSAnc3RyaW5nJyB9KVxuXG4gICAgICBpZiAoZmlsZUl0ZW1zLmxlbmd0aCA9PT0gMCAmJiAhbGlzdGVuZXJzLm9uRHJvcFRleHQpIHJldHVyblxuICAgICAgaWYgKHRleHRJdGVtcy5sZW5ndGggPT09IDAgJiYgIWxpc3RlbmVycy5vbkRyb3ApIHJldHVyblxuICAgICAgaWYgKGZpbGVJdGVtcy5sZW5ndGggPT09IDAgJiYgdGV4dEl0ZW1zLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG4gICAgfVxuXG4gICAgZWxlbS5jbGFzc0xpc3QuYWRkKCdkcmFnJylcbiAgICBjbGVhclRpbWVvdXQodGltZW91dClcblxuICAgIGlmIChsaXN0ZW5lcnMub25EcmFnT3Zlcikge1xuICAgICAgbGlzdGVuZXJzLm9uRHJhZ092ZXIoZSlcbiAgICB9XG5cbiAgICBlLmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ2NvcHknXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBvbkRyYWdMZWF2ZSAoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmIChsaXN0ZW5lcnMub25EcmFnTGVhdmUpIHtcbiAgICAgIGxpc3RlbmVycy5vbkRyYWdMZWF2ZShlKVxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KHJlbW92ZURyYWdDbGFzcywgNTApXG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRHJvcCAoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmIChsaXN0ZW5lcnMub25EcmFnTGVhdmUpIHtcbiAgICAgIGxpc3RlbmVycy5vbkRyYWdMZWF2ZShlKVxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgIHJlbW92ZURyYWdDbGFzcygpXG5cbiAgICB2YXIgcG9zID0ge1xuICAgICAgeDogZS5jbGllbnRYLFxuICAgICAgeTogZS5jbGllbnRZXG4gICAgfVxuXG4gICAgLy8gdGV4dCBkcm9wIHN1cHBvcnRcbiAgICB2YXIgdGV4dCA9IGUuZGF0YVRyYW5zZmVyLmdldERhdGEoJ3RleHQnKVxuICAgIGlmICh0ZXh0ICYmIGxpc3RlbmVycy5vbkRyb3BUZXh0KSB7XG4gICAgICBsaXN0ZW5lcnMub25Ecm9wVGV4dCh0ZXh0LCBwb3MpXG4gICAgfVxuXG4gICAgLy8gZmlsZSBkcm9wIHN1cHBvcnRcbiAgICBpZiAoZS5kYXRhVHJhbnNmZXIuaXRlbXMpIHtcbiAgICAgIC8vIEhhbmRsZSBkaXJlY3RvcmllcyBpbiBDaHJvbWUgdXNpbmcgdGhlIHByb3ByaWV0YXJ5IEZpbGVTeXN0ZW0gQVBJXG4gICAgICB2YXIgaXRlbXMgPSB0b0FycmF5KGUuZGF0YVRyYW5zZmVyLml0ZW1zKS5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ua2luZCA9PT0gJ2ZpbGUnXG4gICAgICB9KVxuXG4gICAgICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgcGFyYWxsZWwoaXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgICBwcm9jZXNzRW50cnkoaXRlbS53ZWJraXRHZXRBc0VudHJ5KCksIGNiKVxuICAgICAgICB9XG4gICAgICB9KSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAvLyBUaGlzIGNhdGNoZXMgcGVybWlzc2lvbiBlcnJvcnMgd2l0aCBmaWxlOi8vIGluIENocm9tZS4gVGhpcyBzaG91bGQgbmV2ZXJcbiAgICAgICAgLy8gdGhyb3cgaW4gcHJvZHVjdGlvbiBjb2RlLCBzbyB0aGUgdXNlciBkb2VzIG5vdCBuZWVkIHRvIHVzZSB0cnktY2F0Y2guXG4gICAgICAgIGlmIChlcnIpIHRocm93IGVyclxuICAgICAgICBpZiAobGlzdGVuZXJzLm9uRHJvcCkge1xuICAgICAgICAgIGxpc3RlbmVycy5vbkRyb3AoZmxhdHRlbihyZXN1bHRzKSwgcG9zKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZmlsZXMgPSB0b0FycmF5KGUuZGF0YVRyYW5zZmVyLmZpbGVzKVxuXG4gICAgICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgZmlsZXMuZm9yRWFjaChmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICBmaWxlLmZ1bGxQYXRoID0gJy8nICsgZmlsZS5uYW1lXG4gICAgICB9KVxuXG4gICAgICBpZiAobGlzdGVuZXJzLm9uRHJvcCkge1xuICAgICAgICBsaXN0ZW5lcnMub25Ecm9wKGZpbGVzLCBwb3MpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVEcmFnQ2xhc3MgKCkge1xuICAgIGVsZW0uY2xhc3NMaXN0LnJlbW92ZSgnZHJhZycpXG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0VudHJ5IChlbnRyeSwgY2IpIHtcbiAgdmFyIGVudHJpZXMgPSBbXVxuXG4gIGlmIChlbnRyeS5pc0ZpbGUpIHtcbiAgICBlbnRyeS5maWxlKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICBmaWxlLmZ1bGxQYXRoID0gZW50cnkuZnVsbFBhdGggLy8gcHJlc2VydmUgcGF0aGluZyBmb3IgY29uc3VtZXJcbiAgICAgIGNiKG51bGwsIGZpbGUpXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgY2IoZXJyKVxuICAgIH0pXG4gIH0gZWxzZSBpZiAoZW50cnkuaXNEaXJlY3RvcnkpIHtcbiAgICB2YXIgcmVhZGVyID0gZW50cnkuY3JlYXRlUmVhZGVyKClcbiAgICByZWFkRW50cmllcygpXG4gIH1cblxuICBmdW5jdGlvbiByZWFkRW50cmllcyAoKSB7XG4gICAgcmVhZGVyLnJlYWRFbnRyaWVzKGZ1bmN0aW9uIChlbnRyaWVzXykge1xuICAgICAgaWYgKGVudHJpZXNfLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KHRvQXJyYXkoZW50cmllc18pKVxuICAgICAgICByZWFkRW50cmllcygpIC8vIGNvbnRpbnVlIHJlYWRpbmcgZW50cmllcyB1bnRpbCBgcmVhZEVudHJpZXNgIHJldHVybnMgbm8gbW9yZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9uZUVudHJpZXMoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBkb25lRW50cmllcyAoKSB7XG4gICAgcGFyYWxsZWwoZW50cmllcy5tYXAoZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHByb2Nlc3NFbnRyeShlbnRyeSwgY2IpXG4gICAgICB9XG4gICAgfSksIGNiKVxuICB9XG59XG5cbmZ1bmN0aW9uIHRvQXJyYXkgKGxpc3QpIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGxpc3QgfHwgW10sIDApXG59XG4iLCIvLyBUaGlzIGZpbGUgY2FuIGJlIHJlcXVpcmVkIGluIEJyb3dzZXJpZnkgYW5kIE5vZGUuanMgZm9yIGF1dG9tYXRpYyBwb2x5ZmlsbFxuLy8gVG8gdXNlIGl0OiAgcmVxdWlyZSgnZXM2LXByb21pc2UvYXV0bycpO1xuJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLycpLnBvbHlmaWxsKCk7XG4iLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vc3RlZmFucGVubmVyL2VzNi1wcm9taXNlL21hc3Rlci9MSUNFTlNFXG4gKiBAdmVyc2lvbiAgIHY0LjIuNSs3ZjJiNTI2ZFxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcblx0KGdsb2JhbC5FUzZQcm9taXNlID0gZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgeDtcbiAgcmV0dXJuIHggIT09IG51bGwgJiYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nO1xufVxuXG5cblxudmFyIF9pc0FycmF5ID0gdm9pZCAwO1xuaWYgKEFycmF5LmlzQXJyYXkpIHtcbiAgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xufSBlbHNlIHtcbiAgX2lzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG59XG5cbnZhciBpc0FycmF5ID0gX2lzQXJyYXk7XG5cbnZhciBsZW4gPSAwO1xudmFyIHZlcnR4TmV4dCA9IHZvaWQgMDtcbnZhciBjdXN0b21TY2hlZHVsZXJGbiA9IHZvaWQgMDtcblxudmFyIGFzYXAgPSBmdW5jdGlvbiBhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgcXVldWVbbGVuXSA9IGNhbGxiYWNrO1xuICBxdWV1ZVtsZW4gKyAxXSA9IGFyZztcbiAgbGVuICs9IDI7XG4gIGlmIChsZW4gPT09IDIpIHtcbiAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgLy8gSWYgYWRkaXRpb25hbCBjYWxsYmFja3MgYXJlIHF1ZXVlZCBiZWZvcmUgdGhlIHF1ZXVlIGlzIGZsdXNoZWQsIHRoZXlcbiAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgaWYgKGN1c3RvbVNjaGVkdWxlckZuKSB7XG4gICAgICBjdXN0b21TY2hlZHVsZXJGbihmbHVzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHNldFNjaGVkdWxlcihzY2hlZHVsZUZuKSB7XG4gIGN1c3RvbVNjaGVkdWxlckZuID0gc2NoZWR1bGVGbjtcbn1cblxuZnVuY3Rpb24gc2V0QXNhcChhc2FwRm4pIHtcbiAgYXNhcCA9IGFzYXBGbjtcbn1cblxudmFyIGJyb3dzZXJXaW5kb3cgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbnZhciBicm93c2VyR2xvYmFsID0gYnJvd3NlcldpbmRvdyB8fCB7fTtcbnZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG52YXIgaXNOb2RlID0gdHlwZW9mIHNlbGYgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiB7fS50b1N0cmluZy5jYWxsKHByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXSc7XG5cbi8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG52YXIgaXNXb3JrZXIgPSB0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09ICd1bmRlZmluZWQnO1xuXG4vLyBub2RlXG5mdW5jdGlvbiB1c2VOZXh0VGljaygpIHtcbiAgLy8gbm9kZSB2ZXJzaW9uIDAuMTAueCBkaXNwbGF5cyBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgd2hlbiBuZXh0VGljayBpcyB1c2VkIHJlY3Vyc2l2ZWx5XG4gIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgfTtcbn1cblxuLy8gdmVydHhcbmZ1bmN0aW9uIHVzZVZlcnR4VGltZXIoKSB7XG4gIGlmICh0eXBlb2YgdmVydHhOZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2ZXJ0eE5leHQoZmx1c2gpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gdXNlU2V0VGltZW91dCgpO1xufVxuXG5mdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIG5vZGUuZGF0YSA9IGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyO1xuICB9O1xufVxuXG4vLyB3ZWIgd29ya2VyXG5mdW5jdGlvbiB1c2VNZXNzYWdlQ2hhbm5lbCgpIHtcbiAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXNlU2V0VGltZW91dCgpIHtcbiAgLy8gU3RvcmUgc2V0VGltZW91dCByZWZlcmVuY2Ugc28gZXM2LXByb21pc2Ugd2lsbCBiZSB1bmFmZmVjdGVkIGJ5XG4gIC8vIG90aGVyIGNvZGUgbW9kaWZ5aW5nIHNldFRpbWVvdXQgKGxpa2Ugc2lub24udXNlRmFrZVRpbWVycygpKVxuICB2YXIgZ2xvYmFsU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGdsb2JhbFNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICB9O1xufVxuXG52YXIgcXVldWUgPSBuZXcgQXJyYXkoMTAwMCk7XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHZhciBjYWxsYmFjayA9IHF1ZXVlW2ldO1xuICAgIHZhciBhcmcgPSBxdWV1ZVtpICsgMV07XG5cbiAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgcXVldWVbaV0gPSB1bmRlZmluZWQ7XG4gICAgcXVldWVbaSArIDFdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgbGVuID0gMDtcbn1cblxuZnVuY3Rpb24gYXR0ZW1wdFZlcnR4KCkge1xuICB0cnkge1xuICAgIHZhciB2ZXJ0eCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCkucmVxdWlyZSgndmVydHgnKTtcbiAgICB2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgIHJldHVybiB1c2VWZXJ0eFRpbWVyKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gdXNlU2V0VGltZW91dCgpO1xuICB9XG59XG5cbnZhciBzY2hlZHVsZUZsdXNoID0gdm9pZCAwO1xuLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbmlmIChpc05vZGUpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU5leHRUaWNrKCk7XG59IGVsc2UgaWYgKEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG59IGVsc2UgaWYgKGlzV29ya2VyKSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VNZXNzYWdlQ2hhbm5lbCgpO1xufSBlbHNlIGlmIChicm93c2VyV2luZG93ID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IGF0dGVtcHRWZXJ0eCgpO1xufSBlbHNlIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZVNldFRpbWVvdXQoKTtcbn1cblxuZnVuY3Rpb24gdGhlbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgcGFyZW50ID0gdGhpcztcblxuICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcihub29wKTtcblxuICBpZiAoY2hpbGRbUFJPTUlTRV9JRF0gPT09IHVuZGVmaW5lZCkge1xuICAgIG1ha2VQcm9taXNlKGNoaWxkKTtcbiAgfVxuXG4gIHZhciBfc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG5cbiAgaWYgKF9zdGF0ZSkge1xuICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50c1tfc3RhdGUgLSAxXTtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBpbnZva2VDYWxsYmFjayhfc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcGFyZW50Ll9yZXN1bHQpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gIH1cblxuICByZXR1cm4gY2hpbGQ7XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yZXNvbHZlYCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlc29sdmVkIHdpdGggdGhlXG4gIHBhc3NlZCBgdmFsdWVgLiBJdCBpcyBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVzb2x2ZSgxKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoMSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAvLyB2YWx1ZSA9PT0gMVxuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZXNvbHZlXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBbnl9IHZhbHVlIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZXNvbHZlZCB3aXRoXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHRoYXQgd2lsbCBiZWNvbWUgZnVsZmlsbGVkIHdpdGggdGhlIGdpdmVuXG4gIGB2YWx1ZWBcbiovXG5mdW5jdGlvbiByZXNvbHZlJDEob2JqZWN0KSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgaWYgKG9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJiBvYmplY3QuY29uc3RydWN0b3IgPT09IENvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKG5vb3ApO1xuICByZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG52YXIgUFJPTUlTRV9JRCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyKTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBQRU5ESU5HID0gdm9pZCAwO1xudmFyIEZVTEZJTExFRCA9IDE7XG52YXIgUkVKRUNURUQgPSAyO1xuXG52YXIgVFJZX0NBVENIX0VSUk9SID0geyBlcnJvcjogbnVsbCB9O1xuXG5mdW5jdGlvbiBzZWxmRnVsZmlsbG1lbnQoKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbn1cblxuZnVuY3Rpb24gY2Fubm90UmV0dXJuT3duKCkge1xuICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xufVxuXG5mdW5jdGlvbiBnZXRUaGVuKHByb21pc2UpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIFRSWV9DQVRDSF9FUlJPUi5lcnJvciA9IGVycm9yO1xuICAgIHJldHVybiBUUllfQ0FUQ0hfRVJST1I7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5VGhlbih0aGVuJCQxLCB2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKSB7XG4gIHRyeSB7XG4gICAgdGhlbiQkMS5jYWxsKHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlLCB0aGVuJCQxKSB7XG4gIGFzYXAoZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICB2YXIgc2VhbGVkID0gZmFsc2U7XG4gICAgdmFyIGVycm9yID0gdHJ5VGhlbih0aGVuJCQxLCB0aGVuYWJsZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoc2VhbGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICBpZiAodGhlbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgaWYgKHNlYWxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWFsZWQgPSB0cnVlO1xuXG4gICAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICByZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgIH1cbiAgfSwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlKSB7XG4gIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IEZVTEZJTExFRCkge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gIH0gZWxzZSBpZiAodGhlbmFibGUuX3N0YXRlID09PSBSRUpFQ1RFRCkge1xuICAgIHJlamVjdChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgfSBlbHNlIHtcbiAgICBzdWJzY3JpYmUodGhlbmFibGUsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuIHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSwgdGhlbiQkMSkge1xuICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3RvciAmJiB0aGVuJCQxID09PSB0aGVuICYmIG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IucmVzb2x2ZSA9PT0gcmVzb2x2ZSQxKSB7XG4gICAgaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoZW4kJDEgPT09IFRSWV9DQVRDSF9FUlJPUikge1xuICAgICAgcmVqZWN0KHByb21pc2UsIFRSWV9DQVRDSF9FUlJPUi5lcnJvcik7XG4gICAgICBUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBudWxsO1xuICAgIH0gZWxzZSBpZiAodGhlbiQkMSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih0aGVuJCQxKSkge1xuICAgICAgaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4kJDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgIHJlamVjdChwcm9taXNlLCBzZWxmRnVsZmlsbG1lbnQoKSk7XG4gIH0gZWxzZSBpZiAob2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICBoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlLCBnZXRUaGVuKHZhbHVlKSk7XG4gIH0gZWxzZSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gIGlmIChwcm9taXNlLl9vbmVycm9yKSB7XG4gICAgcHJvbWlzZS5fb25lcnJvcihwcm9taXNlLl9yZXN1bHQpO1xuICB9XG5cbiAgcHVibGlzaChwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgcHJvbWlzZS5fc3RhdGUgPSBGVUxGSUxMRUQ7XG5cbiAgaWYgKHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgIGFzYXAocHVibGlzaCwgcHJvbWlzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcHJvbWlzZS5fc3RhdGUgPSBSRUpFQ1RFRDtcbiAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gIGFzYXAocHVibGlzaFJlamVjdGlvbiwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICB2YXIgX3N1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgdmFyIGxlbmd0aCA9IF9zdWJzY3JpYmVycy5sZW5ndGg7XG5cblxuICBwYXJlbnQuX29uZXJyb3IgPSBudWxsO1xuXG4gIF9zdWJzY3JpYmVyc1tsZW5ndGhdID0gY2hpbGQ7XG4gIF9zdWJzY3JpYmVyc1tsZW5ndGggKyBGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgX3N1YnNjcmliZXJzW2xlbmd0aCArIFJFSkVDVEVEXSA9IG9uUmVqZWN0aW9uO1xuXG4gIGlmIChsZW5ndGggPT09IDAgJiYgcGFyZW50Ll9zdGF0ZSkge1xuICAgIGFzYXAocHVibGlzaCwgcGFyZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwdWJsaXNoKHByb21pc2UpIHtcbiAgdmFyIHN1YnNjcmliZXJzID0gcHJvbWlzZS5fc3Vic2NyaWJlcnM7XG4gIHZhciBzZXR0bGVkID0gcHJvbWlzZS5fc3RhdGU7XG5cbiAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBjaGlsZCA9IHZvaWQgMCxcbiAgICAgIGNhbGxiYWNrID0gdm9pZCAwLFxuICAgICAgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICBpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgfVxuICB9XG5cbiAgcHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoID0gMDtcbn1cblxuZnVuY3Rpb24gdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCkge1xuICB0cnkge1xuICAgIHJldHVybiBjYWxsYmFjayhkZXRhaWwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgVFJZX0NBVENIX0VSUk9SLmVycm9yID0gZTtcbiAgICByZXR1cm4gVFJZX0NBVENIX0VSUk9SO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgdmFyIGhhc0NhbGxiYWNrID0gaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICB2YWx1ZSA9IHZvaWQgMCxcbiAgICAgIGVycm9yID0gdm9pZCAwLFxuICAgICAgc3VjY2VlZGVkID0gdm9pZCAwLFxuICAgICAgZmFpbGVkID0gdm9pZCAwO1xuXG4gIGlmIChoYXNDYWxsYmFjaykge1xuICAgIHZhbHVlID0gdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICBpZiAodmFsdWUgPT09IFRSWV9DQVRDSF9FUlJPUikge1xuICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICB2YWx1ZS5lcnJvciA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICByZWplY3QocHJvbWlzZSwgY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgLy8gbm9vcFxuICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKGZhaWxlZCkge1xuICAgIHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gRlVMRklMTEVEKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gUkVKRUNURUQpIHtcbiAgICByZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gIHRyeSB7XG4gICAgcmVzb2x2ZXIoZnVuY3Rpb24gcmVzb2x2ZVByb21pc2UodmFsdWUpIHtcbiAgICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJlamVjdChwcm9taXNlLCBlKTtcbiAgfVxufVxuXG52YXIgaWQgPSAwO1xuZnVuY3Rpb24gbmV4dElkKCkge1xuICByZXR1cm4gaWQrKztcbn1cblxuZnVuY3Rpb24gbWFrZVByb21pc2UocHJvbWlzZSkge1xuICBwcm9taXNlW1BST01JU0VfSURdID0gaWQrKztcbiAgcHJvbWlzZS5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gIHByb21pc2UuX3Jlc3VsdCA9IHVuZGVmaW5lZDtcbiAgcHJvbWlzZS5fc3Vic2NyaWJlcnMgPSBbXTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGlvbkVycm9yKCkge1xuICByZXR1cm4gbmV3IEVycm9yKCdBcnJheSBNZXRob2RzIG11c3QgYmUgcHJvdmlkZWQgYW4gQXJyYXknKTtcbn1cblxudmFyIEVudW1lcmF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEVudW1lcmF0b3IoQ29uc3RydWN0b3IsIGlucHV0KSB7XG4gICAgdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvciA9IENvbnN0cnVjdG9yO1xuICAgIHRoaXMucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3Rvcihub29wKTtcblxuICAgIGlmICghdGhpcy5wcm9taXNlW1BST01JU0VfSURdKSB7XG4gICAgICBtYWtlUHJvbWlzZSh0aGlzLnByb21pc2UpO1xuICAgIH1cblxuICAgIGlmIChpc0FycmF5KGlucHV0KSkge1xuICAgICAgdGhpcy5sZW5ndGggPSBpbnB1dC5sZW5ndGg7XG4gICAgICB0aGlzLl9yZW1haW5pbmcgPSBpbnB1dC5sZW5ndGg7XG5cbiAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG5cbiAgICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBmdWxmaWxsKHRoaXMucHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5sZW5ndGggfHwgMDtcbiAgICAgICAgdGhpcy5fZW51bWVyYXRlKGlucHV0KTtcbiAgICAgICAgaWYgKHRoaXMuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgIGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlamVjdCh0aGlzLnByb21pc2UsIHZhbGlkYXRpb25FcnJvcigpKTtcbiAgICB9XG4gIH1cblxuICBFbnVtZXJhdG9yLnByb3RvdHlwZS5fZW51bWVyYXRlID0gZnVuY3Rpb24gX2VudW1lcmF0ZShpbnB1dCkge1xuICAgIGZvciAodmFyIGkgPSAwOyB0aGlzLl9zdGF0ZSA9PT0gUEVORElORyAmJiBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgfVxuICB9O1xuXG4gIEVudW1lcmF0b3IucHJvdG90eXBlLl9lYWNoRW50cnkgPSBmdW5jdGlvbiBfZWFjaEVudHJ5KGVudHJ5LCBpKSB7XG4gICAgdmFyIGMgPSB0aGlzLl9pbnN0YW5jZUNvbnN0cnVjdG9yO1xuICAgIHZhciByZXNvbHZlJCQxID0gYy5yZXNvbHZlO1xuXG5cbiAgICBpZiAocmVzb2x2ZSQkMSA9PT0gcmVzb2x2ZSQxKSB7XG4gICAgICB2YXIgX3RoZW4gPSBnZXRUaGVuKGVudHJ5KTtcblxuICAgICAgaWYgKF90aGVuID09PSB0aGVuICYmIGVudHJ5Ll9zdGF0ZSAhPT0gUEVORElORykge1xuICAgICAgICB0aGlzLl9zZXR0bGVkQXQoZW50cnkuX3N0YXRlLCBpLCBlbnRyeS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIF90aGVuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuICAgICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgIH0gZWxzZSBpZiAoYyA9PT0gUHJvbWlzZSQxKSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobm9vcCk7XG4gICAgICAgIGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgZW50cnksIF90aGVuKTtcbiAgICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KHByb21pc2UsIGkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KG5ldyBjKGZ1bmN0aW9uIChyZXNvbHZlJCQxKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUkJDEoZW50cnkpO1xuICAgICAgICB9KSwgaSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChyZXNvbHZlJCQxKGVudHJ5KSwgaSk7XG4gICAgfVxuICB9O1xuXG4gIEVudW1lcmF0b3IucHJvdG90eXBlLl9zZXR0bGVkQXQgPSBmdW5jdGlvbiBfc2V0dGxlZEF0KHN0YXRlLCBpLCB2YWx1ZSkge1xuICAgIHZhciBwcm9taXNlID0gdGhpcy5wcm9taXNlO1xuXG5cbiAgICBpZiAocHJvbWlzZS5fc3RhdGUgPT09IFBFTkRJTkcpIHtcbiAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgICBpZiAoc3RhdGUgPT09IFJFSkVDVEVEKSB7XG4gICAgICAgIHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9yZXN1bHRbaV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgfVxuICB9O1xuXG4gIEVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbiBfd2lsbFNldHRsZUF0KHByb21pc2UsIGkpIHtcbiAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICBzdWJzY3JpYmUocHJvbWlzZSwgdW5kZWZpbmVkLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBlbnVtZXJhdG9yLl9zZXR0bGVkQXQoRlVMRklMTEVELCBpLCB2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmV0dXJuIGVudW1lcmF0b3IuX3NldHRsZWRBdChSRUpFQ1RFRCwgaSwgcmVhc29uKTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gRW51bWVyYXRvcjtcbn0oKTtcblxuLyoqXG4gIGBQcm9taXNlLmFsbGAgYWNjZXB0cyBhbiBhcnJheSBvZiBwcm9taXNlcywgYW5kIHJldHVybnMgYSBuZXcgcHJvbWlzZSB3aGljaFxuICBpcyBmdWxmaWxsZWQgd2l0aCBhbiBhcnJheSBvZiBmdWxmaWxsbWVudCB2YWx1ZXMgZm9yIHRoZSBwYXNzZWQgcHJvbWlzZXMsIG9yXG4gIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiBvZiB0aGUgZmlyc3QgcGFzc2VkIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQuIEl0IGNhc3RzIGFsbFxuICBlbGVtZW50cyBvZiB0aGUgcGFzc2VkIGl0ZXJhYmxlIHRvIHByb21pc2VzIGFzIGl0IHJ1bnMgdGhpcyBhbGdvcml0aG0uXG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlc29sdmUoMik7XG4gIGxldCBwcm9taXNlMyA9IHJlc29sdmUoMyk7XG4gIGxldCBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAvLyBUaGUgYXJyYXkgaGVyZSB3b3VsZCBiZSBbIDEsIDIsIDMgXTtcbiAgfSk7XG4gIGBgYFxuXG4gIElmIGFueSBvZiB0aGUgYHByb21pc2VzYCBnaXZlbiB0byBgYWxsYCBhcmUgcmVqZWN0ZWQsIHRoZSBmaXJzdCBwcm9taXNlXG4gIHRoYXQgaXMgcmVqZWN0ZWQgd2lsbCBiZSBnaXZlbiBhcyBhbiBhcmd1bWVudCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZXMnc1xuICByZWplY3Rpb24gaGFuZGxlci4gRm9yIGV4YW1wbGU6XG5cbiAgRXhhbXBsZTpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IHJlc29sdmUoMSk7XG4gIGxldCBwcm9taXNlMiA9IHJlamVjdChuZXcgRXJyb3IoXCIyXCIpKTtcbiAgbGV0IHByb21pc2UzID0gcmVqZWN0KG5ldyBFcnJvcihcIjNcIikpO1xuICBsZXQgcHJvbWlzZXMgPSBbIHByb21pc2UxLCBwcm9taXNlMiwgcHJvbWlzZTMgXTtcblxuICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbihhcnJheSl7XG4gICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnMgYmVjYXVzZSB0aGVyZSBhcmUgcmVqZWN0ZWQgcHJvbWlzZXMhXG4gIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgLy8gZXJyb3IubWVzc2FnZSA9PT0gXCIyXCJcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgYWxsXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBcnJheX0gZW50cmllcyBhcnJheSBvZiBwcm9taXNlc1xuICBAcGFyYW0ge1N0cmluZ30gbGFiZWwgb3B0aW9uYWwgc3RyaW5nIGZvciBsYWJlbGluZyB0aGUgcHJvbWlzZS5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gYWxsIGBwcm9taXNlc2AgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLlxuICBAc3RhdGljXG4qL1xuZnVuY3Rpb24gYWxsKGVudHJpZXMpIHtcbiAgcmV0dXJuIG5ldyBFbnVtZXJhdG9yKHRoaXMsIGVudHJpZXMpLnByb21pc2U7XG59XG5cbi8qKlxuICBgUHJvbWlzZS5yYWNlYCByZXR1cm5zIGEgbmV3IHByb21pc2Ugd2hpY2ggaXMgc2V0dGxlZCBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlXG4gIGZpcnN0IHBhc3NlZCBwcm9taXNlIHRvIHNldHRsZS5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXNvbHZlKCdwcm9taXNlIDEnKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICBsZXQgcHJvbWlzZTIgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMicpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIHJlc3VsdCA9PT0gJ3Byb21pc2UgMicgYmVjYXVzZSBpdCB3YXMgcmVzb2x2ZWQgYmVmb3JlIHByb21pc2UxXG4gICAgLy8gd2FzIHJlc29sdmVkLlxuICB9KTtcbiAgYGBgXG5cbiAgYFByb21pc2UucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdFxuICBzZXR0bGVkIHByb21pc2UgbWF0dGVycy4gRm9yIGV4YW1wbGUsIGV2ZW4gaWYgb3RoZXIgcHJvbWlzZXMgZ2l2ZW4gdG8gdGhlXG4gIGBwcm9taXNlc2AgYXJyYXkgYXJndW1lbnQgYXJlIHJlc29sdmVkLCBidXQgdGhlIGZpcnN0IHNldHRsZWQgcHJvbWlzZSBoYXNcbiAgYmVjb21lIHJlamVjdGVkIGJlZm9yZSB0aGUgb3RoZXIgcHJvbWlzZXMgYmVjYW1lIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gIHByb21pc2Ugd2lsbCBiZWNvbWUgcmVqZWN0ZWQ6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMScpO1xuICAgIH0sIDIwMCk7XG4gIH0pO1xuXG4gIGxldCBwcm9taXNlMiA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcigncHJvbWlzZSAyJykpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFByb21pc2UucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdwcm9taXNlIDInIGJlY2F1c2UgcHJvbWlzZSAyIGJlY2FtZSByZWplY3RlZCBiZWZvcmVcbiAgICAvLyBwcm9taXNlIDEgYmVjYW1lIGZ1bGZpbGxlZFxuICB9KTtcbiAgYGBgXG5cbiAgQW4gZXhhbXBsZSByZWFsLXdvcmxkIHVzZSBjYXNlIGlzIGltcGxlbWVudGluZyB0aW1lb3V0czpcblxuICBgYGBqYXZhc2NyaXB0XG4gIFByb21pc2UucmFjZShbYWpheCgnZm9vLmpzb24nKSwgdGltZW91dCg1MDAwKV0pXG4gIGBgYFxuXG4gIEBtZXRob2QgcmFjZVxuICBAc3RhdGljXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2Ugd2hpY2ggc2V0dGxlcyBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlIGZpcnN0IHBhc3NlZFxuICBwcm9taXNlIHRvIHNldHRsZS5cbiovXG5mdW5jdGlvbiByYWNlKGVudHJpZXMpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkoZW50cmllcykpIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChfLCByZWplY3QpIHtcbiAgICAgIHJldHVybiByZWplY3QobmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gIGBQcm9taXNlLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgcmVqZWN0ZWQgd2l0aCB0aGUgcGFzc2VkIGByZWFzb25gLlxuICBJdCBpcyBzaG9ydGhhbmQgZm9yIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZWplY3RcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FueX0gcmVhc29uIHZhbHVlIHRoYXQgdGhlIHJldHVybmVkIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZCB3aXRoLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSByZWplY3RlZCB3aXRoIHRoZSBnaXZlbiBgcmVhc29uYC5cbiovXG5mdW5jdGlvbiByZWplY3QkMShyZWFzb24pIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcbiAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3Iobm9vcCk7XG4gIHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gbmVlZHNSZXNvbHZlcigpIHtcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xufVxuXG5mdW5jdGlvbiBuZWVkc05ldygpIHtcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbn1cblxuLyoqXG4gIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCwgd2hpY2hcbiAgcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGUgcmVhc29uXG4gIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gIFRlcm1pbm9sb2d5XG4gIC0tLS0tLS0tLS0tXG5cbiAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgLSBgdGhlbmFibGVgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB0aGF0IGRlZmluZXMgYSBgdGhlbmAgbWV0aG9kLlxuICAtIGB2YWx1ZWAgaXMgYW55IGxlZ2FsIEphdmFTY3JpcHQgdmFsdWUgKGluY2x1ZGluZyB1bmRlZmluZWQsIGEgdGhlbmFibGUsIG9yIGEgcHJvbWlzZSkuXG4gIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAtIGByZWFzb25gIGlzIGEgdmFsdWUgdGhhdCBpbmRpY2F0ZXMgd2h5IGEgcHJvbWlzZSB3YXMgcmVqZWN0ZWQuXG4gIC0gYHNldHRsZWRgIHRoZSBmaW5hbCByZXN0aW5nIHN0YXRlIG9mIGEgcHJvbWlzZSwgZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuXG4gIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICBQcm9taXNlcyB0aGF0IGFyZSBmdWxmaWxsZWQgaGF2ZSBhIGZ1bGZpbGxtZW50IHZhbHVlIGFuZCBhcmUgaW4gdGhlIGZ1bGZpbGxlZFxuICBzdGF0ZS4gIFByb21pc2VzIHRoYXQgYXJlIHJlamVjdGVkIGhhdmUgYSByZWplY3Rpb24gcmVhc29uIGFuZCBhcmUgaW4gdGhlXG4gIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gIFByb21pc2VzIGNhbiBhbHNvIGJlIHNhaWQgdG8gKnJlc29sdmUqIGEgdmFsdWUuICBJZiB0aGlzIHZhbHVlIGlzIGFsc28gYVxuICBwcm9taXNlLCB0aGVuIHRoZSBvcmlnaW5hbCBwcm9taXNlJ3Mgc2V0dGxlZCBzdGF0ZSB3aWxsIG1hdGNoIHRoZSB2YWx1ZSdzXG4gIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICBpdHNlbGYgcmVqZWN0LCBhbmQgYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCBmdWxmaWxscyB3aWxsXG4gIGl0c2VsZiBmdWxmaWxsLlxuXG5cbiAgQmFzaWMgVXNhZ2U6XG4gIC0tLS0tLS0tLS0tLVxuXG4gIGBgYGpzXG4gIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gb24gc3VjY2Vzc1xuICAgIHJlc29sdmUodmFsdWUpO1xuXG4gICAgLy8gb24gZmFpbHVyZVxuICAgIHJlamVjdChyZWFzb24pO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAvLyBvbiBmdWxmaWxsbWVudFxuICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAvLyBvbiByZWplY3Rpb25cbiAgfSk7XG4gIGBgYFxuXG4gIEFkdmFuY2VkIFVzYWdlOlxuICAtLS0tLS0tLS0tLS0tLS1cblxuICBQcm9taXNlcyBzaGluZSB3aGVuIGFic3RyYWN0aW5nIGF3YXkgYXN5bmNocm9ub3VzIGludGVyYWN0aW9ucyBzdWNoIGFzXG4gIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gIGBgYGpzXG4gIGZ1bmN0aW9uIGdldEpTT04odXJsKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSB0aGlzLkRPTkUpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgIC8vIG9uIHJlamVjdGlvblxuICB9KTtcbiAgYGBgXG5cbiAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICBgYGBqc1xuICBQcm9taXNlLmFsbChbXG4gICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgZ2V0SlNPTignL2NvbW1lbnRzJylcbiAgXSkudGhlbihmdW5jdGlvbih2YWx1ZXMpe1xuICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICB2YWx1ZXNbMV0gLy8gPT4gY29tbWVudHNKU09OXG5cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9KTtcbiAgYGBgXG5cbiAgQGNsYXNzIFByb21pc2VcbiAgQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZXJcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAY29uc3RydWN0b3JcbiovXG5cbnZhciBQcm9taXNlJDEgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICB0aGlzW1BST01JU0VfSURdID0gbmV4dElkKCk7XG4gICAgdGhpcy5fcmVzdWx0ID0gdGhpcy5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgIGlmIChub29wICE9PSByZXNvbHZlcikge1xuICAgICAgdHlwZW9mIHJlc29sdmVyICE9PSAnZnVuY3Rpb24nICYmIG5lZWRzUmVzb2x2ZXIoKTtcbiAgICAgIHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlID8gaW5pdGlhbGl6ZVByb21pc2UodGhpcywgcmVzb2x2ZXIpIDogbmVlZHNOZXcoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gIHdoaWNoIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlXG4gIHJlYXNvbiB3aHkgdGhlIHByb21pc2UgY2Fubm90IGJlIGZ1bGZpbGxlZC5cbiAgIGBgYGpzXG4gIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHVzZXIgaXMgdW5hdmFpbGFibGUsIGFuZCB5b3UgYXJlIGdpdmVuIHRoZSByZWFzb24gd2h5XG4gIH0pO1xuICBgYGBcbiAgIENoYWluaW5nXG4gIC0tLS0tLS0tXG4gICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZmlyc3QgcHJvbWlzZSdzIGZ1bGZpbGxtZW50XG4gIG9yIHJlamVjdGlvbiBoYW5kbGVyLCBvciByZWplY3RlZCBpZiB0aGUgaGFuZGxlciB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuICAgYGBganNcbiAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiAnZGVmYXVsdCBuYW1lJztcbiAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAvLyBJZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHVzZXJOYW1lYCB3aWxsIGJlIHRoZSB1c2VyJ3MgbmFtZSwgb3RoZXJ3aXNlIGl0XG4gICAgLy8gd2lsbCBiZSBgJ2RlZmF1bHQgbmFtZSdgXG4gIH0pO1xuICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jyk7XG4gIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgLy8gbmV2ZXIgcmVhY2hlZFxuICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAvLyBJZiBgZmluZFVzZXJgIHJlamVjdGVkLCBgcmVhc29uYCB3aWxsIGJlICdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jy5cbiAgfSk7XG4gIGBgYFxuICBJZiB0aGUgZG93bnN0cmVhbSBwcm9taXNlIGRvZXMgbm90IHNwZWNpZnkgYSByZWplY3Rpb24gaGFuZGxlciwgcmVqZWN0aW9uIHJlYXNvbnMgd2lsbCBiZSBwcm9wYWdhdGVkIGZ1cnRoZXIgZG93bnN0cmVhbS5cbiAgIGBgYGpzXG4gIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgIHRocm93IG5ldyBQZWRhZ29naWNhbEV4Y2VwdGlvbignVXBzdHJlYW0gZXJyb3InKTtcbiAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAvLyBuZXZlciByZWFjaGVkXG4gIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgLy8gbmV2ZXIgcmVhY2hlZFxuICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgLy8gVGhlIGBQZWRnYWdvY2lhbEV4Y2VwdGlvbmAgaXMgcHJvcGFnYXRlZCBhbGwgdGhlIHdheSBkb3duIHRvIGhlcmVcbiAgfSk7XG4gIGBgYFxuICAgQXNzaW1pbGF0aW9uXG4gIC0tLS0tLS0tLS0tLVxuICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgcmV0cmlldmVkIGFzeW5jaHJvbm91c2x5LiBUaGlzIGNhbiBiZSBhY2hpZXZlZCBieSByZXR1cm5pbmcgYSBwcm9taXNlIGluIHRoZVxuICBmdWxmaWxsbWVudCBvciByZWplY3Rpb24gaGFuZGxlci4gVGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIHRoZW4gYmUgcGVuZGluZ1xuICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cbiAgIGBgYGpzXG4gIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgfSkudGhlbihmdW5jdGlvbiAoY29tbWVudHMpIHtcbiAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gIH0pO1xuICBgYGBcbiAgIElmIHRoZSBhc3NpbWxpYXRlZCBwcm9taXNlIHJlamVjdHMsIHRoZW4gdGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIGFsc28gcmVqZWN0LlxuICAgYGBganNcbiAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgcmV0dXJuIGZpbmRDb21tZW50c0J5QXV0aG9yKHVzZXIpO1xuICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgZnVsZmlsbHMsIHdlJ2xsIGhhdmUgdGhlIHZhbHVlIGhlcmVcbiAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgfSk7XG4gIGBgYFxuICAgU2ltcGxlIEV4YW1wbGVcbiAgLS0tLS0tLS0tLS0tLS1cbiAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgIGBgYGphdmFzY3JpcHRcbiAgbGV0IHJlc3VsdDtcbiAgIHRyeSB7XG4gICAgcmVzdWx0ID0gZmluZFJlc3VsdCgpO1xuICAgIC8vIHN1Y2Nlc3NcbiAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAvLyBmYWlsdXJlXG4gIH1cbiAgYGBgXG4gICBFcnJiYWNrIEV4YW1wbGVcbiAgIGBgYGpzXG4gIGZpbmRSZXN1bHQoZnVuY3Rpb24ocmVzdWx0LCBlcnIpe1xuICAgIGlmIChlcnIpIHtcbiAgICAgIC8vIGZhaWx1cmVcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc3VjY2Vzc1xuICAgIH1cbiAgfSk7XG4gIGBgYFxuICAgUHJvbWlzZSBFeGFtcGxlO1xuICAgYGBgamF2YXNjcmlwdFxuICBmaW5kUmVzdWx0KCkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIHN1Y2Nlc3NcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyBmYWlsdXJlXG4gIH0pO1xuICBgYGBcbiAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgLS0tLS0tLS0tLS0tLS1cbiAgIFN5bmNocm9ub3VzIEV4YW1wbGVcbiAgIGBgYGphdmFzY3JpcHRcbiAgbGV0IGF1dGhvciwgYm9va3M7XG4gICB0cnkge1xuICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICBib29rcyAgPSBmaW5kQm9va3NCeUF1dGhvcihhdXRob3IpO1xuICAgIC8vIHN1Y2Nlc3NcbiAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAvLyBmYWlsdXJlXG4gIH1cbiAgYGBgXG4gICBFcnJiYWNrIEV4YW1wbGVcbiAgIGBgYGpzXG4gICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG4gICB9XG4gICBmdW5jdGlvbiBmYWlsdXJlKHJlYXNvbikge1xuICAgfVxuICAgZmluZEF1dGhvcihmdW5jdGlvbihhdXRob3IsIGVycil7XG4gICAgaWYgKGVycikge1xuICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgLy8gZmFpbHVyZVxuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICBmaW5kQm9vb2tzQnlBdXRob3IoYXV0aG9yLCBmdW5jdGlvbihib29rcywgZXJyKSB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBmb3VuZEJvb2tzKGJvb2tzKTtcbiAgICAgICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICB9XG4gICAgICAvLyBzdWNjZXNzXG4gICAgfVxuICB9KTtcbiAgYGBgXG4gICBQcm9taXNlIEV4YW1wbGU7XG4gICBgYGBqYXZhc2NyaXB0XG4gIGZpbmRBdXRob3IoKS5cbiAgICB0aGVuKGZpbmRCb29rc0J5QXV0aG9yKS5cbiAgICB0aGVuKGZ1bmN0aW9uKGJvb2tzKXtcbiAgICAgIC8vIGZvdW5kIGJvb2tzXG4gIH0pLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgfSk7XG4gIGBgYFxuICAgQG1ldGhvZCB0aGVuXG4gIEBwYXJhbSB7RnVuY3Rpb259IG9uRnVsZmlsbGVkXG4gIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0ZWRcbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfVxuICAqL1xuXG4gIC8qKlxuICBgY2F0Y2hgIGlzIHNpbXBseSBzdWdhciBmb3IgYHRoZW4odW5kZWZpbmVkLCBvblJlamVjdGlvbilgIHdoaWNoIG1ha2VzIGl0IHRoZSBzYW1lXG4gIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG4gIGBgYGpzXG4gIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gIH1cbiAgLy8gc3luY2hyb25vdXNcbiAgdHJ5IHtcbiAgZmluZEF1dGhvcigpO1xuICB9IGNhdGNoKHJlYXNvbikge1xuICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICB9XG4gIC8vIGFzeW5jIHdpdGggcHJvbWlzZXNcbiAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gIH0pO1xuICBgYGBcbiAgQG1ldGhvZCBjYXRjaFxuICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGlvblxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9XG4gICovXG5cblxuICBQcm9taXNlLnByb3RvdHlwZS5jYXRjaCA9IGZ1bmN0aW9uIF9jYXRjaChvblJlamVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3Rpb24pO1xuICB9O1xuXG4gIC8qKlxuICAgIGBmaW5hbGx5YCB3aWxsIGJlIGludm9rZWQgcmVnYXJkbGVzcyBvZiB0aGUgcHJvbWlzZSdzIGZhdGUganVzdCBhcyBuYXRpdmVcbiAgICB0cnkvY2F0Y2gvZmluYWxseSBiZWhhdmVzXG4gIFxuICAgIFN5bmNocm9ub3VzIGV4YW1wbGU6XG4gIFxuICAgIGBgYGpzXG4gICAgZmluZEF1dGhvcigpIHtcbiAgICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC41KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBBdXRob3IoKTtcbiAgICB9XG4gIFxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZmluZEF1dGhvcigpOyAvLyBzdWNjZWVkIG9yIGZhaWxcbiAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICByZXR1cm4gZmluZE90aGVyQXV0aGVyKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIGFsd2F5cyBydW5zXG4gICAgICAvLyBkb2Vzbid0IGFmZmVjdCB0aGUgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIGBgYFxuICBcbiAgICBBc3luY2hyb25vdXMgZXhhbXBsZTpcbiAgXG4gICAgYGBganNcbiAgICBmaW5kQXV0aG9yKCkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIHJldHVybiBmaW5kT3RoZXJBdXRoZXIoKTtcbiAgICB9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAvLyBhdXRob3Igd2FzIGVpdGhlciBmb3VuZCwgb3Igbm90XG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEBtZXRob2QgZmluYWxseVxuICAgIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgQHJldHVybiB7UHJvbWlzZX1cbiAgKi9cblxuXG4gIFByb21pc2UucHJvdG90eXBlLmZpbmFsbHkgPSBmdW5jdGlvbiBfZmluYWxseShjYWxsYmFjaykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgY29uc3RydWN0b3IgPSBwcm9taXNlLmNvbnN0cnVjdG9yO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XG4gICAgICByZXR1cm4gcHJvbWlzZS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY29uc3RydWN0b3IucmVzb2x2ZShjYWxsYmFjaygpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICByZXR1cm4gY29uc3RydWN0b3IucmVzb2x2ZShjYWxsYmFjaygpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2UudGhlbihjYWxsYmFjaywgY2FsbGJhY2spO1xuICB9O1xuXG4gIHJldHVybiBQcm9taXNlO1xufSgpO1xuXG5Qcm9taXNlJDEucHJvdG90eXBlLnRoZW4gPSB0aGVuO1xuUHJvbWlzZSQxLmFsbCA9IGFsbDtcblByb21pc2UkMS5yYWNlID0gcmFjZTtcblByb21pc2UkMS5yZXNvbHZlID0gcmVzb2x2ZSQxO1xuUHJvbWlzZSQxLnJlamVjdCA9IHJlamVjdCQxO1xuUHJvbWlzZSQxLl9zZXRTY2hlZHVsZXIgPSBzZXRTY2hlZHVsZXI7XG5Qcm9taXNlJDEuX3NldEFzYXAgPSBzZXRBc2FwO1xuUHJvbWlzZSQxLl9hc2FwID0gYXNhcDtcblxuLypnbG9iYWwgc2VsZiovXG5mdW5jdGlvbiBwb2x5ZmlsbCgpIHtcbiAgdmFyIGxvY2FsID0gdm9pZCAwO1xuXG4gIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgIGxvY2FsID0gZ2xvYmFsO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgIGxvY2FsID0gc2VsZjtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgdmFyIFAgPSBsb2NhbC5Qcm9taXNlO1xuXG4gIGlmIChQKSB7XG4gICAgdmFyIHByb21pc2VUb1N0cmluZyA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIHByb21pc2VUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gc2lsZW50bHkgaWdub3JlZFxuICAgIH1cblxuICAgIGlmIChwcm9taXNlVG9TdHJpbmcgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgbG9jYWwuUHJvbWlzZSA9IFByb21pc2UkMTtcbn1cblxuLy8gU3RyYW5nZSBjb21wYXQuLlxuUHJvbWlzZSQxLnBvbHlmaWxsID0gcG9seWZpbGw7XG5Qcm9taXNlJDEuUHJvbWlzZSA9IFByb21pc2UkMTtcblxucmV0dXJuIFByb21pc2UkMTtcblxufSkpKTtcblxuXG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVzNi1wcm9taXNlLm1hcFxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG52YXIgZ09QRCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG5cbnZhciBpc0FycmF5ID0gZnVuY3Rpb24gaXNBcnJheShhcnIpIHtcblx0aWYgKHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0cmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyKTtcblx0fVxuXG5cdHJldHVybiB0b1N0ci5jYWxsKGFycikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG52YXIgaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XG5cdGlmICghb2JqIHx8IHRvU3RyLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHR2YXIgaGFzT3duQ29uc3RydWN0b3IgPSBoYXNPd24uY2FsbChvYmosICdjb25zdHJ1Y3RvcicpO1xuXHR2YXIgaGFzSXNQcm90b3R5cGVPZiA9IG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlICYmIGhhc093bi5jYWxsKG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsICdpc1Byb3RvdHlwZU9mJyk7XG5cdC8vIE5vdCBvd24gY29uc3RydWN0b3IgcHJvcGVydHkgbXVzdCBiZSBPYmplY3Rcblx0aWYgKG9iai5jb25zdHJ1Y3RvciAmJiAhaGFzT3duQ29uc3RydWN0b3IgJiYgIWhhc0lzUHJvdG90eXBlT2YpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBPd24gcHJvcGVydGllcyBhcmUgZW51bWVyYXRlZCBmaXJzdGx5LCBzbyB0byBzcGVlZCB1cCxcblx0Ly8gaWYgbGFzdCBvbmUgaXMgb3duLCB0aGVuIGFsbCBwcm9wZXJ0aWVzIGFyZSBvd24uXG5cdHZhciBrZXk7XG5cdGZvciAoa2V5IGluIG9iaikgeyAvKiovIH1cblxuXHRyZXR1cm4gdHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcgfHwgaGFzT3duLmNhbGwob2JqLCBrZXkpO1xufTtcblxuLy8gSWYgbmFtZSBpcyAnX19wcm90b19fJywgYW5kIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBpcyBhdmFpbGFibGUsIGRlZmluZSBfX3Byb3RvX18gYXMgYW4gb3duIHByb3BlcnR5IG9uIHRhcmdldFxudmFyIHNldFByb3BlcnR5ID0gZnVuY3Rpb24gc2V0UHJvcGVydHkodGFyZ2V0LCBvcHRpb25zKSB7XG5cdGlmIChkZWZpbmVQcm9wZXJ0eSAmJiBvcHRpb25zLm5hbWUgPT09ICdfX3Byb3RvX18nKSB7XG5cdFx0ZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBvcHRpb25zLm5hbWUsIHtcblx0XHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0XHRjb25maWd1cmFibGU6IHRydWUsXG5cdFx0XHR2YWx1ZTogb3B0aW9ucy5uZXdWYWx1ZSxcblx0XHRcdHdyaXRhYmxlOiB0cnVlXG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0dGFyZ2V0W29wdGlvbnMubmFtZV0gPSBvcHRpb25zLm5ld1ZhbHVlO1xuXHR9XG59O1xuXG4vLyBSZXR1cm4gdW5kZWZpbmVkIGluc3RlYWQgb2YgX19wcm90b19fIGlmICdfX3Byb3RvX18nIGlzIG5vdCBhbiBvd24gcHJvcGVydHlcbnZhciBnZXRQcm9wZXJ0eSA9IGZ1bmN0aW9uIGdldFByb3BlcnR5KG9iaiwgbmFtZSkge1xuXHRpZiAobmFtZSA9PT0gJ19fcHJvdG9fXycpIHtcblx0XHRpZiAoIWhhc093bi5jYWxsKG9iaiwgbmFtZSkpIHtcblx0XHRcdHJldHVybiB2b2lkIDA7XG5cdFx0fSBlbHNlIGlmIChnT1BEKSB7XG5cdFx0XHQvLyBJbiBlYXJseSB2ZXJzaW9ucyBvZiBub2RlLCBvYmpbJ19fcHJvdG9fXyddIGlzIGJ1Z2d5IHdoZW4gb2JqIGhhc1xuXHRcdFx0Ly8gX19wcm90b19fIGFzIGFuIG93biBwcm9wZXJ0eS4gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcigpIHdvcmtzLlxuXHRcdFx0cmV0dXJuIGdPUEQob2JqLCBuYW1lKS52YWx1ZTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gb2JqW25hbWVdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQoKSB7XG5cdHZhciBvcHRpb25zLCBuYW1lLCBzcmMsIGNvcHksIGNvcHlJc0FycmF5LCBjbG9uZTtcblx0dmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXTtcblx0dmFyIGkgPSAxO1xuXHR2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcblx0dmFyIGRlZXAgPSBmYWxzZTtcblxuXHQvLyBIYW5kbGUgYSBkZWVwIGNvcHkgc2l0dWF0aW9uXG5cdGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnYm9vbGVhbicpIHtcblx0XHRkZWVwID0gdGFyZ2V0O1xuXHRcdHRhcmdldCA9IGFyZ3VtZW50c1sxXSB8fCB7fTtcblx0XHQvLyBza2lwIHRoZSBib29sZWFuIGFuZCB0aGUgdGFyZ2V0XG5cdFx0aSA9IDI7XG5cdH1cblx0aWYgKHRhcmdldCA9PSBudWxsIHx8ICh0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKSkge1xuXHRcdHRhcmdldCA9IHt9O1xuXHR9XG5cblx0Zm9yICg7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdG9wdGlvbnMgPSBhcmd1bWVudHNbaV07XG5cdFx0Ly8gT25seSBkZWFsIHdpdGggbm9uLW51bGwvdW5kZWZpbmVkIHZhbHVlc1xuXHRcdGlmIChvcHRpb25zICE9IG51bGwpIHtcblx0XHRcdC8vIEV4dGVuZCB0aGUgYmFzZSBvYmplY3Rcblx0XHRcdGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG5cdFx0XHRcdHNyYyA9IGdldFByb3BlcnR5KHRhcmdldCwgbmFtZSk7XG5cdFx0XHRcdGNvcHkgPSBnZXRQcm9wZXJ0eShvcHRpb25zLCBuYW1lKTtcblxuXHRcdFx0XHQvLyBQcmV2ZW50IG5ldmVyLWVuZGluZyBsb29wXG5cdFx0XHRcdGlmICh0YXJnZXQgIT09IGNvcHkpIHtcblx0XHRcdFx0XHQvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcblx0XHRcdFx0XHRpZiAoZGVlcCAmJiBjb3B5ICYmIChpc1BsYWluT2JqZWN0KGNvcHkpIHx8IChjb3B5SXNBcnJheSA9IGlzQXJyYXkoY29weSkpKSkge1xuXHRcdFx0XHRcdFx0aWYgKGNvcHlJc0FycmF5KSB7XG5cdFx0XHRcdFx0XHRcdGNvcHlJc0FycmF5ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdGNsb25lID0gc3JjICYmIGlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuXHRcdFx0XHRcdFx0c2V0UHJvcGVydHkodGFyZ2V0LCB7IG5hbWU6IG5hbWUsIG5ld1ZhbHVlOiBleHRlbmQoZGVlcCwgY2xvbmUsIGNvcHkpIH0pO1xuXG5cdFx0XHRcdFx0Ly8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNvcHkgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdFx0XHRzZXRQcm9wZXJ0eSh0YXJnZXQsIHsgbmFtZTogbmFtZSwgbmV3VmFsdWU6IGNvcHkgfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3Rcblx0cmV0dXJuIHRhcmdldDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdCwgZGVwdGgpIHtcbiAgZGVwdGggPSAodHlwZW9mIGRlcHRoID09ICdudW1iZXInKSA/IGRlcHRoIDogSW5maW5pdHk7XG5cbiAgaWYgKCFkZXB0aCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgICByZXR1cm4gbGlzdC5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gaTsgfSk7XG4gICAgfVxuICAgIHJldHVybiBsaXN0O1xuICB9XG5cbiAgcmV0dXJuIF9mbGF0dGVuKGxpc3QsIDEpO1xuXG4gIGZ1bmN0aW9uIF9mbGF0dGVuKGxpc3QsIGQpIHtcbiAgICByZXR1cm4gbGlzdC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgaXRlbSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkgJiYgZCA8IGRlcHRoKSB7XG4gICAgICAgIHJldHVybiBhY2MuY29uY2F0KF9mbGF0dGVuKGl0ZW0sIGQgKyAxKSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQoaXRlbSk7XG4gICAgICB9XG4gICAgfSwgW10pO1xuICB9XG59O1xuIiwiLypcbiAqICBiYXNlNjQuanNcbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEJTRCAzLUNsYXVzZSBMaWNlbnNlLlxuICogICAgaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICpcbiAqICBSZWZlcmVuY2VzOlxuICogICAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjRcbiAqL1xuOyhmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KGdsb2JhbClcbiAgICAgICAgOiB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWRcbiAgICAgICAgPyBkZWZpbmUoZmFjdG9yeSkgOiBmYWN0b3J5KGdsb2JhbClcbn0oKFxuICAgIHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGZcbiAgICAgICAgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvd1xuICAgICAgICA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsXG46IHRoaXNcbiksIGZ1bmN0aW9uKGdsb2JhbCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBleGlzdGluZyB2ZXJzaW9uIGZvciBub0NvbmZsaWN0KClcbiAgICBnbG9iYWwgPSBnbG9iYWwgfHwge307XG4gICAgdmFyIF9CYXNlNjQgPSBnbG9iYWwuQmFzZTY0O1xuICAgIHZhciB2ZXJzaW9uID0gXCIyLjUuMVwiO1xuICAgIC8vIGlmIG5vZGUuanMgYW5kIE5PVCBSZWFjdCBOYXRpdmUsIHdlIHVzZSBCdWZmZXJcbiAgICB2YXIgYnVmZmVyO1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYnVmZmVyID0gZXZhbChcInJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlclwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBidWZmZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc3RhbnRzXG4gICAgdmFyIGI2NGNoYXJzXG4gICAgICAgID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuICAgIHZhciBiNjR0YWIgPSBmdW5jdGlvbihiaW4pIHtcbiAgICAgICAgdmFyIHQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBiaW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB0W2Jpbi5jaGFyQXQoaSldID0gaTtcbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfShiNjRjaGFycyk7XG4gICAgdmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XG4gICAgLy8gZW5jb2RlciBzdHVmZlxuICAgIHZhciBjYl91dG9iID0gZnVuY3Rpb24oYykge1xuICAgICAgICBpZiAoYy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICB2YXIgY2MgPSBjLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgICAgICByZXR1cm4gY2MgPCAweDgwID8gY1xuICAgICAgICAgICAgICAgIDogY2MgPCAweDgwMCA/IChmcm9tQ2hhckNvZGUoMHhjMCB8IChjYyA+Pj4gNikpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoY2MgJiAweDNmKSkpXG4gICAgICAgICAgICAgICAgOiAoZnJvbUNoYXJDb2RlKDB4ZTAgfCAoKGNjID4+PiAxMikgJiAweDBmKSlcbiAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKChjYyA+Pj4gIDYpICYgMHgzZikpXG4gICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8ICggY2MgICAgICAgICAmIDB4M2YpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgY2MgPSAweDEwMDAwXG4gICAgICAgICAgICAgICAgKyAoYy5jaGFyQ29kZUF0KDApIC0gMHhEODAwKSAqIDB4NDAwXG4gICAgICAgICAgICAgICAgKyAoYy5jaGFyQ29kZUF0KDEpIC0gMHhEQzAwKTtcbiAgICAgICAgICAgIHJldHVybiAoZnJvbUNoYXJDb2RlKDB4ZjAgfCAoKGNjID4+PiAxOCkgJiAweDA3KSlcbiAgICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8ICgoY2MgPj4+IDEyKSAmIDB4M2YpKVxuICAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKChjYyA+Pj4gIDYpICYgMHgzZikpXG4gICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoIGNjICAgICAgICAgJiAweDNmKSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgcmVfdXRvYiA9IC9bXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZGXXxbXlxceDAwLVxceDdGXS9nO1xuICAgIHZhciB1dG9iID0gZnVuY3Rpb24odSkge1xuICAgICAgICByZXR1cm4gdS5yZXBsYWNlKHJlX3V0b2IsIGNiX3V0b2IpO1xuICAgIH07XG4gICAgdmFyIGNiX2VuY29kZSA9IGZ1bmN0aW9uKGNjYykge1xuICAgICAgICB2YXIgcGFkbGVuID0gWzAsIDIsIDFdW2NjYy5sZW5ndGggJSAzXSxcbiAgICAgICAgb3JkID0gY2NjLmNoYXJDb2RlQXQoMCkgPDwgMTZcbiAgICAgICAgICAgIHwgKChjY2MubGVuZ3RoID4gMSA/IGNjYy5jaGFyQ29kZUF0KDEpIDogMCkgPDwgOClcbiAgICAgICAgICAgIHwgKChjY2MubGVuZ3RoID4gMiA/IGNjYy5jaGFyQ29kZUF0KDIpIDogMCkpLFxuICAgICAgICBjaGFycyA9IFtcbiAgICAgICAgICAgIGI2NGNoYXJzLmNoYXJBdCggb3JkID4+PiAxOCksXG4gICAgICAgICAgICBiNjRjaGFycy5jaGFyQXQoKG9yZCA+Pj4gMTIpICYgNjMpLFxuICAgICAgICAgICAgcGFkbGVuID49IDIgPyAnPScgOiBiNjRjaGFycy5jaGFyQXQoKG9yZCA+Pj4gNikgJiA2MyksXG4gICAgICAgICAgICBwYWRsZW4gPj0gMSA/ICc9JyA6IGI2NGNoYXJzLmNoYXJBdChvcmQgJiA2MylcbiAgICAgICAgXTtcbiAgICAgICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xuICAgIH07XG4gICAgdmFyIGJ0b2EgPSBnbG9iYWwuYnRvYSA/IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5idG9hKGIpO1xuICAgIH0gOiBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiBiLnJlcGxhY2UoL1tcXHNcXFNdezEsM30vZywgY2JfZW5jb2RlKTtcbiAgICB9O1xuICAgIHZhciBfZW5jb2RlID0gYnVmZmVyID9cbiAgICAgICAgYnVmZmVyLmZyb20gJiYgVWludDhBcnJheSAmJiBidWZmZXIuZnJvbSAhPT0gVWludDhBcnJheS5mcm9tXG4gICAgICAgID8gZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiAodS5jb25zdHJ1Y3RvciA9PT0gYnVmZmVyLmNvbnN0cnVjdG9yID8gdSA6IGJ1ZmZlci5mcm9tKHUpKVxuICAgICAgICAgICAgICAgIC50b1N0cmluZygnYmFzZTY0JylcbiAgICAgICAgfVxuICAgICAgICA6ICBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgcmV0dXJuICh1LmNvbnN0cnVjdG9yID09PSBidWZmZXIuY29uc3RydWN0b3IgPyB1IDogbmV3ICBidWZmZXIodSkpXG4gICAgICAgICAgICAgICAgLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgICB9XG4gICAgICAgIDogZnVuY3Rpb24gKHUpIHsgcmV0dXJuIGJ0b2EodXRvYih1KSkgfVxuICAgIDtcbiAgICB2YXIgZW5jb2RlID0gZnVuY3Rpb24odSwgdXJpc2FmZSkge1xuICAgICAgICByZXR1cm4gIXVyaXNhZmVcbiAgICAgICAgICAgID8gX2VuY29kZShTdHJpbmcodSkpXG4gICAgICAgICAgICA6IF9lbmNvZGUoU3RyaW5nKHUpKS5yZXBsYWNlKC9bK1xcL10vZywgZnVuY3Rpb24obTApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbTAgPT0gJysnID8gJy0nIDogJ18nO1xuICAgICAgICAgICAgfSkucmVwbGFjZSgvPS9nLCAnJyk7XG4gICAgfTtcbiAgICB2YXIgZW5jb2RlVVJJID0gZnVuY3Rpb24odSkgeyByZXR1cm4gZW5jb2RlKHUsIHRydWUpIH07XG4gICAgLy8gZGVjb2RlciBzdHVmZlxuICAgIHZhciByZV9idG91ID0gbmV3IFJlZ0V4cChbXG4gICAgICAgICdbXFx4QzAtXFx4REZdW1xceDgwLVxceEJGXScsXG4gICAgICAgICdbXFx4RTAtXFx4RUZdW1xceDgwLVxceEJGXXsyfScsXG4gICAgICAgICdbXFx4RjAtXFx4RjddW1xceDgwLVxceEJGXXszfSdcbiAgICBdLmpvaW4oJ3wnKSwgJ2cnKTtcbiAgICB2YXIgY2JfYnRvdSA9IGZ1bmN0aW9uKGNjY2MpIHtcbiAgICAgICAgc3dpdGNoKGNjY2MubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHZhciBjcCA9ICgoMHgwNyAmIGNjY2MuY2hhckNvZGVBdCgwKSkgPDwgMTgpXG4gICAgICAgICAgICAgICAgfCAgICAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpIDw8IDEyKVxuICAgICAgICAgICAgICAgIHwgICAgKCgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDIpKSA8PCAgNilcbiAgICAgICAgICAgICAgICB8ICAgICAoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgzKSksXG4gICAgICAgICAgICBvZmZzZXQgPSBjcCAtIDB4MTAwMDA7XG4gICAgICAgICAgICByZXR1cm4gKGZyb21DaGFyQ29kZSgob2Zmc2V0ICA+Pj4gMTApICsgMHhEODAwKVxuICAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgob2Zmc2V0ICYgMHgzRkYpICsgMHhEQzAwKSk7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBmcm9tQ2hhckNvZGUoXG4gICAgICAgICAgICAgICAgKCgweDBmICYgY2NjYy5jaGFyQ29kZUF0KDApKSA8PCAxMilcbiAgICAgICAgICAgICAgICAgICAgfCAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpIDw8IDYpXG4gICAgICAgICAgICAgICAgICAgIHwgICgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDIpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAgZnJvbUNoYXJDb2RlKFxuICAgICAgICAgICAgICAgICgoMHgxZiAmIGNjY2MuY2hhckNvZGVBdCgwKSkgPDwgNilcbiAgICAgICAgICAgICAgICAgICAgfCAgKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgYnRvdSA9IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgcmV0dXJuIGIucmVwbGFjZShyZV9idG91LCBjYl9idG91KTtcbiAgICB9O1xuICAgIHZhciBjYl9kZWNvZGUgPSBmdW5jdGlvbihjY2NjKSB7XG4gICAgICAgIHZhciBsZW4gPSBjY2NjLmxlbmd0aCxcbiAgICAgICAgcGFkbGVuID0gbGVuICUgNCxcbiAgICAgICAgbiA9IChsZW4gPiAwID8gYjY0dGFiW2NjY2MuY2hhckF0KDApXSA8PCAxOCA6IDApXG4gICAgICAgICAgICB8IChsZW4gPiAxID8gYjY0dGFiW2NjY2MuY2hhckF0KDEpXSA8PCAxMiA6IDApXG4gICAgICAgICAgICB8IChsZW4gPiAyID8gYjY0dGFiW2NjY2MuY2hhckF0KDIpXSA8PCAgNiA6IDApXG4gICAgICAgICAgICB8IChsZW4gPiAzID8gYjY0dGFiW2NjY2MuY2hhckF0KDMpXSAgICAgICA6IDApLFxuICAgICAgICBjaGFycyA9IFtcbiAgICAgICAgICAgIGZyb21DaGFyQ29kZSggbiA+Pj4gMTYpLFxuICAgICAgICAgICAgZnJvbUNoYXJDb2RlKChuID4+PiAgOCkgJiAweGZmKSxcbiAgICAgICAgICAgIGZyb21DaGFyQ29kZSggbiAgICAgICAgICYgMHhmZilcbiAgICAgICAgXTtcbiAgICAgICAgY2hhcnMubGVuZ3RoIC09IFswLCAwLCAyLCAxXVtwYWRsZW5dO1xuICAgICAgICByZXR1cm4gY2hhcnMuam9pbignJyk7XG4gICAgfTtcbiAgICB2YXIgX2F0b2IgPSBnbG9iYWwuYXRvYiA/IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5hdG9iKGEpO1xuICAgIH0gOiBmdW5jdGlvbihhKXtcbiAgICAgICAgcmV0dXJuIGEucmVwbGFjZSgvXFxTezEsNH0vZywgY2JfZGVjb2RlKTtcbiAgICB9O1xuICAgIHZhciBhdG9iID0gZnVuY3Rpb24oYSkge1xuICAgICAgICByZXR1cm4gX2F0b2IoU3RyaW5nKGEpLnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXS9nLCAnJykpO1xuICAgIH07XG4gICAgdmFyIF9kZWNvZGUgPSBidWZmZXIgP1xuICAgICAgICBidWZmZXIuZnJvbSAmJiBVaW50OEFycmF5ICYmIGJ1ZmZlci5mcm9tICE9PSBVaW50OEFycmF5LmZyb21cbiAgICAgICAgPyBmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICByZXR1cm4gKGEuY29uc3RydWN0b3IgPT09IGJ1ZmZlci5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgICAgICAgICA/IGEgOiBidWZmZXIuZnJvbShhLCAnYmFzZTY0JykpLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgOiBmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICByZXR1cm4gKGEuY29uc3RydWN0b3IgPT09IGJ1ZmZlci5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgICAgICAgICA/IGEgOiBuZXcgYnVmZmVyKGEsICdiYXNlNjQnKSkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICA6IGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGJ0b3UoX2F0b2IoYSkpIH07XG4gICAgdmFyIGRlY29kZSA9IGZ1bmN0aW9uKGEpe1xuICAgICAgICByZXR1cm4gX2RlY29kZShcbiAgICAgICAgICAgIFN0cmluZyhhKS5yZXBsYWNlKC9bLV9dL2csIGZ1bmN0aW9uKG0wKSB7IHJldHVybiBtMCA9PSAnLScgPyAnKycgOiAnLycgfSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9dL2csICcnKVxuICAgICAgICApO1xuICAgIH07XG4gICAgdmFyIG5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIEJhc2U2NCA9IGdsb2JhbC5CYXNlNjQ7XG4gICAgICAgIGdsb2JhbC5CYXNlNjQgPSBfQmFzZTY0O1xuICAgICAgICByZXR1cm4gQmFzZTY0O1xuICAgIH07XG4gICAgLy8gZXhwb3J0IEJhc2U2NFxuICAgIGdsb2JhbC5CYXNlNjQgPSB7XG4gICAgICAgIFZFUlNJT046IHZlcnNpb24sXG4gICAgICAgIGF0b2I6IGF0b2IsXG4gICAgICAgIGJ0b2E6IGJ0b2EsXG4gICAgICAgIGZyb21CYXNlNjQ6IGRlY29kZSxcbiAgICAgICAgdG9CYXNlNjQ6IGVuY29kZSxcbiAgICAgICAgdXRvYjogdXRvYixcbiAgICAgICAgZW5jb2RlOiBlbmNvZGUsXG4gICAgICAgIGVuY29kZVVSSTogZW5jb2RlVVJJLFxuICAgICAgICBidG91OiBidG91LFxuICAgICAgICBkZWNvZGU6IGRlY29kZSxcbiAgICAgICAgbm9Db25mbGljdDogbm9Db25mbGljdCxcbiAgICAgICAgX19idWZmZXJfXzogYnVmZmVyXG4gICAgfTtcbiAgICAvLyBpZiBFUzUgaXMgYXZhaWxhYmxlLCBtYWtlIEJhc2U2NC5leHRlbmRTdHJpbmcoKSBhdmFpbGFibGVcbiAgICBpZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgbm9FbnVtID0gZnVuY3Rpb24odil7XG4gICAgICAgICAgICByZXR1cm4ge3ZhbHVlOnYsZW51bWVyYWJsZTpmYWxzZSx3cml0YWJsZTp0cnVlLGNvbmZpZ3VyYWJsZTp0cnVlfTtcbiAgICAgICAgfTtcbiAgICAgICAgZ2xvYmFsLkJhc2U2NC5leHRlbmRTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXG4gICAgICAgICAgICAgICAgU3RyaW5nLnByb3RvdHlwZSwgJ2Zyb21CYXNlNjQnLCBub0VudW0oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlKHRoaXMpXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIFN0cmluZy5wcm90b3R5cGUsICd0b0Jhc2U2NCcsIG5vRW51bShmdW5jdGlvbiAodXJpc2FmZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5jb2RlKHRoaXMsIHVyaXNhZmUpXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIFN0cmluZy5wcm90b3R5cGUsICd0b0Jhc2U2NFVSSScsIG5vRW51bShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmNvZGUodGhpcywgdHJ1ZSlcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vXG4gICAgLy8gZXhwb3J0IEJhc2U2NCB0byB0aGUgbmFtZXNwYWNlXG4gICAgLy9cbiAgICBpZiAoZ2xvYmFsWydNZXRlb3InXSkgeyAvLyBNZXRlb3IuanNcbiAgICAgICAgQmFzZTY0ID0gZ2xvYmFsLkJhc2U2NDtcbiAgICB9XG4gICAgLy8gbW9kdWxlLmV4cG9ydHMgYW5kIEFNRCBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlLlxuICAgIC8vIG1vZHVsZS5leHBvcnRzIGhhcyBwcmVjZWRlbmNlLlxuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5CYXNlNjQgPSBnbG9iYWwuQmFzZTY0O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCl7IHJldHVybiBnbG9iYWwuQmFzZTY0IH0pO1xuICAgIH1cbiAgICAvLyB0aGF0J3MgaXQhXG4gICAgcmV0dXJuIHtCYXNlNjQ6IGdsb2JhbC5CYXNlNjR9XG59KSk7XG4iLCIvKipcbiAqIGxvZGFzaCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IGpRdWVyeSBGb3VuZGF0aW9uIGFuZCBvdGhlciBjb250cmlidXRvcnMgPGh0dHBzOi8vanF1ZXJ5Lm9yZy8+XG4gKiBSZWxlYXNlZCB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKi9cblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE5BTiA9IDAgLyAwO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgc3ltYm9sVGFnID0gJ1tvYmplY3QgU3ltYm9sXSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgIG5hdGl2ZU1pbiA9IE1hdGgubWluO1xuXG4vKipcbiAqIEdldHMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZVxuICogdGhlIFVuaXggZXBvY2ggKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IERhdGVcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVzdGFtcC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBMb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBpbnZvY2F0aW9uLlxuICovXG52YXIgbm93ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiByb290LkRhdGUubm93KCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0byBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS5cbiAqIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZVxuICogbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFRoZSBgZnVuY2AgaXMgaW52b2tlZFxuICogd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbi4gU3Vic2VxdWVudFxuICogY2FsbHMgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbiByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2BcbiAqIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XVxuICogIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBpbnZva2VkLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXguXG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xuICpcbiAqIC8vIEludm9rZSBgc2VuZE1haWxgIHdoZW4gY2xpY2tlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzLlxuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIF8uZGVib3VuY2Uoc2VuZE1haWwsIDMwMCwge1xuICogICAnbGVhZGluZyc6IHRydWUsXG4gKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gKiB9KSk7XG4gKlxuICogLy8gRW5zdXJlIGBiYXRjaExvZ2AgaXMgaW52b2tlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxscy5cbiAqIHZhciBkZWJvdW5jZWQgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHsgJ21heFdhaXQnOiAxMDAwIH0pO1xuICogdmFyIHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZSgnL3N0cmVhbScpO1xuICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBkZWJvdW5jZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgZGVib3VuY2VkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCBkZWJvdW5jZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGFzdEFyZ3MsXG4gICAgICBsYXN0VGhpcyxcbiAgICAgIG1heFdhaXQsXG4gICAgICByZXN1bHQsXG4gICAgICB0aW1lcklkLFxuICAgICAgbGFzdENhbGxUaW1lLFxuICAgICAgbGFzdEludm9rZVRpbWUgPSAwLFxuICAgICAgbGVhZGluZyA9IGZhbHNlLFxuICAgICAgbWF4aW5nID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgd2FpdCA9IHRvTnVtYmVyKHdhaXQpIHx8IDA7XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAhIW9wdGlvbnMubGVhZGluZztcbiAgICBtYXhpbmcgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucztcbiAgICBtYXhXYWl0ID0gbWF4aW5nID8gbmF0aXZlTWF4KHRvTnVtYmVyKG9wdGlvbnMubWF4V2FpdCkgfHwgMCwgd2FpdCkgOiBtYXhXYWl0O1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VGdW5jKHRpbWUpIHtcbiAgICB2YXIgYXJncyA9IGxhc3RBcmdzLFxuICAgICAgICB0aGlzQXJnID0gbGFzdFRoaXM7XG5cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBsZWFkaW5nRWRnZSh0aW1lKSB7XG4gICAgLy8gUmVzZXQgYW55IGBtYXhXYWl0YCB0aW1lci5cbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGZvciB0aGUgdHJhaWxpbmcgZWRnZS5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIC8vIEludm9rZSB0aGUgbGVhZGluZyBlZGdlLlxuICAgIHJldHVybiBsZWFkaW5nID8gaW52b2tlRnVuYyh0aW1lKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbWFpbmluZ1dhaXQodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWUsXG4gICAgICAgIHJlc3VsdCA9IHdhaXQgLSB0aW1lU2luY2VMYXN0Q2FsbDtcblxuICAgIHJldHVybiBtYXhpbmcgPyBuYXRpdmVNaW4ocmVzdWx0LCBtYXhXYWl0IC0gdGltZVNpbmNlTGFzdEludm9rZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRJbnZva2UodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWU7XG5cbiAgICAvLyBFaXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgY2FsbCwgYWN0aXZpdHkgaGFzIHN0b3BwZWQgYW5kIHdlJ3JlIGF0IHRoZVxuICAgIC8vIHRyYWlsaW5nIGVkZ2UsIHRoZSBzeXN0ZW0gdGltZSBoYXMgZ29uZSBiYWNrd2FyZHMgYW5kIHdlJ3JlIHRyZWF0aW5nXG4gICAgLy8gaXQgYXMgdGhlIHRyYWlsaW5nIGVkZ2UsIG9yIHdlJ3ZlIGhpdCB0aGUgYG1heFdhaXRgIGxpbWl0LlxuICAgIHJldHVybiAobGFzdENhbGxUaW1lID09PSB1bmRlZmluZWQgfHwgKHRpbWVTaW5jZUxhc3RDYWxsID49IHdhaXQpIHx8XG4gICAgICAodGltZVNpbmNlTGFzdENhbGwgPCAwKSB8fCAobWF4aW5nICYmIHRpbWVTaW5jZUxhc3RJbnZva2UgPj0gbWF4V2FpdCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGltZXJFeHBpcmVkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCk7XG4gICAgaWYgKHNob3VsZEludm9rZSh0aW1lKSkge1xuICAgICAgcmV0dXJuIHRyYWlsaW5nRWRnZSh0aW1lKTtcbiAgICB9XG4gICAgLy8gUmVzdGFydCB0aGUgdGltZXIuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCByZW1haW5pbmdXYWl0KHRpbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYWlsaW5nRWRnZSh0aW1lKSB7XG4gICAgdGltZXJJZCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIE9ubHkgaW52b2tlIGlmIHdlIGhhdmUgYGxhc3RBcmdzYCB3aGljaCBtZWFucyBgZnVuY2AgaGFzIGJlZW5cbiAgICAvLyBkZWJvdW5jZWQgYXQgbGVhc3Qgb25jZS5cbiAgICBpZiAodHJhaWxpbmcgJiYgbGFzdEFyZ3MpIHtcbiAgICAgIHJldHVybiBpbnZva2VGdW5jKHRpbWUpO1xuICAgIH1cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgaWYgKHRpbWVySWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWQpO1xuICAgIH1cbiAgICBsYXN0SW52b2tlVGltZSA9IDA7XG4gICAgbGFzdEFyZ3MgPSBsYXN0Q2FsbFRpbWUgPSBsYXN0VGhpcyA9IHRpbWVySWQgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICByZXR1cm4gdGltZXJJZCA9PT0gdW5kZWZpbmVkID8gcmVzdWx0IDogdHJhaWxpbmdFZGdlKG5vdygpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpLFxuICAgICAgICBpc0ludm9raW5nID0gc2hvdWxkSW52b2tlKHRpbWUpO1xuXG4gICAgbGFzdEFyZ3MgPSBhcmd1bWVudHM7XG4gICAgbGFzdFRoaXMgPSB0aGlzO1xuICAgIGxhc3RDYWxsVGltZSA9IHRpbWU7XG5cbiAgICBpZiAoaXNJbnZva2luZykge1xuICAgICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbGVhZGluZ0VkZ2UobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChtYXhpbmcpIHtcbiAgICAgICAgLy8gSGFuZGxlIGludm9jYXRpb25zIGluIGEgdGlnaHQgbG9vcC5cbiAgICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAgICAgcmV0dXJuIGludm9rZUZ1bmMobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xuICBkZWJvdW5jZWQuZmx1c2ggPSBmbHVzaDtcbiAgcmV0dXJuIGRlYm91bmNlZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdGhyb3R0bGVkIGZ1bmN0aW9uIHRoYXQgb25seSBpbnZva2VzIGBmdW5jYCBhdCBtb3N0IG9uY2UgcGVyXG4gKiBldmVyeSBgd2FpdGAgbWlsbGlzZWNvbmRzLiBUaGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYFxuICogbWV0aG9kIHRvIGNhbmNlbCBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0b1xuICogaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgXG4gKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgXG4gKiB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWQgd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlXG4gKiB0aHJvdHRsZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiByZXR1cm4gdGhlXG4gKiByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8udGhyb3R0bGVgIGFuZCBgXy5kZWJvdW5jZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSBpbnZvY2F0aW9ucyB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGV4Y2Vzc2l2ZWx5IHVwZGF0aW5nIHRoZSBwb3NpdGlvbiB3aGlsZSBzY3JvbGxpbmcuXG4gKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKSk7XG4gKlxuICogLy8gSW52b2tlIGByZW5ld1Rva2VuYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgYnV0IG5vdCBtb3JlIHRoYW4gb25jZSBldmVyeSA1IG1pbnV0ZXMuXG4gKiB2YXIgdGhyb3R0bGVkID0gXy50aHJvdHRsZShyZW5ld1Rva2VuLCAzMDAwMDAsIHsgJ3RyYWlsaW5nJzogZmFsc2UgfSk7XG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgdGhyb3R0bGVkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIHRocm90dGxlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgdGhyb3R0bGVkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlYWRpbmcgPSB0cnVlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCB7XG4gICAgJ2xlYWRpbmcnOiBsZWFkaW5nLFxuICAgICdtYXhXYWl0Jzogd2FpdCxcbiAgICAndHJhaWxpbmcnOiB0cmFpbGluZ1xuICB9KTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9OdW1iZXIoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIE5BTjtcbiAgfVxuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gdHlwZW9mIHZhbHVlLnZhbHVlT2YgPT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGhyb3R0bGU7XG4iLCJ2YXIgd2lsZGNhcmQgPSByZXF1aXJlKCd3aWxkY2FyZCcpO1xudmFyIHJlTWltZVBhcnRTcGxpdCA9IC9bXFwvXFwrXFwuXS87XG5cbi8qKlxuICAjIG1pbWUtbWF0Y2hcblxuICBBIHNpbXBsZSBmdW5jdGlvbiB0byBjaGVja2VyIHdoZXRoZXIgYSB0YXJnZXQgbWltZSB0eXBlIG1hdGNoZXMgYSBtaW1lLXR5cGVcbiAgcGF0dGVybiAoZS5nLiBpbWFnZS9qcGVnIG1hdGNoZXMgaW1hZ2UvanBlZyBPUiBpbWFnZS8qKS5cblxuICAjIyBFeGFtcGxlIFVzYWdlXG5cbiAgPDw8IGV4YW1wbGUuanNcblxuKiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRhcmdldCwgcGF0dGVybikge1xuICBmdW5jdGlvbiB0ZXN0KHBhdHRlcm4pIHtcbiAgICB2YXIgcmVzdWx0ID0gd2lsZGNhcmQocGF0dGVybiwgdGFyZ2V0LCByZU1pbWVQYXJ0U3BsaXQpO1xuXG4gICAgLy8gZW5zdXJlIHRoYXQgd2UgaGF2ZSBhIHZhbGlkIG1pbWUgdHlwZSAoc2hvdWxkIGhhdmUgdHdvIHBhcnRzKVxuICAgIHJldHVybiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCA+PSAyO1xuICB9XG5cbiAgcmV0dXJuIHBhdHRlcm4gPyB0ZXN0KHBhdHRlcm4uc3BsaXQoJzsnKVswXSkgOiB0ZXN0O1xufTtcbiIsIi8qKlxuKiBDcmVhdGUgYW4gZXZlbnQgZW1pdHRlciB3aXRoIG5hbWVzcGFjZXNcbiogQG5hbWUgY3JlYXRlTmFtZXNwYWNlRW1pdHRlclxuKiBAZXhhbXBsZVxuKiB2YXIgZW1pdHRlciA9IHJlcXVpcmUoJy4vaW5kZXgnKSgpXG4qXG4qIGVtaXR0ZXIub24oJyonLCBmdW5jdGlvbiAoKSB7XG4qICAgY29uc29sZS5sb2coJ2FsbCBldmVudHMgZW1pdHRlZCcsIHRoaXMuZXZlbnQpXG4qIH0pXG4qXG4qIGVtaXR0ZXIub24oJ2V4YW1wbGUnLCBmdW5jdGlvbiAoKSB7XG4qICAgY29uc29sZS5sb2coJ2V4YW1wbGUgZXZlbnQgZW1pdHRlZCcpXG4qIH0pXG4qL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVOYW1lc3BhY2VFbWl0dGVyICgpIHtcbiAgdmFyIGVtaXR0ZXIgPSB7fVxuICB2YXIgX2ZucyA9IGVtaXR0ZXIuX2ZucyA9IHt9XG5cbiAgLyoqXG4gICogRW1pdCBhbiBldmVudC4gT3B0aW9uYWxseSBuYW1lc3BhY2UgdGhlIGV2ZW50LiBIYW5kbGVycyBhcmUgZmlyZWQgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHRoZXkgd2VyZSBhZGRlZCB3aXRoIGV4YWN0IG1hdGNoZXMgdGFraW5nIHByZWNlZGVuY2UuIFNlcGFyYXRlIHRoZSBuYW1lc3BhY2UgYW5kIGV2ZW50IHdpdGggYSBgOmBcbiAgKiBAbmFtZSBlbWl0XG4gICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IOKAkyB0aGUgbmFtZSBvZiB0aGUgZXZlbnQsIHdpdGggb3B0aW9uYWwgbmFtZXNwYWNlXG4gICogQHBhcmFtIHsuLi4qfSBkYXRhIOKAkyB1cCB0byA2IGFyZ3VtZW50cyB0aGF0IGFyZSBwYXNzZWQgdG8gdGhlIGV2ZW50IGxpc3RlbmVyXG4gICogQGV4YW1wbGVcbiAgKiBlbWl0dGVyLmVtaXQoJ2V4YW1wbGUnKVxuICAqIGVtaXR0ZXIuZW1pdCgnZGVtbzp0ZXN0JylcbiAgKiBlbWl0dGVyLmVtaXQoJ2RhdGEnLCB7IGV4YW1wbGU6IHRydWV9LCAnYSBzdHJpbmcnLCAxKVxuICAqL1xuICBlbWl0dGVyLmVtaXQgPSBmdW5jdGlvbiBlbWl0IChldmVudCwgYXJnMSwgYXJnMiwgYXJnMywgYXJnNCwgYXJnNSwgYXJnNikge1xuICAgIHZhciB0b0VtaXQgPSBnZXRMaXN0ZW5lcnMoZXZlbnQpXG5cbiAgICBpZiAodG9FbWl0Lmxlbmd0aCkge1xuICAgICAgZW1pdEFsbChldmVudCwgdG9FbWl0LCBbYXJnMSwgYXJnMiwgYXJnMywgYXJnNCwgYXJnNSwgYXJnNl0pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlIGVuIGV2ZW50IGxpc3RlbmVyLlxuICAqIEBuYW1lIG9uXG4gICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgKiBAZXhhbXBsZVxuICAqIGVtaXR0ZXIub24oJ2V4YW1wbGUnLCBmdW5jdGlvbiAoKSB7fSlcbiAgKiBlbWl0dGVyLm9uKCdkZW1vJywgZnVuY3Rpb24gKCkge30pXG4gICovXG4gIGVtaXR0ZXIub24gPSBmdW5jdGlvbiBvbiAoZXZlbnQsIGZuKSB7XG4gICAgaWYgKCFfZm5zW2V2ZW50XSkge1xuICAgICAgX2Zuc1tldmVudF0gPSBbXVxuICAgIH1cblxuICAgIF9mbnNbZXZlbnRdLnB1c2goZm4pXG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgZW4gZXZlbnQgbGlzdGVuZXIgdGhhdCBmaXJlcyBvbmNlLlxuICAqIEBuYW1lIG9uY2VcbiAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAqIEBleGFtcGxlXG4gICogZW1pdHRlci5vbmNlKCdleGFtcGxlJywgZnVuY3Rpb24gKCkge30pXG4gICogZW1pdHRlci5vbmNlKCdkZW1vJywgZnVuY3Rpb24gKCkge30pXG4gICovXG4gIGVtaXR0ZXIub25jZSA9IGZ1bmN0aW9uIG9uY2UgKGV2ZW50LCBmbikge1xuICAgIGZ1bmN0aW9uIG9uZSAoKSB7XG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICBlbWl0dGVyLm9mZihldmVudCwgb25lKVxuICAgIH1cbiAgICB0aGlzLm9uKGV2ZW50LCBvbmUpXG4gIH1cblxuICAvKipcbiAgKiBTdG9wIGxpc3RlbmluZyB0byBhbiBldmVudC4gU3RvcCBhbGwgbGlzdGVuZXJzIG9uIGFuIGV2ZW50IGJ5IG9ubHkgcGFzc2luZyB0aGUgZXZlbnQgbmFtZS4gU3RvcCBhIHNpbmdsZSBsaXN0ZW5lciBieSBwYXNzaW5nIHRoYXQgZXZlbnQgaGFuZGxlciBhcyBhIGNhbGxiYWNrLlxuICAqIFlvdSBtdXN0IGJlIGV4cGxpY2l0IGFib3V0IHdoYXQgd2lsbCBiZSB1bnN1YnNjcmliZWQ6IGBlbWl0dGVyLm9mZignZGVtbycpYCB3aWxsIHVuc3Vic2NyaWJlIGFuIGBlbWl0dGVyLm9uKCdkZW1vJylgIGxpc3RlbmVyLFxuICAqIGBlbWl0dGVyLm9mZignZGVtbzpleGFtcGxlJylgIHdpbGwgdW5zdWJzY3JpYmUgYW4gYGVtaXR0ZXIub24oJ2RlbW86ZXhhbXBsZScpYCBsaXN0ZW5lclxuICAqIEBuYW1lIG9mZlxuICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl0g4oCTIHRoZSBzcGVjaWZpYyBoYW5kbGVyXG4gICogQGV4YW1wbGVcbiAgKiBlbWl0dGVyLm9mZignZXhhbXBsZScpXG4gICogZW1pdHRlci5vZmYoJ2RlbW8nLCBmdW5jdGlvbiAoKSB7fSlcbiAgKi9cbiAgZW1pdHRlci5vZmYgPSBmdW5jdGlvbiBvZmYgKGV2ZW50LCBmbikge1xuICAgIHZhciBrZWVwID0gW11cblxuICAgIGlmIChldmVudCAmJiBmbikge1xuICAgICAgdmFyIGZucyA9IHRoaXMuX2Zuc1tldmVudF1cbiAgICAgIHZhciBpID0gMFxuICAgICAgdmFyIGwgPSBmbnMgPyBmbnMubGVuZ3RoIDogMFxuXG4gICAgICBmb3IgKGk7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKGZuc1tpXSAhPT0gZm4pIHtcbiAgICAgICAgICBrZWVwLnB1c2goZm5zW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAga2VlcC5sZW5ndGggPyB0aGlzLl9mbnNbZXZlbnRdID0ga2VlcCA6IGRlbGV0ZSB0aGlzLl9mbnNbZXZlbnRdXG4gIH1cblxuICBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMgKGUpIHtcbiAgICB2YXIgb3V0ID0gX2Zuc1tlXSA/IF9mbnNbZV0gOiBbXVxuICAgIHZhciBpZHggPSBlLmluZGV4T2YoJzonKVxuICAgIHZhciBhcmdzID0gKGlkeCA9PT0gLTEpID8gW2VdIDogW2Uuc3Vic3RyaW5nKDAsIGlkeCksIGUuc3Vic3RyaW5nKGlkeCArIDEpXVxuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhfZm5zKVxuICAgIHZhciBpID0gMFxuICAgIHZhciBsID0ga2V5cy5sZW5ndGhcblxuICAgIGZvciAoaTsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGtleSA9IGtleXNbaV1cbiAgICAgIGlmIChrZXkgPT09ICcqJykge1xuICAgICAgICBvdXQgPSBvdXQuY29uY2F0KF9mbnNba2V5XSlcbiAgICAgIH1cblxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAyICYmIGFyZ3NbMF0gPT09IGtleSkge1xuICAgICAgICBvdXQgPSBvdXQuY29uY2F0KF9mbnNba2V5XSlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb3V0XG4gIH1cblxuICBmdW5jdGlvbiBlbWl0QWxsIChlLCBmbnMsIGFyZ3MpIHtcbiAgICB2YXIgaSA9IDBcbiAgICB2YXIgbCA9IGZucy5sZW5ndGhcblxuICAgIGZvciAoaTsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKCFmbnNbaV0pIGJyZWFrXG4gICAgICBmbnNbaV0uZXZlbnQgPSBlXG4gICAgICBmbnNbaV0uYXBwbHkoZm5zW2ldLCBhcmdzKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbWl0dGVyXG59XG4iLCIhZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGZ1bmN0aW9uIGgobm9kZU5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdmFyIGxhc3RTaW1wbGUsIGNoaWxkLCBzaW1wbGUsIGksIGNoaWxkcmVuID0gRU1QVFlfQ0hJTERSRU47XG4gICAgICAgIGZvciAoaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGktLSA+IDI7ICkgc3RhY2sucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICBpZiAoYXR0cmlidXRlcyAmJiBudWxsICE9IGF0dHJpYnV0ZXMuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGlmICghc3RhY2subGVuZ3RoKSBzdGFjay5wdXNoKGF0dHJpYnV0ZXMuY2hpbGRyZW4pO1xuICAgICAgICAgICAgZGVsZXRlIGF0dHJpYnV0ZXMuY2hpbGRyZW47XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkgaWYgKChjaGlsZCA9IHN0YWNrLnBvcCgpKSAmJiB2b2lkIDAgIT09IGNoaWxkLnBvcCkgZm9yIChpID0gY2hpbGQubGVuZ3RoOyBpLS07ICkgc3RhY2sucHVzaChjaGlsZFtpXSk7IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCdib29sZWFuJyA9PSB0eXBlb2YgY2hpbGQpIGNoaWxkID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChzaW1wbGUgPSAnZnVuY3Rpb24nICE9IHR5cGVvZiBub2RlTmFtZSkgaWYgKG51bGwgPT0gY2hpbGQpIGNoaWxkID0gJyc7IGVsc2UgaWYgKCdudW1iZXInID09IHR5cGVvZiBjaGlsZCkgY2hpbGQgPSBTdHJpbmcoY2hpbGQpOyBlbHNlIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgY2hpbGQpIHNpbXBsZSA9ICExO1xuICAgICAgICAgICAgaWYgKHNpbXBsZSAmJiBsYXN0U2ltcGxlKSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSArPSBjaGlsZDsgZWxzZSBpZiAoY2hpbGRyZW4gPT09IEVNUFRZX0NISUxEUkVOKSBjaGlsZHJlbiA9IFsgY2hpbGQgXTsgZWxzZSBjaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgIGxhc3RTaW1wbGUgPSBzaW1wbGU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHAgPSBuZXcgVk5vZGUoKTtcbiAgICAgICAgcC5ub2RlTmFtZSA9IG5vZGVOYW1lO1xuICAgICAgICBwLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgICAgIHAuYXR0cmlidXRlcyA9IG51bGwgPT0gYXR0cmlidXRlcyA/IHZvaWQgMCA6IGF0dHJpYnV0ZXM7XG4gICAgICAgIHAua2V5ID0gbnVsbCA9PSBhdHRyaWJ1dGVzID8gdm9pZCAwIDogYXR0cmlidXRlcy5rZXk7XG4gICAgICAgIGlmICh2b2lkIDAgIT09IG9wdGlvbnMudm5vZGUpIG9wdGlvbnMudm5vZGUocCk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBleHRlbmQob2JqLCBwcm9wcykge1xuICAgICAgICBmb3IgKHZhciBpIGluIHByb3BzKSBvYmpbaV0gPSBwcm9wc1tpXTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXBwbHlSZWYocmVmLCB2YWx1ZSkge1xuICAgICAgICBpZiAobnVsbCAhPSByZWYpIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiByZWYpIHJlZih2YWx1ZSk7IGVsc2UgcmVmLmN1cnJlbnQgPSB2YWx1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2xvbmVFbGVtZW50KHZub2RlLCBwcm9wcykge1xuICAgICAgICByZXR1cm4gaCh2bm9kZS5ub2RlTmFtZSwgZXh0ZW5kKGV4dGVuZCh7fSwgdm5vZGUuYXR0cmlidXRlcyksIHByb3BzKSwgYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMikgOiB2bm9kZS5jaGlsZHJlbik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVucXVldWVSZW5kZXIoY29tcG9uZW50KSB7XG4gICAgICAgIGlmICghY29tcG9uZW50Ll9fZCAmJiAoY29tcG9uZW50Ll9fZCA9ICEwKSAmJiAxID09IGl0ZW1zLnB1c2goY29tcG9uZW50KSkgKG9wdGlvbnMuZGVib3VuY2VSZW5kZXJpbmcgfHwgZGVmZXIpKHJlcmVuZGVyKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVyZW5kZXIoKSB7XG4gICAgICAgIHZhciBwO1xuICAgICAgICB3aGlsZSAocCA9IGl0ZW1zLnBvcCgpKSBpZiAocC5fX2QpIHJlbmRlckNvbXBvbmVudChwKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNTYW1lTm9kZVR5cGUobm9kZSwgdm5vZGUsIGh5ZHJhdGluZykge1xuICAgICAgICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZub2RlIHx8ICdudW1iZXInID09IHR5cGVvZiB2bm9kZSkgcmV0dXJuIHZvaWQgMCAhPT0gbm9kZS5zcGxpdFRleHQ7XG4gICAgICAgIGlmICgnc3RyaW5nJyA9PSB0eXBlb2Ygdm5vZGUubm9kZU5hbWUpIHJldHVybiAhbm9kZS5fY29tcG9uZW50Q29uc3RydWN0b3IgJiYgaXNOYW1lZE5vZGUobm9kZSwgdm5vZGUubm9kZU5hbWUpOyBlbHNlIHJldHVybiBoeWRyYXRpbmcgfHwgbm9kZS5fY29tcG9uZW50Q29uc3RydWN0b3IgPT09IHZub2RlLm5vZGVOYW1lO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc05hbWVkTm9kZShub2RlLCBub2RlTmFtZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5fX24gPT09IG5vZGVOYW1lIHx8IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BzKHZub2RlKSB7XG4gICAgICAgIHZhciBwcm9wcyA9IGV4dGVuZCh7fSwgdm5vZGUuYXR0cmlidXRlcyk7XG4gICAgICAgIHByb3BzLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgIHZhciBkZWZhdWx0UHJvcHMgPSB2bm9kZS5ub2RlTmFtZS5kZWZhdWx0UHJvcHM7XG4gICAgICAgIGlmICh2b2lkIDAgIT09IGRlZmF1bHRQcm9wcykgZm9yICh2YXIgaSBpbiBkZWZhdWx0UHJvcHMpIGlmICh2b2lkIDAgPT09IHByb3BzW2ldKSBwcm9wc1tpXSA9IGRlZmF1bHRQcm9wc1tpXTtcbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVOb2RlKG5vZGVOYW1lLCBpc1N2Zykge1xuICAgICAgICB2YXIgbm9kZSA9IGlzU3ZnID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5vZGVOYW1lKSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICBub2RlLl9fbiA9IG5vZGVOYW1lO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTm9kZShub2RlKSB7XG4gICAgICAgIHZhciBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICBpZiAocGFyZW50Tm9kZSkgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0QWNjZXNzb3Iobm9kZSwgbmFtZSwgb2xkLCB2YWx1ZSwgaXNTdmcpIHtcbiAgICAgICAgaWYgKCdjbGFzc05hbWUnID09PSBuYW1lKSBuYW1lID0gJ2NsYXNzJztcbiAgICAgICAgaWYgKCdrZXknID09PSBuYW1lKSA7IGVsc2UgaWYgKCdyZWYnID09PSBuYW1lKSB7XG4gICAgICAgICAgICBhcHBseVJlZihvbGQsIG51bGwpO1xuICAgICAgICAgICAgYXBwbHlSZWYodmFsdWUsIG5vZGUpO1xuICAgICAgICB9IGVsc2UgaWYgKCdjbGFzcycgPT09IG5hbWUgJiYgIWlzU3ZnKSBub2RlLmNsYXNzTmFtZSA9IHZhbHVlIHx8ICcnOyBlbHNlIGlmICgnc3R5bGUnID09PSBuYW1lKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlIHx8ICdzdHJpbmcnID09IHR5cGVvZiB2YWx1ZSB8fCAnc3RyaW5nJyA9PSB0eXBlb2Ygb2xkKSBub2RlLnN0eWxlLmNzc1RleHQgPSB2YWx1ZSB8fCAnJztcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiAnb2JqZWN0JyA9PSB0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIG9sZCkgZm9yICh2YXIgaSBpbiBvbGQpIGlmICghKGkgaW4gdmFsdWUpKSBub2RlLnN0eWxlW2ldID0gJyc7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB2YWx1ZSkgbm9kZS5zdHlsZVtpXSA9ICdudW1iZXInID09IHR5cGVvZiB2YWx1ZVtpXSAmJiAhMSA9PT0gSVNfTk9OX0RJTUVOU0lPTkFMLnRlc3QoaSkgPyB2YWx1ZVtpXSArICdweCcgOiB2YWx1ZVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgnZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwnID09PSBuYW1lKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIG5vZGUuaW5uZXJIVE1MID0gdmFsdWUuX19odG1sIHx8ICcnO1xuICAgICAgICB9IGVsc2UgaWYgKCdvJyA9PSBuYW1lWzBdICYmICduJyA9PSBuYW1lWzFdKSB7XG4gICAgICAgICAgICB2YXIgdXNlQ2FwdHVyZSA9IG5hbWUgIT09IChuYW1lID0gbmFtZS5yZXBsYWNlKC9DYXB0dXJlJC8sICcnKSk7XG4gICAgICAgICAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygyKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghb2xkKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZXZlbnRQcm94eSwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9IGVsc2Ugbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGV2ZW50UHJveHksIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgKG5vZGUuX19sIHx8IChub2RlLl9fbCA9IHt9KSlbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmICgnbGlzdCcgIT09IG5hbWUgJiYgJ3R5cGUnICE9PSBuYW1lICYmICFpc1N2ZyAmJiBuYW1lIGluIG5vZGUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbm9kZVtuYW1lXSA9IG51bGwgPT0gdmFsdWUgPyAnJyA6IHZhbHVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgIGlmICgobnVsbCA9PSB2YWx1ZSB8fCAhMSA9PT0gdmFsdWUpICYmICdzcGVsbGNoZWNrJyAhPSBuYW1lKSBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBucyA9IGlzU3ZnICYmIG5hbWUgIT09IChuYW1lID0gbmFtZS5yZXBsYWNlKC9eeGxpbms6Py8sICcnKSk7XG4gICAgICAgICAgICBpZiAobnVsbCA9PSB2YWx1ZSB8fCAhMSA9PT0gdmFsdWUpIGlmIChucykgbm9kZS5yZW1vdmVBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIG5hbWUudG9Mb3dlckNhc2UoKSk7IGVsc2Ugbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7IGVsc2UgaWYgKCdmdW5jdGlvbicgIT0gdHlwZW9mIHZhbHVlKSBpZiAobnMpIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBuYW1lLnRvTG93ZXJDYXNlKCksIHZhbHVlKTsgZWxzZSBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZXZlbnRQcm94eShlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbFtlLnR5cGVdKG9wdGlvbnMuZXZlbnQgJiYgb3B0aW9ucy5ldmVudChlKSB8fCBlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmx1c2hNb3VudHMoKSB7XG4gICAgICAgIHZhciBjO1xuICAgICAgICB3aGlsZSAoYyA9IG1vdW50cy5zaGlmdCgpKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5hZnRlck1vdW50KSBvcHRpb25zLmFmdGVyTW91bnQoYyk7XG4gICAgICAgICAgICBpZiAoYy5jb21wb25lbnREaWRNb3VudCkgYy5jb21wb25lbnREaWRNb3VudCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpZmYoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwsIHBhcmVudCwgY29tcG9uZW50Um9vdCkge1xuICAgICAgICBpZiAoIWRpZmZMZXZlbCsrKSB7XG4gICAgICAgICAgICBpc1N2Z01vZGUgPSBudWxsICE9IHBhcmVudCAmJiB2b2lkIDAgIT09IHBhcmVudC5vd25lclNWR0VsZW1lbnQ7XG4gICAgICAgICAgICBoeWRyYXRpbmcgPSBudWxsICE9IGRvbSAmJiAhKCdfX3ByZWFjdGF0dHJfJyBpbiBkb20pO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXQgPSBpZGlmZihkb20sIHZub2RlLCBjb250ZXh0LCBtb3VudEFsbCwgY29tcG9uZW50Um9vdCk7XG4gICAgICAgIGlmIChwYXJlbnQgJiYgcmV0LnBhcmVudE5vZGUgIT09IHBhcmVudCkgcGFyZW50LmFwcGVuZENoaWxkKHJldCk7XG4gICAgICAgIGlmICghLS1kaWZmTGV2ZWwpIHtcbiAgICAgICAgICAgIGh5ZHJhdGluZyA9ICExO1xuICAgICAgICAgICAgaWYgKCFjb21wb25lbnRSb290KSBmbHVzaE1vdW50cygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlkaWZmKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsLCBjb21wb25lbnRSb290KSB7XG4gICAgICAgIHZhciBvdXQgPSBkb20sIHByZXZTdmdNb2RlID0gaXNTdmdNb2RlO1xuICAgICAgICBpZiAobnVsbCA9PSB2bm9kZSB8fCAnYm9vbGVhbicgPT0gdHlwZW9mIHZub2RlKSB2bm9kZSA9ICcnO1xuICAgICAgICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZub2RlIHx8ICdudW1iZXInID09IHR5cGVvZiB2bm9kZSkge1xuICAgICAgICAgICAgaWYgKGRvbSAmJiB2b2lkIDAgIT09IGRvbS5zcGxpdFRleHQgJiYgZG9tLnBhcmVudE5vZGUgJiYgKCFkb20uX2NvbXBvbmVudCB8fCBjb21wb25lbnRSb290KSkge1xuICAgICAgICAgICAgICAgIGlmIChkb20ubm9kZVZhbHVlICE9IHZub2RlKSBkb20ubm9kZVZhbHVlID0gdm5vZGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb20ucGFyZW50Tm9kZSkgZG9tLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG91dCwgZG9tKTtcbiAgICAgICAgICAgICAgICAgICAgcmVjb2xsZWN0Tm9kZVRyZWUoZG9tLCAhMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0Ll9fcHJlYWN0YXR0cl8gPSAhMDtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHZub2RlTmFtZSA9IHZub2RlLm5vZGVOYW1lO1xuICAgICAgICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygdm5vZGVOYW1lKSByZXR1cm4gYnVpbGRDb21wb25lbnRGcm9tVk5vZGUoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwpO1xuICAgICAgICBpc1N2Z01vZGUgPSAnc3ZnJyA9PT0gdm5vZGVOYW1lID8gITAgOiAnZm9yZWlnbk9iamVjdCcgPT09IHZub2RlTmFtZSA/ICExIDogaXNTdmdNb2RlO1xuICAgICAgICB2bm9kZU5hbWUgPSBTdHJpbmcodm5vZGVOYW1lKTtcbiAgICAgICAgaWYgKCFkb20gfHwgIWlzTmFtZWROb2RlKGRvbSwgdm5vZGVOYW1lKSkge1xuICAgICAgICAgICAgb3V0ID0gY3JlYXRlTm9kZSh2bm9kZU5hbWUsIGlzU3ZnTW9kZSk7XG4gICAgICAgICAgICBpZiAoZG9tKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGRvbS5maXJzdENoaWxkKSBvdXQuYXBwZW5kQ2hpbGQoZG9tLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgIGlmIChkb20ucGFyZW50Tm9kZSkgZG9tLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG91dCwgZG9tKTtcbiAgICAgICAgICAgICAgICByZWNvbGxlY3ROb2RlVHJlZShkb20sICEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZmMgPSBvdXQuZmlyc3RDaGlsZCwgcHJvcHMgPSBvdXQuX19wcmVhY3RhdHRyXywgdmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgIGlmIChudWxsID09IHByb3BzKSB7XG4gICAgICAgICAgICBwcm9wcyA9IG91dC5fX3ByZWFjdGF0dHJfID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBhID0gb3V0LmF0dHJpYnV0ZXMsIGkgPSBhLmxlbmd0aDsgaS0tOyApIHByb3BzW2FbaV0ubmFtZV0gPSBhW2ldLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaHlkcmF0aW5nICYmIHZjaGlsZHJlbiAmJiAxID09PSB2Y2hpbGRyZW4ubGVuZ3RoICYmICdzdHJpbmcnID09IHR5cGVvZiB2Y2hpbGRyZW5bMF0gJiYgbnVsbCAhPSBmYyAmJiB2b2lkIDAgIT09IGZjLnNwbGl0VGV4dCAmJiBudWxsID09IGZjLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBpZiAoZmMubm9kZVZhbHVlICE9IHZjaGlsZHJlblswXSkgZmMubm9kZVZhbHVlID0gdmNoaWxkcmVuWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKHZjaGlsZHJlbiAmJiB2Y2hpbGRyZW4ubGVuZ3RoIHx8IG51bGwgIT0gZmMpIGlubmVyRGlmZk5vZGUob3V0LCB2Y2hpbGRyZW4sIGNvbnRleHQsIG1vdW50QWxsLCBoeWRyYXRpbmcgfHwgbnVsbCAhPSBwcm9wcy5kYW5nZXJvdXNseVNldElubmVySFRNTCk7XG4gICAgICAgIGRpZmZBdHRyaWJ1dGVzKG91dCwgdm5vZGUuYXR0cmlidXRlcywgcHJvcHMpO1xuICAgICAgICBpc1N2Z01vZGUgPSBwcmV2U3ZnTW9kZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5uZXJEaWZmTm9kZShkb20sIHZjaGlsZHJlbiwgY29udGV4dCwgbW91bnRBbGwsIGlzSHlkcmF0aW5nKSB7XG4gICAgICAgIHZhciBqLCBjLCBmLCB2Y2hpbGQsIGNoaWxkLCBvcmlnaW5hbENoaWxkcmVuID0gZG9tLmNoaWxkTm9kZXMsIGNoaWxkcmVuID0gW10sIGtleWVkID0ge30sIGtleWVkTGVuID0gMCwgbWluID0gMCwgbGVuID0gb3JpZ2luYWxDaGlsZHJlbi5sZW5ndGgsIGNoaWxkcmVuTGVuID0gMCwgdmxlbiA9IHZjaGlsZHJlbiA/IHZjaGlsZHJlbi5sZW5ndGggOiAwO1xuICAgICAgICBpZiAoMCAhPT0gbGVuKSBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgX2NoaWxkID0gb3JpZ2luYWxDaGlsZHJlbltpXSwgcHJvcHMgPSBfY2hpbGQuX19wcmVhY3RhdHRyXywga2V5ID0gdmxlbiAmJiBwcm9wcyA/IF9jaGlsZC5fY29tcG9uZW50ID8gX2NoaWxkLl9jb21wb25lbnQuX19rIDogcHJvcHMua2V5IDogbnVsbDtcbiAgICAgICAgICAgIGlmIChudWxsICE9IGtleSkge1xuICAgICAgICAgICAgICAgIGtleWVkTGVuKys7XG4gICAgICAgICAgICAgICAga2V5ZWRba2V5XSA9IF9jaGlsZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcHMgfHwgKHZvaWQgMCAhPT0gX2NoaWxkLnNwbGl0VGV4dCA/IGlzSHlkcmF0aW5nID8gX2NoaWxkLm5vZGVWYWx1ZS50cmltKCkgOiAhMCA6IGlzSHlkcmF0aW5nKSkgY2hpbGRyZW5bY2hpbGRyZW5MZW4rK10gPSBfY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKDAgIT09IHZsZW4pIGZvciAodmFyIGkgPSAwOyBpIDwgdmxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2Y2hpbGQgPSB2Y2hpbGRyZW5baV07XG4gICAgICAgICAgICBjaGlsZCA9IG51bGw7XG4gICAgICAgICAgICB2YXIga2V5ID0gdmNoaWxkLmtleTtcbiAgICAgICAgICAgIGlmIChudWxsICE9IGtleSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXllZExlbiAmJiB2b2lkIDAgIT09IGtleWVkW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBrZXllZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICBrZXllZFtrZXldID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgICAgICBrZXllZExlbi0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWluIDwgY2hpbGRyZW5MZW4pIGZvciAoaiA9IG1pbjsgaiA8IGNoaWxkcmVuTGVuOyBqKyspIGlmICh2b2lkIDAgIT09IGNoaWxkcmVuW2pdICYmIGlzU2FtZU5vZGVUeXBlKGMgPSBjaGlsZHJlbltqXSwgdmNoaWxkLCBpc0h5ZHJhdGluZykpIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGM7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW5bal0gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgaWYgKGogPT09IGNoaWxkcmVuTGVuIC0gMSkgY2hpbGRyZW5MZW4tLTtcbiAgICAgICAgICAgICAgICBpZiAoaiA9PT0gbWluKSBtaW4rKztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkID0gaWRpZmYoY2hpbGQsIHZjaGlsZCwgY29udGV4dCwgbW91bnRBbGwpO1xuICAgICAgICAgICAgZiA9IG9yaWdpbmFsQ2hpbGRyZW5baV07XG4gICAgICAgICAgICBpZiAoY2hpbGQgJiYgY2hpbGQgIT09IGRvbSAmJiBjaGlsZCAhPT0gZikgaWYgKG51bGwgPT0gZikgZG9tLmFwcGVuZENoaWxkKGNoaWxkKTsgZWxzZSBpZiAoY2hpbGQgPT09IGYubmV4dFNpYmxpbmcpIHJlbW92ZU5vZGUoZik7IGVsc2UgZG9tLmluc2VydEJlZm9yZShjaGlsZCwgZik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleWVkTGVuKSBmb3IgKHZhciBpIGluIGtleWVkKSBpZiAodm9pZCAwICE9PSBrZXllZFtpXSkgcmVjb2xsZWN0Tm9kZVRyZWUoa2V5ZWRbaV0sICExKTtcbiAgICAgICAgd2hpbGUgKG1pbiA8PSBjaGlsZHJlbkxlbikgaWYgKHZvaWQgMCAhPT0gKGNoaWxkID0gY2hpbGRyZW5bY2hpbGRyZW5MZW4tLV0pKSByZWNvbGxlY3ROb2RlVHJlZShjaGlsZCwgITEpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWNvbGxlY3ROb2RlVHJlZShub2RlLCB1bm1vdW50T25seSkge1xuICAgICAgICB2YXIgY29tcG9uZW50ID0gbm9kZS5fY29tcG9uZW50O1xuICAgICAgICBpZiAoY29tcG9uZW50KSB1bm1vdW50Q29tcG9uZW50KGNvbXBvbmVudCk7IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG51bGwgIT0gbm9kZS5fX3ByZWFjdGF0dHJfKSBhcHBseVJlZihub2RlLl9fcHJlYWN0YXR0cl8ucmVmLCBudWxsKTtcbiAgICAgICAgICAgIGlmICghMSA9PT0gdW5tb3VudE9ubHkgfHwgbnVsbCA9PSBub2RlLl9fcHJlYWN0YXR0cl8pIHJlbW92ZU5vZGUobm9kZSk7XG4gICAgICAgICAgICByZW1vdmVDaGlsZHJlbihub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVDaGlsZHJlbihub2RlKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLmxhc3RDaGlsZDtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gbm9kZS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICByZWNvbGxlY3ROb2RlVHJlZShub2RlLCAhMCk7XG4gICAgICAgICAgICBub2RlID0gbmV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBkaWZmQXR0cmlidXRlcyhkb20sIGF0dHJzLCBvbGQpIHtcbiAgICAgICAgdmFyIG5hbWU7XG4gICAgICAgIGZvciAobmFtZSBpbiBvbGQpIGlmICgoIWF0dHJzIHx8IG51bGwgPT0gYXR0cnNbbmFtZV0pICYmIG51bGwgIT0gb2xkW25hbWVdKSBzZXRBY2Nlc3Nvcihkb20sIG5hbWUsIG9sZFtuYW1lXSwgb2xkW25hbWVdID0gdm9pZCAwLCBpc1N2Z01vZGUpO1xuICAgICAgICBmb3IgKG5hbWUgaW4gYXR0cnMpIGlmICghKCdjaGlsZHJlbicgPT09IG5hbWUgfHwgJ2lubmVySFRNTCcgPT09IG5hbWUgfHwgbmFtZSBpbiBvbGQgJiYgYXR0cnNbbmFtZV0gPT09ICgndmFsdWUnID09PSBuYW1lIHx8ICdjaGVja2VkJyA9PT0gbmFtZSA/IGRvbVtuYW1lXSA6IG9sZFtuYW1lXSkpKSBzZXRBY2Nlc3Nvcihkb20sIG5hbWUsIG9sZFtuYW1lXSwgb2xkW25hbWVdID0gYXR0cnNbbmFtZV0sIGlzU3ZnTW9kZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudChDdG9yLCBwcm9wcywgY29udGV4dCkge1xuICAgICAgICB2YXIgaW5zdCwgaSA9IHJlY3ljbGVyQ29tcG9uZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChDdG9yLnByb3RvdHlwZSAmJiBDdG9yLnByb3RvdHlwZS5yZW5kZXIpIHtcbiAgICAgICAgICAgIGluc3QgPSBuZXcgQ3Rvcihwcm9wcywgY29udGV4dCk7XG4gICAgICAgICAgICBDb21wb25lbnQuY2FsbChpbnN0LCBwcm9wcywgY29udGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnN0ID0gbmV3IENvbXBvbmVudChwcm9wcywgY29udGV4dCk7XG4gICAgICAgICAgICBpbnN0LmNvbnN0cnVjdG9yID0gQ3RvcjtcbiAgICAgICAgICAgIGluc3QucmVuZGVyID0gZG9SZW5kZXI7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGktLSkgaWYgKHJlY3ljbGVyQ29tcG9uZW50c1tpXS5jb25zdHJ1Y3RvciA9PT0gQ3Rvcikge1xuICAgICAgICAgICAgaW5zdC5fX2IgPSByZWN5Y2xlckNvbXBvbmVudHNbaV0uX19iO1xuICAgICAgICAgICAgcmVjeWNsZXJDb21wb25lbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHJldHVybiBpbnN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkb1JlbmRlcihwcm9wcywgc3RhdGUsIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IocHJvcHMsIGNvbnRleHQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzZXRDb21wb25lbnRQcm9wcyhjb21wb25lbnQsIHByb3BzLCByZW5kZXJNb2RlLCBjb250ZXh0LCBtb3VudEFsbCkge1xuICAgICAgICBpZiAoIWNvbXBvbmVudC5fX3gpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fX3ggPSAhMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fX3IgPSBwcm9wcy5yZWY7XG4gICAgICAgICAgICBjb21wb25lbnQuX19rID0gcHJvcHMua2V5O1xuICAgICAgICAgICAgZGVsZXRlIHByb3BzLnJlZjtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wcy5rZXk7XG4gICAgICAgICAgICBpZiAodm9pZCAwID09PSBjb21wb25lbnQuY29uc3RydWN0b3IuZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKSBpZiAoIWNvbXBvbmVudC5iYXNlIHx8IG1vdW50QWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5jb21wb25lbnRXaWxsTW91bnQpIGNvbXBvbmVudC5jb21wb25lbnRXaWxsTW91bnQoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMpIGNvbXBvbmVudC5jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKHByb3BzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIGlmIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGNvbXBvbmVudC5jb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb21wb25lbnQuX19jKSBjb21wb25lbnQuX19jID0gY29tcG9uZW50LmNvbnRleHQ7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFjb21wb25lbnQuX19wKSBjb21wb25lbnQuX19wID0gY29tcG9uZW50LnByb3BzO1xuICAgICAgICAgICAgY29tcG9uZW50LnByb3BzID0gcHJvcHM7XG4gICAgICAgICAgICBjb21wb25lbnQuX194ID0gITE7XG4gICAgICAgICAgICBpZiAoMCAhPT0gcmVuZGVyTW9kZSkgaWYgKDEgPT09IHJlbmRlck1vZGUgfHwgITEgIT09IG9wdGlvbnMuc3luY0NvbXBvbmVudFVwZGF0ZXMgfHwgIWNvbXBvbmVudC5iYXNlKSByZW5kZXJDb21wb25lbnQoY29tcG9uZW50LCAxLCBtb3VudEFsbCk7IGVsc2UgZW5xdWV1ZVJlbmRlcihjb21wb25lbnQpO1xuICAgICAgICAgICAgYXBwbHlSZWYoY29tcG9uZW50Ll9fciwgY29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW5kZXJDb21wb25lbnQoY29tcG9uZW50LCByZW5kZXJNb2RlLCBtb3VudEFsbCwgaXNDaGlsZCkge1xuICAgICAgICBpZiAoIWNvbXBvbmVudC5fX3gpIHtcbiAgICAgICAgICAgIHZhciByZW5kZXJlZCwgaW5zdCwgY2Jhc2UsIHByb3BzID0gY29tcG9uZW50LnByb3BzLCBzdGF0ZSA9IGNvbXBvbmVudC5zdGF0ZSwgY29udGV4dCA9IGNvbXBvbmVudC5jb250ZXh0LCBwcmV2aW91c1Byb3BzID0gY29tcG9uZW50Ll9fcCB8fCBwcm9wcywgcHJldmlvdXNTdGF0ZSA9IGNvbXBvbmVudC5fX3MgfHwgc3RhdGUsIHByZXZpb3VzQ29udGV4dCA9IGNvbXBvbmVudC5fX2MgfHwgY29udGV4dCwgaXNVcGRhdGUgPSBjb21wb25lbnQuYmFzZSwgbmV4dEJhc2UgPSBjb21wb25lbnQuX19iLCBpbml0aWFsQmFzZSA9IGlzVXBkYXRlIHx8IG5leHRCYXNlLCBpbml0aWFsQ2hpbGRDb21wb25lbnQgPSBjb21wb25lbnQuX2NvbXBvbmVudCwgc2tpcCA9ICExLCBzbmFwc2hvdCA9IHByZXZpb3VzQ29udGV4dDtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQuY29uc3RydWN0b3IuZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBleHRlbmQoZXh0ZW5kKHt9LCBzdGF0ZSksIGNvbXBvbmVudC5jb25zdHJ1Y3Rvci5nZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMocHJvcHMsIHN0YXRlKSk7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnN0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNVcGRhdGUpIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQucHJvcHMgPSBwcmV2aW91c1Byb3BzO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5zdGF0ZSA9IHByZXZpb3VzU3RhdGU7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LmNvbnRleHQgPSBwcmV2aW91c0NvbnRleHQ7XG4gICAgICAgICAgICAgICAgaWYgKDIgIT09IHJlbmRlck1vZGUgJiYgY29tcG9uZW50LnNob3VsZENvbXBvbmVudFVwZGF0ZSAmJiAhMSA9PT0gY29tcG9uZW50LnNob3VsZENvbXBvbmVudFVwZGF0ZShwcm9wcywgc3RhdGUsIGNvbnRleHQpKSBza2lwID0gITA7IGVsc2UgaWYgKGNvbXBvbmVudC5jb21wb25lbnRXaWxsVXBkYXRlKSBjb21wb25lbnQuY29tcG9uZW50V2lsbFVwZGF0ZShwcm9wcywgc3RhdGUsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHByb3BzO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX3AgPSBjb21wb25lbnQuX19zID0gY29tcG9uZW50Ll9fYyA9IGNvbXBvbmVudC5fX2IgPSBudWxsO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9fZCA9ICExO1xuICAgICAgICAgICAgaWYgKCFza2lwKSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyZWQgPSBjb21wb25lbnQucmVuZGVyKHByb3BzLCBzdGF0ZSwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5nZXRDaGlsZENvbnRleHQpIGNvbnRleHQgPSBleHRlbmQoZXh0ZW5kKHt9LCBjb250ZXh0KSwgY29tcG9uZW50LmdldENoaWxkQ29udGV4dCgpKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNVcGRhdGUgJiYgY29tcG9uZW50LmdldFNuYXBzaG90QmVmb3JlVXBkYXRlKSBzbmFwc2hvdCA9IGNvbXBvbmVudC5nZXRTbmFwc2hvdEJlZm9yZVVwZGF0ZShwcmV2aW91c1Byb3BzLCBwcmV2aW91c1N0YXRlKTtcbiAgICAgICAgICAgICAgICB2YXIgdG9Vbm1vdW50LCBiYXNlLCBjaGlsZENvbXBvbmVudCA9IHJlbmRlcmVkICYmIHJlbmRlcmVkLm5vZGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBjaGlsZENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGRQcm9wcyA9IGdldE5vZGVQcm9wcyhyZW5kZXJlZCk7XG4gICAgICAgICAgICAgICAgICAgIGluc3QgPSBpbml0aWFsQ2hpbGRDb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnN0ICYmIGluc3QuY29uc3RydWN0b3IgPT09IGNoaWxkQ29tcG9uZW50ICYmIGNoaWxkUHJvcHMua2V5ID09IGluc3QuX19rKSBzZXRDb21wb25lbnRQcm9wcyhpbnN0LCBjaGlsZFByb3BzLCAxLCBjb250ZXh0LCAhMSk7IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9Vbm1vdW50ID0gaW5zdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5fY29tcG9uZW50ID0gaW5zdCA9IGNyZWF0ZUNvbXBvbmVudChjaGlsZENvbXBvbmVudCwgY2hpbGRQcm9wcywgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0Ll9fYiA9IGluc3QuX19iIHx8IG5leHRCYXNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdC5fX3UgPSBjb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRDb21wb25lbnRQcm9wcyhpbnN0LCBjaGlsZFByb3BzLCAwLCBjb250ZXh0LCAhMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJDb21wb25lbnQoaW5zdCwgMSwgbW91bnRBbGwsICEwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiYXNlID0gaW5zdC5iYXNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNiYXNlID0gaW5pdGlhbEJhc2U7XG4gICAgICAgICAgICAgICAgICAgIHRvVW5tb3VudCA9IGluaXRpYWxDaGlsZENvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvVW5tb3VudCkgY2Jhc2UgPSBjb21wb25lbnQuX2NvbXBvbmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbml0aWFsQmFzZSB8fCAxID09PSByZW5kZXJNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2Jhc2UpIGNiYXNlLl9jb21wb25lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZSA9IGRpZmYoY2Jhc2UsIHJlbmRlcmVkLCBjb250ZXh0LCBtb3VudEFsbCB8fCAhaXNVcGRhdGUsIGluaXRpYWxCYXNlICYmIGluaXRpYWxCYXNlLnBhcmVudE5vZGUsICEwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbEJhc2UgJiYgYmFzZSAhPT0gaW5pdGlhbEJhc2UgJiYgaW5zdCAhPT0gaW5pdGlhbENoaWxkQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXNlUGFyZW50ID0gaW5pdGlhbEJhc2UucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhc2VQYXJlbnQgJiYgYmFzZSAhPT0gYmFzZVBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFzZVBhcmVudC5yZXBsYWNlQ2hpbGQoYmFzZSwgaW5pdGlhbEJhc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0b1VubW91bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsQmFzZS5fY29tcG9uZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNvbGxlY3ROb2RlVHJlZShpbml0aWFsQmFzZSwgITEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0b1VubW91bnQpIHVubW91bnRDb21wb25lbnQodG9Vbm1vdW50KTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuYmFzZSA9IGJhc2U7XG4gICAgICAgICAgICAgICAgaWYgKGJhc2UgJiYgIWlzQ2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudFJlZiA9IGNvbXBvbmVudCwgdCA9IGNvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHQgPSB0Ll9fdSkgKGNvbXBvbmVudFJlZiA9IHQpLmJhc2UgPSBiYXNlO1xuICAgICAgICAgICAgICAgICAgICBiYXNlLl9jb21wb25lbnQgPSBjb21wb25lbnRSZWY7XG4gICAgICAgICAgICAgICAgICAgIGJhc2UuX2NvbXBvbmVudENvbnN0cnVjdG9yID0gY29tcG9uZW50UmVmLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNVcGRhdGUgfHwgbW91bnRBbGwpIG1vdW50cy5wdXNoKGNvbXBvbmVudCk7IGVsc2UgaWYgKCFza2lwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5jb21wb25lbnREaWRVcGRhdGUpIGNvbXBvbmVudC5jb21wb25lbnREaWRVcGRhdGUocHJldmlvdXNQcm9wcywgcHJldmlvdXNTdGF0ZSwgc25hcHNob3QpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmFmdGVyVXBkYXRlKSBvcHRpb25zLmFmdGVyVXBkYXRlKGNvbXBvbmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoY29tcG9uZW50Ll9faC5sZW5ndGgpIGNvbXBvbmVudC5fX2gucG9wKCkuY2FsbChjb21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKCFkaWZmTGV2ZWwgJiYgIWlzQ2hpbGQpIGZsdXNoTW91bnRzKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gYnVpbGRDb21wb25lbnRGcm9tVk5vZGUoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwpIHtcbiAgICAgICAgdmFyIGMgPSBkb20gJiYgZG9tLl9jb21wb25lbnQsIG9yaWdpbmFsQ29tcG9uZW50ID0gYywgb2xkRG9tID0gZG9tLCBpc0RpcmVjdE93bmVyID0gYyAmJiBkb20uX2NvbXBvbmVudENvbnN0cnVjdG9yID09PSB2bm9kZS5ub2RlTmFtZSwgaXNPd25lciA9IGlzRGlyZWN0T3duZXIsIHByb3BzID0gZ2V0Tm9kZVByb3BzKHZub2RlKTtcbiAgICAgICAgd2hpbGUgKGMgJiYgIWlzT3duZXIgJiYgKGMgPSBjLl9fdSkpIGlzT3duZXIgPSBjLmNvbnN0cnVjdG9yID09PSB2bm9kZS5ub2RlTmFtZTtcbiAgICAgICAgaWYgKGMgJiYgaXNPd25lciAmJiAoIW1vdW50QWxsIHx8IGMuX2NvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIHNldENvbXBvbmVudFByb3BzKGMsIHByb3BzLCAzLCBjb250ZXh0LCBtb3VudEFsbCk7XG4gICAgICAgICAgICBkb20gPSBjLmJhc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3JpZ2luYWxDb21wb25lbnQgJiYgIWlzRGlyZWN0T3duZXIpIHtcbiAgICAgICAgICAgICAgICB1bm1vdW50Q29tcG9uZW50KG9yaWdpbmFsQ29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICBkb20gPSBvbGREb20gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYyA9IGNyZWF0ZUNvbXBvbmVudCh2bm9kZS5ub2RlTmFtZSwgcHJvcHMsIGNvbnRleHQpO1xuICAgICAgICAgICAgaWYgKGRvbSAmJiAhYy5fX2IpIHtcbiAgICAgICAgICAgICAgICBjLl9fYiA9IGRvbTtcbiAgICAgICAgICAgICAgICBvbGREb20gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0Q29tcG9uZW50UHJvcHMoYywgcHJvcHMsIDEsIGNvbnRleHQsIG1vdW50QWxsKTtcbiAgICAgICAgICAgIGRvbSA9IGMuYmFzZTtcbiAgICAgICAgICAgIGlmIChvbGREb20gJiYgZG9tICE9PSBvbGREb20pIHtcbiAgICAgICAgICAgICAgICBvbGREb20uX2NvbXBvbmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgcmVjb2xsZWN0Tm9kZVRyZWUob2xkRG9tLCAhMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvbTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdW5tb3VudENvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuYmVmb3JlVW5tb3VudCkgb3B0aW9ucy5iZWZvcmVVbm1vdW50KGNvbXBvbmVudCk7XG4gICAgICAgIHZhciBiYXNlID0gY29tcG9uZW50LmJhc2U7XG4gICAgICAgIGNvbXBvbmVudC5fX3ggPSAhMDtcbiAgICAgICAgaWYgKGNvbXBvbmVudC5jb21wb25lbnRXaWxsVW5tb3VudCkgY29tcG9uZW50LmNvbXBvbmVudFdpbGxVbm1vdW50KCk7XG4gICAgICAgIGNvbXBvbmVudC5iYXNlID0gbnVsbDtcbiAgICAgICAgdmFyIGlubmVyID0gY29tcG9uZW50Ll9jb21wb25lbnQ7XG4gICAgICAgIGlmIChpbm5lcikgdW5tb3VudENvbXBvbmVudChpbm5lcik7IGVsc2UgaWYgKGJhc2UpIHtcbiAgICAgICAgICAgIGlmIChudWxsICE9IGJhc2UuX19wcmVhY3RhdHRyXykgYXBwbHlSZWYoYmFzZS5fX3ByZWFjdGF0dHJfLnJlZiwgbnVsbCk7XG4gICAgICAgICAgICBjb21wb25lbnQuX19iID0gYmFzZTtcbiAgICAgICAgICAgIHJlbW92ZU5vZGUoYmFzZSk7XG4gICAgICAgICAgICByZWN5Y2xlckNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICAgICAgcmVtb3ZlQ2hpbGRyZW4oYmFzZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXBwbHlSZWYoY29tcG9uZW50Ll9fciwgbnVsbCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIENvbXBvbmVudChwcm9wcywgY29udGV4dCkge1xuICAgICAgICB0aGlzLl9fZCA9ICEwO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB0aGlzLnN0YXRlIHx8IHt9O1xuICAgICAgICB0aGlzLl9faCA9IFtdO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW5kZXIodm5vZGUsIHBhcmVudCwgbWVyZ2UpIHtcbiAgICAgICAgcmV0dXJuIGRpZmYobWVyZ2UsIHZub2RlLCB7fSwgITEsIHBhcmVudCwgITEpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVSZWYoKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgdmFyIFZOb2RlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB2YXIgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBzdGFjayA9IFtdO1xuICAgIHZhciBFTVBUWV9DSElMRFJFTiA9IFtdO1xuICAgIHZhciBkZWZlciA9ICdmdW5jdGlvbicgPT0gdHlwZW9mIFByb21pc2UgPyBQcm9taXNlLnJlc29sdmUoKS50aGVuLmJpbmQoUHJvbWlzZS5yZXNvbHZlKCkpIDogc2V0VGltZW91dDtcbiAgICB2YXIgSVNfTk9OX0RJTUVOU0lPTkFMID0gL2FjaXR8ZXgoPzpzfGd8bnxwfCQpfHJwaHxvd3N8bW5jfG50d3xpbmVbY2hdfHpvb3xeb3JkL2k7XG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgdmFyIG1vdW50cyA9IFtdO1xuICAgIHZhciBkaWZmTGV2ZWwgPSAwO1xuICAgIHZhciBpc1N2Z01vZGUgPSAhMTtcbiAgICB2YXIgaHlkcmF0aW5nID0gITE7XG4gICAgdmFyIHJlY3ljbGVyQ29tcG9uZW50cyA9IFtdO1xuICAgIGV4dGVuZChDb21wb25lbnQucHJvdG90eXBlLCB7XG4gICAgICAgIHNldFN0YXRlOiBmdW5jdGlvbihzdGF0ZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fX3MpIHRoaXMuX19zID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBleHRlbmQoZXh0ZW5kKHt9LCB0aGlzLnN0YXRlKSwgJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygc3RhdGUgPyBzdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnByb3BzKSA6IHN0YXRlKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgdGhpcy5fX2gucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICBlbnF1ZXVlUmVuZGVyKHRoaXMpO1xuICAgICAgICB9LFxuICAgICAgICBmb3JjZVVwZGF0ZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgdGhpcy5fX2gucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZW5kZXJDb21wb25lbnQodGhpcywgMik7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7fVxuICAgIH0pO1xuICAgIHZhciBwcmVhY3QgPSB7XG4gICAgICAgIGg6IGgsXG4gICAgICAgIGNyZWF0ZUVsZW1lbnQ6IGgsXG4gICAgICAgIGNsb25lRWxlbWVudDogY2xvbmVFbGVtZW50LFxuICAgICAgICBjcmVhdGVSZWY6IGNyZWF0ZVJlZixcbiAgICAgICAgQ29tcG9uZW50OiBDb21wb25lbnQsXG4gICAgICAgIHJlbmRlcjogcmVuZGVyLFxuICAgICAgICByZXJlbmRlcjogcmVyZW5kZXIsXG4gICAgICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgICB9O1xuICAgIGlmICgndW5kZWZpbmVkJyAhPSB0eXBlb2YgbW9kdWxlKSBtb2R1bGUuZXhwb3J0cyA9IHByZWFjdDsgZWxzZSBzZWxmLnByZWFjdCA9IHByZWFjdDtcbn0oKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByZWFjdC5qcy5tYXAiLCJtb2R1bGUuZXhwb3J0cyA9IHByZXR0aWVyQnl0ZXNcblxuZnVuY3Rpb24gcHJldHRpZXJCeXRlcyAobnVtKSB7XG4gIGlmICh0eXBlb2YgbnVtICE9PSAnbnVtYmVyJyB8fCBpc05hTihudW0pKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBudW1iZXIsIGdvdCAnICsgdHlwZW9mIG51bSlcbiAgfVxuXG4gIHZhciBuZWcgPSBudW0gPCAwXG4gIHZhciB1bml0cyA9IFsnQicsICdLQicsICdNQicsICdHQicsICdUQicsICdQQicsICdFQicsICdaQicsICdZQiddXG5cbiAgaWYgKG5lZykge1xuICAgIG51bSA9IC1udW1cbiAgfVxuXG4gIGlmIChudW0gPCAxKSB7XG4gICAgcmV0dXJuIChuZWcgPyAnLScgOiAnJykgKyBudW0gKyAnIEInXG4gIH1cblxuICB2YXIgZXhwb25lbnQgPSBNYXRoLm1pbihNYXRoLmZsb29yKE1hdGgubG9nKG51bSkgLyBNYXRoLmxvZygxMDAwKSksIHVuaXRzLmxlbmd0aCAtIDEpXG4gIG51bSA9IE51bWJlcihudW0gLyBNYXRoLnBvdygxMDAwLCBleHBvbmVudCkpXG4gIHZhciB1bml0ID0gdW5pdHNbZXhwb25lbnRdXG5cbiAgaWYgKG51bSA+PSAxMCB8fCBudW0gJSAxID09PSAwKSB7XG4gICAgLy8gRG8gbm90IHNob3cgZGVjaW1hbHMgd2hlbiB0aGUgbnVtYmVyIGlzIHR3by1kaWdpdCwgb3IgaWYgdGhlIG51bWJlciBoYXMgbm9cbiAgICAvLyBkZWNpbWFsIGNvbXBvbmVudC5cbiAgICByZXR1cm4gKG5lZyA/ICctJyA6ICcnKSArIG51bS50b0ZpeGVkKDApICsgJyAnICsgdW5pdFxuICB9IGVsc2Uge1xuICAgIHJldHVybiAobmVnID8gJy0nIDogJycpICsgbnVtLnRvRml4ZWQoMSkgKyAnICcgKyB1bml0XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCB1bmRlZjtcblxuLyoqXG4gKiBEZWNvZGUgYSBVUkkgZW5jb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBVUkkgZW5jb2RlZCBzdHJpbmcuXG4gKiBAcmV0dXJucyB7U3RyaW5nfE51bGx9IFRoZSBkZWNvZGVkIHN0cmluZy5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBkZWNvZGUoaW5wdXQpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGlucHV0LnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogQXR0ZW1wdHMgdG8gZW5jb2RlIGEgZ2l2ZW4gaW5wdXQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBzdHJpbmcgdGhhdCBuZWVkcyB0byBiZSBlbmNvZGVkLlxuICogQHJldHVybnMge1N0cmluZ3xOdWxsfSBUaGUgZW5jb2RlZCBzdHJpbmcuXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZW5jb2RlKGlucHV0KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChpbnB1dCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFNpbXBsZSBxdWVyeSBzdHJpbmcgcGFyc2VyLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBxdWVyeSBUaGUgcXVlcnkgc3RyaW5nIHRoYXQgbmVlZHMgdG8gYmUgcGFyc2VkLlxuICogQHJldHVybnMge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIHF1ZXJ5c3RyaW5nKHF1ZXJ5KSB7XG4gIHZhciBwYXJzZXIgPSAvKFtePT8mXSspPT8oW14mXSopL2dcbiAgICAsIHJlc3VsdCA9IHt9XG4gICAgLCBwYXJ0O1xuXG4gIHdoaWxlIChwYXJ0ID0gcGFyc2VyLmV4ZWMocXVlcnkpKSB7XG4gICAgdmFyIGtleSA9IGRlY29kZShwYXJ0WzFdKVxuICAgICAgLCB2YWx1ZSA9IGRlY29kZShwYXJ0WzJdKTtcblxuICAgIC8vXG4gICAgLy8gUHJldmVudCBvdmVycmlkaW5nIG9mIGV4aXN0aW5nIHByb3BlcnRpZXMuIFRoaXMgZW5zdXJlcyB0aGF0IGJ1aWxkLWluXG4gICAgLy8gbWV0aG9kcyBsaWtlIGB0b1N0cmluZ2Agb3IgX19wcm90b19fIGFyZSBub3Qgb3ZlcnJpZGVuIGJ5IG1hbGljaW91c1xuICAgIC8vIHF1ZXJ5c3RyaW5ncy5cbiAgICAvL1xuICAgIC8vIEluIHRoZSBjYXNlIGlmIGZhaWxlZCBkZWNvZGluZywgd2Ugd2FudCB0byBvbWl0IHRoZSBrZXkvdmFsdWUgcGFpcnNcbiAgICAvLyBmcm9tIHRoZSByZXN1bHQuXG4gICAgLy9cbiAgICBpZiAoa2V5ID09PSBudWxsIHx8IHZhbHVlID09PSBudWxsIHx8IGtleSBpbiByZXN1bHQpIGNvbnRpbnVlO1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhIHF1ZXJ5IHN0cmluZyB0byBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBPYmplY3QgdGhhdCBzaG91bGQgYmUgdHJhbnNmb3JtZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJlZml4IE9wdGlvbmFsIHByZWZpeC5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBxdWVyeXN0cmluZ2lmeShvYmosIHByZWZpeCkge1xuICBwcmVmaXggPSBwcmVmaXggfHwgJyc7XG5cbiAgdmFyIHBhaXJzID0gW11cbiAgICAsIHZhbHVlXG4gICAgLCBrZXk7XG5cbiAgLy9cbiAgLy8gT3B0aW9uYWxseSBwcmVmaXggd2l0aCBhICc/JyBpZiBuZWVkZWRcbiAgLy9cbiAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgcHJlZml4KSBwcmVmaXggPSAnPyc7XG5cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgICAgLy9cbiAgICAgIC8vIEVkZ2UgY2FzZXMgd2hlcmUgd2UgYWN0dWFsbHkgd2FudCB0byBlbmNvZGUgdGhlIHZhbHVlIHRvIGFuIGVtcHR5XG4gICAgICAvLyBzdHJpbmcgaW5zdGVhZCBvZiB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gICAgICAvL1xuICAgICAgaWYgKCF2YWx1ZSAmJiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmIHx8IGlzTmFOKHZhbHVlKSkpIHtcbiAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgIH1cblxuICAgICAga2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSk7XG4gICAgICB2YWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG5cbiAgICAgIC8vXG4gICAgICAvLyBJZiB3ZSBmYWlsZWQgdG8gZW5jb2RlIHRoZSBzdHJpbmdzLCB3ZSBzaG91bGQgYmFpbCBvdXQgYXMgd2UgZG9uJ3RcbiAgICAgIC8vIHdhbnQgdG8gYWRkIGludmFsaWQgc3RyaW5ncyB0byB0aGUgcXVlcnkuXG4gICAgICAvL1xuICAgICAgaWYgKGtleSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gbnVsbCkgY29udGludWU7XG4gICAgICBwYWlycy5wdXNoKGtleSArJz0nKyB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhaXJzLmxlbmd0aCA/IHByZWZpeCArIHBhaXJzLmpvaW4oJyYnKSA6ICcnO1xufVxuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuZXhwb3J0cy5zdHJpbmdpZnkgPSBxdWVyeXN0cmluZ2lmeTtcbmV4cG9ydHMucGFyc2UgPSBxdWVyeXN0cmluZztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDaGVjayBpZiB3ZSdyZSByZXF1aXJlZCB0byBhZGQgYSBwb3J0IG51bWJlci5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vdXJsLnNwZWMud2hhdHdnLm9yZy8jZGVmYXVsdC1wb3J0XG4gKiBAcGFyYW0ge051bWJlcnxTdHJpbmd9IHBvcnQgUG9ydCBudW1iZXIgd2UgbmVlZCB0byBjaGVja1xuICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sIFByb3RvY29sIHdlIG5lZWQgdG8gY2hlY2sgYWdhaW5zdC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJcyBpdCBhIGRlZmF1bHQgcG9ydCBmb3IgdGhlIGdpdmVuIHByb3RvY29sXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZXF1aXJlZChwb3J0LCBwcm90b2NvbCkge1xuICBwcm90b2NvbCA9IHByb3RvY29sLnNwbGl0KCc6JylbMF07XG4gIHBvcnQgPSArcG9ydDtcblxuICBpZiAoIXBvcnQpIHJldHVybiBmYWxzZTtcblxuICBzd2l0Y2ggKHByb3RvY29sKSB7XG4gICAgY2FzZSAnaHR0cCc6XG4gICAgY2FzZSAnd3MnOlxuICAgIHJldHVybiBwb3J0ICE9PSA4MDtcblxuICAgIGNhc2UgJ2h0dHBzJzpcbiAgICBjYXNlICd3c3MnOlxuICAgIHJldHVybiBwb3J0ICE9PSA0NDM7XG5cbiAgICBjYXNlICdmdHAnOlxuICAgIHJldHVybiBwb3J0ICE9PSAyMTtcblxuICAgIGNhc2UgJ2dvcGhlcic6XG4gICAgcmV0dXJuIHBvcnQgIT09IDcwO1xuXG4gICAgY2FzZSAnZmlsZSc6XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHBvcnQgIT09IDA7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBydW5QYXJhbGxlbFxuXG5mdW5jdGlvbiBydW5QYXJhbGxlbCAodGFza3MsIGNiKSB7XG4gIHZhciByZXN1bHRzLCBwZW5kaW5nLCBrZXlzXG4gIHZhciBpc1N5bmMgPSB0cnVlXG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodGFza3MpKSB7XG4gICAgcmVzdWx0cyA9IFtdXG4gICAgcGVuZGluZyA9IHRhc2tzLmxlbmd0aFxuICB9IGVsc2Uge1xuICAgIGtleXMgPSBPYmplY3Qua2V5cyh0YXNrcylcbiAgICByZXN1bHRzID0ge31cbiAgICBwZW5kaW5nID0ga2V5cy5sZW5ndGhcbiAgfVxuXG4gIGZ1bmN0aW9uIGRvbmUgKGVycikge1xuICAgIGZ1bmN0aW9uIGVuZCAoKSB7XG4gICAgICBpZiAoY2IpIGNiKGVyciwgcmVzdWx0cylcbiAgICAgIGNiID0gbnVsbFxuICAgIH1cbiAgICBpZiAoaXNTeW5jKSBwcm9jZXNzLm5leHRUaWNrKGVuZClcbiAgICBlbHNlIGVuZCgpXG4gIH1cblxuICBmdW5jdGlvbiBlYWNoIChpLCBlcnIsIHJlc3VsdCkge1xuICAgIHJlc3VsdHNbaV0gPSByZXN1bHRcbiAgICBpZiAoLS1wZW5kaW5nID09PSAwIHx8IGVycikge1xuICAgICAgZG9uZShlcnIpXG4gICAgfVxuICB9XG5cbiAgaWYgKCFwZW5kaW5nKSB7XG4gICAgLy8gZW1wdHlcbiAgICBkb25lKG51bGwpXG4gIH0gZWxzZSBpZiAoa2V5cykge1xuICAgIC8vIG9iamVjdFxuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICB0YXNrc1trZXldKGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkgeyBlYWNoKGtleSwgZXJyLCByZXN1bHQpIH0pXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICAvLyBhcnJheVxuICAgIHRhc2tzLmZvckVhY2goZnVuY3Rpb24gKHRhc2ssIGkpIHtcbiAgICAgIHRhc2soZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7IGVhY2goaSwgZXJyLCByZXN1bHQpIH0pXG4gICAgfSlcbiAgfVxuXG4gIGlzU3luYyA9IGZhbHNlXG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbnZhciBpc0NvcmRvdmEgPSBmdW5jdGlvbiBpc0NvcmRvdmEoKSB7XG4gIHJldHVybiB0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIgJiYgKHR5cGVvZiB3aW5kb3cuUGhvbmVHYXAgIT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2Ygd2luZG93LkNvcmRvdmEgIT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2Ygd2luZG93LmNvcmRvdmEgIT0gXCJ1bmRlZmluZWRcIik7XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBpc0NvcmRvdmE7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgaXNSZWFjdE5hdGl2ZSA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIG5hdmlnYXRvci5wcm9kdWN0ID09PSBcInN0cmluZ1wiICYmIG5hdmlnYXRvci5wcm9kdWN0LnRvTG93ZXJDYXNlKCkgPT09IFwicmVhY3RuYXRpdmVcIjtcblxuZXhwb3J0cy5kZWZhdWx0ID0gaXNSZWFjdE5hdGl2ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8qKlxuICogcmVhZEFzQnl0ZUFycmF5IGNvbnZlcnRzIGEgRmlsZSBvYmplY3QgdG8gYSBVaW50OEFycmF5LlxuICogVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgb24gdGhlIEFwYWNoZSBDb3Jkb3ZhIHBsYXRmb3JtLlxuICogU2VlIGh0dHBzOi8vY29yZG92YS5hcGFjaGUub3JnL2RvY3MvZW4vbGF0ZXN0L3JlZmVyZW5jZS9jb3Jkb3ZhLXBsdWdpbi1maWxlL2luZGV4Lmh0bWwjcmVhZC1hLWZpbGVcbiAqL1xuZnVuY3Rpb24gcmVhZEFzQnl0ZUFycmF5KGNodW5rLCBjYWxsYmFjaykge1xuICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjYWxsYmFjayhudWxsLCBuZXcgVWludDhBcnJheShyZWFkZXIucmVzdWx0KSk7XG4gIH07XG4gIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgIGNhbGxiYWNrKGVycik7XG4gIH07XG4gIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihjaHVuayk7XG59XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHJlYWRBc0J5dGVBcnJheTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMubmV3UmVxdWVzdCA9IG5ld1JlcXVlc3Q7XG5leHBvcnRzLnJlc29sdmVVcmwgPSByZXNvbHZlVXJsO1xuXG52YXIgX3VybFBhcnNlID0gcmVxdWlyZShcInVybC1wYXJzZVwiKTtcblxudmFyIF91cmxQYXJzZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cmxQYXJzZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIG5ld1JlcXVlc3QoKSB7XG4gIHJldHVybiBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XG59IC8qIGdsb2JhbCB3aW5kb3cgKi9cbmZ1bmN0aW9uIHJlc29sdmVVcmwob3JpZ2luLCBsaW5rKSB7XG4gIHJldHVybiBuZXcgX3VybFBhcnNlMi5kZWZhdWx0KGxpbmssIG9yaWdpbikudG9TdHJpbmcoKTtcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZXhwb3J0cy5nZXRTb3VyY2UgPSBnZXRTb3VyY2U7XG5cbnZhciBfaXNSZWFjdE5hdGl2ZSA9IHJlcXVpcmUoXCIuL2lzUmVhY3ROYXRpdmVcIik7XG5cbnZhciBfaXNSZWFjdE5hdGl2ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pc1JlYWN0TmF0aXZlKTtcblxudmFyIF91cmlUb0Jsb2IgPSByZXF1aXJlKFwiLi91cmlUb0Jsb2JcIik7XG5cbnZhciBfdXJpVG9CbG9iMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VyaVRvQmxvYik7XG5cbnZhciBfaXNDb3Jkb3ZhID0gcmVxdWlyZShcIi4vaXNDb3Jkb3ZhXCIpO1xuXG52YXIgX2lzQ29yZG92YTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pc0NvcmRvdmEpO1xuXG52YXIgX3JlYWRBc0J5dGVBcnJheSA9IHJlcXVpcmUoXCIuL3JlYWRBc0J5dGVBcnJheVwiKTtcblxudmFyIF9yZWFkQXNCeXRlQXJyYXkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhZEFzQnl0ZUFycmF5KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIEZpbGVTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEZpbGVTb3VyY2UoZmlsZSkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBGaWxlU291cmNlKTtcblxuICAgIHRoaXMuX2ZpbGUgPSBmaWxlO1xuICAgIHRoaXMuc2l6ZSA9IGZpbGUuc2l6ZTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhGaWxlU291cmNlLCBbe1xuICAgIGtleTogXCJzbGljZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzbGljZShzdGFydCwgZW5kLCBjYWxsYmFjaykge1xuICAgICAgLy8gSW4gQXBhY2hlIENvcmRvdmEgYXBwbGljYXRpb25zLCBhIEZpbGUgbXVzdCBiZSByZXNvbHZlZCB1c2luZ1xuICAgICAgLy8gRmlsZVJlYWRlciBpbnN0YW5jZXMsIHNlZVxuICAgICAgLy8gaHR0cHM6Ly9jb3Jkb3ZhLmFwYWNoZS5vcmcvZG9jcy9lbi84LngvcmVmZXJlbmNlL2NvcmRvdmEtcGx1Z2luLWZpbGUvaW5kZXguaHRtbCNyZWFkLWEtZmlsZVxuICAgICAgaWYgKCgwLCBfaXNDb3Jkb3ZhMi5kZWZhdWx0KSgpKSB7XG4gICAgICAgICgwLCBfcmVhZEFzQnl0ZUFycmF5Mi5kZWZhdWx0KSh0aGlzLl9maWxlLnNsaWNlKHN0YXJ0LCBlbmQpLCBmdW5jdGlvbiAoZXJyLCBjaHVuaykge1xuICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpO1xuXG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgY2h1bmspO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjYWxsYmFjayhudWxsLCB0aGlzLl9maWxlLnNsaWNlKHN0YXJ0LCBlbmQpKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2xvc2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7fVxuICB9XSk7XG5cbiAgcmV0dXJuIEZpbGVTb3VyY2U7XG59KCk7XG5cbnZhciBTdHJlYW1Tb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFN0cmVhbVNvdXJjZShyZWFkZXIsIGNodW5rU2l6ZSkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBTdHJlYW1Tb3VyY2UpO1xuXG4gICAgdGhpcy5fY2h1bmtTaXplID0gY2h1bmtTaXplO1xuICAgIHRoaXMuX2J1ZmZlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9idWZmZXJPZmZzZXQgPSAwO1xuICAgIHRoaXMuX3JlYWRlciA9IHJlYWRlcjtcbiAgICB0aGlzLl9kb25lID0gZmFsc2U7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoU3RyZWFtU291cmNlLCBbe1xuICAgIGtleTogXCJzbGljZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzbGljZShzdGFydCwgZW5kLCBjYWxsYmFjaykge1xuICAgICAgaWYgKHN0YXJ0IDwgdGhpcy5fYnVmZmVyT2Zmc2V0KSB7XG4gICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIlJlcXVlc3RlZCBkYXRhIGlzIGJlZm9yZSB0aGUgcmVhZGVyJ3MgY3VycmVudCBvZmZzZXRcIikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9yZWFkVW50aWxFbm91Z2hEYXRhT3JEb25lKHN0YXJ0LCBlbmQsIGNhbGxiYWNrKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiX3JlYWRVbnRpbEVub3VnaERhdGFPckRvbmVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX3JlYWRVbnRpbEVub3VnaERhdGFPckRvbmUoc3RhcnQsIGVuZCwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgIHZhciBoYXNFbm91Z2hEYXRhID0gZW5kIDw9IHRoaXMuX2J1ZmZlck9mZnNldCArIGxlbih0aGlzLl9idWZmZXIpO1xuICAgICAgaWYgKHRoaXMuX2RvbmUgfHwgaGFzRW5vdWdoRGF0YSkge1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLl9nZXREYXRhRnJvbUJ1ZmZlcihzdGFydCwgZW5kKTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUsIHZhbHVlID09IG51bGwgPyB0aGlzLl9kb25lIDogZmFsc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9yZWFkZXIucmVhZCgpLnRoZW4oZnVuY3Rpb24gKF9yZWYpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gX3JlZi52YWx1ZSxcbiAgICAgICAgICAgIGRvbmUgPSBfcmVmLmRvbmU7XG5cbiAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICBfdGhpcy5fZG9uZSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoX3RoaXMuX2J1ZmZlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgX3RoaXMuX2J1ZmZlciA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF90aGlzLl9idWZmZXIgPSBjb25jYXQoX3RoaXMuX2J1ZmZlciwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXMuX3JlYWRVbnRpbEVub3VnaERhdGFPckRvbmUoc3RhcnQsIGVuZCwgY2FsbGJhY2spO1xuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJFcnJvciBkdXJpbmcgcmVhZDogXCIgKyBlcnIpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJfZ2V0RGF0YUZyb21CdWZmZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX2dldERhdGFGcm9tQnVmZmVyKHN0YXJ0LCBlbmQpIHtcbiAgICAgIC8vIFJlbW92ZSBkYXRhIGZyb20gYnVmZmVyIGJlZm9yZSBgc3RhcnRgLlxuICAgICAgLy8gRGF0YSBtaWdodCBiZSByZXJlYWQgZnJvbSB0aGUgYnVmZmVyIGlmIGFuIHVwbG9hZCBmYWlscywgc28gd2UgY2FuIG9ubHlcbiAgICAgIC8vIHNhZmVseSBkZWxldGUgZGF0YSB3aGVuIGl0IGNvbWVzICpiZWZvcmUqIHdoYXQgaXMgY3VycmVudGx5IGJlaW5nIHJlYWQuXG4gICAgICBpZiAoc3RhcnQgPiB0aGlzLl9idWZmZXJPZmZzZXQpIHtcbiAgICAgICAgdGhpcy5fYnVmZmVyID0gdGhpcy5fYnVmZmVyLnNsaWNlKHN0YXJ0IC0gdGhpcy5fYnVmZmVyT2Zmc2V0KTtcbiAgICAgICAgdGhpcy5fYnVmZmVyT2Zmc2V0ID0gc3RhcnQ7XG4gICAgICB9XG4gICAgICAvLyBJZiB0aGUgYnVmZmVyIGlzIGVtcHR5IGFmdGVyIHJlbW92aW5nIG9sZCBkYXRhLCBhbGwgZGF0YSBoYXMgYmVlbiByZWFkLlxuICAgICAgdmFyIGhhc0FsbERhdGFCZWVuUmVhZCA9IGxlbih0aGlzLl9idWZmZXIpID09PSAwO1xuICAgICAgaWYgKHRoaXMuX2RvbmUgJiYgaGFzQWxsRGF0YUJlZW5SZWFkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgLy8gV2UgYWxyZWFkeSByZW1vdmVkIGRhdGEgYmVmb3JlIGBzdGFydGAsIHNvIHdlIGp1c3QgcmV0dXJuIHRoZSBmaXJzdFxuICAgICAgLy8gY2h1bmsgZnJvbSB0aGUgYnVmZmVyLlxuICAgICAgcmV0dXJuIHRoaXMuX2J1ZmZlci5zbGljZSgwLCBlbmQgLSBzdGFydCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNsb3NlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgaWYgKHRoaXMuX3JlYWRlci5jYW5jZWwpIHtcbiAgICAgICAgdGhpcy5fcmVhZGVyLmNhbmNlbCgpO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBTdHJlYW1Tb3VyY2U7XG59KCk7XG5cbmZ1bmN0aW9uIGxlbihibG9iT3JBcnJheSkge1xuICBpZiAoYmxvYk9yQXJyYXkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDA7XG4gIGlmIChibG9iT3JBcnJheS5zaXplICE9PSB1bmRlZmluZWQpIHJldHVybiBibG9iT3JBcnJheS5zaXplO1xuICByZXR1cm4gYmxvYk9yQXJyYXkubGVuZ3RoO1xufVxuXG4vKlxuICBUeXBlZCBhcnJheXMgYW5kIGJsb2JzIGRvbid0IGhhdmUgYSBjb25jYXQgbWV0aG9kLlxuICBUaGlzIGZ1bmN0aW9uIGhlbHBzIFN0cmVhbVNvdXJjZSBhY2N1bXVsYXRlIGRhdGEgdG8gcmVhY2ggY2h1bmtTaXplLlxuKi9cbmZ1bmN0aW9uIGNvbmNhdChhLCBiKSB7XG4gIGlmIChhLmNvbmNhdCkge1xuICAgIC8vIElzIGBhYCBhbiBBcnJheT9cbiAgICByZXR1cm4gYS5jb25jYXQoYik7XG4gIH1cbiAgaWYgKGEgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgcmV0dXJuIG5ldyBCbG9iKFthLCBiXSwgeyB0eXBlOiBhLnR5cGUgfSk7XG4gIH1cbiAgaWYgKGEuc2V0KSB7XG4gICAgLy8gSXMgYGFgIGEgdHlwZWQgYXJyYXk/XG4gICAgdmFyIGMgPSBuZXcgYS5jb25zdHJ1Y3RvcihhLmxlbmd0aCArIGIubGVuZ3RoKTtcbiAgICBjLnNldChhKTtcbiAgICBjLnNldChiLCBhLmxlbmd0aCk7XG4gICAgcmV0dXJuIGM7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBkYXRhIHR5cGVcIik7XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZShpbnB1dCwgY2h1bmtTaXplLCBjYWxsYmFjaykge1xuICAvLyBJbiBSZWFjdCBOYXRpdmUsIHdoZW4gdXNlciBzZWxlY3RzIGEgZmlsZSwgaW5zdGVhZCBvZiBhIEZpbGUgb3IgQmxvYixcbiAgLy8geW91IHVzdWFsbHkgZ2V0IGEgZmlsZSBvYmplY3Qge30gd2l0aCBhIHVyaSBwcm9wZXJ0eSB0aGF0IGNvbnRhaW5zXG4gIC8vIGEgbG9jYWwgcGF0aCB0byB0aGUgZmlsZS4gV2UgdXNlIFhNTEh0dHBSZXF1ZXN0IHRvIGZldGNoXG4gIC8vIHRoZSBmaWxlIGJsb2IsIGJlZm9yZSB1cGxvYWRpbmcgd2l0aCB0dXMuXG4gIC8vIFRPRE86IFRoZSBfX3R1c19fZm9yY2VSZWFjdE5hdGl2ZSBwcm9wZXJ0eSBpcyBjdXJyZW50bHkgdXNlZCB0byBmb3JjZVxuICAvLyBhIFJlYWN0IE5hdGl2ZSBlbnZpcm9ubWVudCBkdXJpbmcgdGVzdGluZy4gVGhpcyBzaG91bGQgYmUgcmVtb3ZlZFxuICAvLyBvbmNlIHdlIG1vdmUgYXdheSBmcm9tIFBoYW50b21KUyBhbmQgY2FuIG92ZXJ3cml0ZSBuYXZpZ2F0b3IucHJvZHVjdFxuICAvLyBwcm9wZXJseS5cbiAgaWYgKChfaXNSZWFjdE5hdGl2ZTIuZGVmYXVsdCB8fCB3aW5kb3cuX190dXNfX2ZvcmNlUmVhY3ROYXRpdmUpICYmIGlucHV0ICYmIHR5cGVvZiBpbnB1dC51cmkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAoMCwgX3VyaVRvQmxvYjIuZGVmYXVsdCkoaW5wdXQudXJpLCBmdW5jdGlvbiAoZXJyLCBibG9iKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJ0dXM6IGNhbm5vdCBmZXRjaCBgZmlsZS51cmlgIGFzIEJsb2IsIG1ha2Ugc3VyZSB0aGUgdXJpIGlzIGNvcnJlY3QgYW5kIGFjY2Vzc2libGUuIFwiICsgZXJyKSk7XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhudWxsLCBuZXcgRmlsZVNvdXJjZShibG9iKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gU2luY2Ugd2UgZW11bGF0ZSB0aGUgQmxvYiB0eXBlIGluIG91ciB0ZXN0cyAobm90IGFsbCB0YXJnZXQgYnJvd3NlcnNcbiAgLy8gc3VwcG9ydCBpdCksIHdlIGNhbm5vdCB1c2UgYGluc3RhbmNlb2ZgIGZvciB0ZXN0aW5nIHdoZXRoZXIgdGhlIGlucHV0IHZhbHVlXG4gIC8vIGNhbiBiZSBoYW5kbGVkLiBJbnN0ZWFkLCB3ZSBzaW1wbHkgY2hlY2sgaXMgdGhlIHNsaWNlKCkgZnVuY3Rpb24gYW5kIHRoZVxuICAvLyBzaXplIHByb3BlcnR5IGFyZSBhdmFpbGFibGUuXG4gIGlmICh0eXBlb2YgaW5wdXQuc2xpY2UgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgaW5wdXQuc2l6ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGNhbGxiYWNrKG51bGwsIG5ldyBGaWxlU291cmNlKGlucHV0KSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBpbnB1dC5yZWFkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjaHVua1NpemUgPSArY2h1bmtTaXplO1xuICAgIGlmICghaXNGaW5pdGUoY2h1bmtTaXplKSkge1xuICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiY2Fubm90IGNyZWF0ZSBzb3VyY2UgZm9yIHN0cmVhbSB3aXRob3V0IGEgZmluaXRlIHZhbHVlIGZvciB0aGUgYGNodW5rU2l6ZWAgb3B0aW9uXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2FsbGJhY2sobnVsbCwgbmV3IFN0cmVhbVNvdXJjZShpbnB1dCwgY2h1bmtTaXplKSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY2FsbGJhY2sobmV3IEVycm9yKFwic291cmNlIG9iamVjdCBtYXkgb25seSBiZSBhbiBpbnN0YW5jZSBvZiBGaWxlLCBCbG9iLCBvciBSZWFkZXIgaW4gdGhpcyBlbnZpcm9ubWVudFwiKSk7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmV4cG9ydHMuZ2V0U3RvcmFnZSA9IGdldFN0b3JhZ2U7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qIGdsb2JhbCB3aW5kb3csIGxvY2FsU3RvcmFnZSAqL1xuXG52YXIgaGFzU3RvcmFnZSA9IGZhbHNlO1xudHJ5IHtcbiAgaGFzU3RvcmFnZSA9IFwibG9jYWxTdG9yYWdlXCIgaW4gd2luZG93O1xuXG4gIC8vIEF0dGVtcHQgdG8gc3RvcmUgYW5kIHJlYWQgZW50cmllcyBmcm9tIHRoZSBsb2NhbCBzdG9yYWdlIHRvIGRldGVjdCBQcml2YXRlXG4gIC8vIE1vZGUgb24gU2FmYXJpIG9uIGlPUyAoc2VlICM0OSlcbiAgdmFyIGtleSA9IFwidHVzU3VwcG9ydFwiO1xuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpO1xufSBjYXRjaCAoZSkge1xuICAvLyBJZiB3ZSB0cnkgdG8gYWNjZXNzIGxvY2FsU3RvcmFnZSBpbnNpZGUgYSBzYW5kYm94ZWQgaWZyYW1lLCBhIFNlY3VyaXR5RXJyb3JcbiAgLy8gaXMgdGhyb3duLiBXaGVuIGluIHByaXZhdGUgbW9kZSBvbiBpT1MgU2FmYXJpLCBhIFF1b3RhRXhjZWVkZWRFcnJvciBpc1xuICAvLyB0aHJvd24gKHNlZSAjNDkpXG4gIGlmIChlLmNvZGUgPT09IGUuU0VDVVJJVFlfRVJSIHx8IGUuY29kZSA9PT0gZS5RVU9UQV9FWENFRURFRF9FUlIpIHtcbiAgICBoYXNTdG9yYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG52YXIgY2FuU3RvcmVVUkxzID0gZXhwb3J0cy5jYW5TdG9yZVVSTHMgPSBoYXNTdG9yYWdlO1xuXG52YXIgTG9jYWxTdG9yYWdlID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBMb2NhbFN0b3JhZ2UoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExvY2FsU3RvcmFnZSk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoTG9jYWxTdG9yYWdlLCBbe1xuICAgIGtleTogXCJzZXRJdGVtXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldEl0ZW0oa2V5LCB2YWx1ZSwgY2IpIHtcbiAgICAgIGlmICghaGFzU3RvcmFnZSkgcmV0dXJuIGNiKCk7XG4gICAgICBjYihudWxsLCBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbHVlKSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldEl0ZW1cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0SXRlbShrZXksIGNiKSB7XG4gICAgICBpZiAoIWhhc1N0b3JhZ2UpIHJldHVybiBjYigpO1xuICAgICAgY2IobnVsbCwgbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZUl0ZW1cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXksIGNiKSB7XG4gICAgICBpZiAoIWhhc1N0b3JhZ2UpIHJldHVybiBjYigpO1xuICAgICAgY2IobnVsbCwgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KSk7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIExvY2FsU3RvcmFnZTtcbn0oKTtcblxuZnVuY3Rpb24gZ2V0U3RvcmFnZSgpIHtcbiAgcmV0dXJuIG5ldyBMb2NhbFN0b3JhZ2UoKTtcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbi8qKlxuICogdXJpVG9CbG9iIHJlc29sdmVzIGEgVVJJIHRvIGEgQmxvYiBvYmplY3QuIFRoaXMgaXMgdXNlZCBmb3JcbiAqIFJlYWN0IE5hdGl2ZSB0byByZXRyaWV2ZSBhIGZpbGUgKGlkZW50aWZpZWQgYnkgYSBmaWxlOi8vXG4gKiBVUkkpIGFzIGEgYmxvYi5cbiAqL1xuZnVuY3Rpb24gdXJpVG9CbG9iKHVyaSwgZG9uZSkge1xuICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHhoci5yZXNwb25zZVR5cGUgPSBcImJsb2JcIjtcbiAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYmxvYiA9IHhoci5yZXNwb25zZTtcbiAgICBkb25lKG51bGwsIGJsb2IpO1xuICB9O1xuICB4aHIub25lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICBkb25lKGVycik7XG4gIH07XG4gIHhoci5vcGVuKFwiR0VUXCIsIHVyaSk7XG4gIHhoci5zZW5kKCk7XG59XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHVyaVRvQmxvYjsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoIXNlbGYpIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBjYWxsICYmICh0eXBlb2YgY2FsbCA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSA/IGNhbGwgOiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgRGV0YWlsZWRFcnJvciA9IGZ1bmN0aW9uIChfRXJyb3IpIHtcbiAgX2luaGVyaXRzKERldGFpbGVkRXJyb3IsIF9FcnJvcik7XG5cbiAgZnVuY3Rpb24gRGV0YWlsZWRFcnJvcihlcnJvcikge1xuICAgIHZhciBjYXVzaW5nRXJyID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xuICAgIHZhciB4aHIgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IG51bGw7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRGV0YWlsZWRFcnJvcik7XG5cbiAgICB2YXIgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoRGV0YWlsZWRFcnJvci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKERldGFpbGVkRXJyb3IpKS5jYWxsKHRoaXMsIGVycm9yLm1lc3NhZ2UpKTtcblxuICAgIF90aGlzLm9yaWdpbmFsUmVxdWVzdCA9IHhocjtcbiAgICBfdGhpcy5jYXVzaW5nRXJyb3IgPSBjYXVzaW5nRXJyO1xuXG4gICAgdmFyIG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuICAgIGlmIChjYXVzaW5nRXJyICE9IG51bGwpIHtcbiAgICAgIG1lc3NhZ2UgKz0gXCIsIGNhdXNlZCBieSBcIiArIGNhdXNpbmdFcnIudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHhociAhPSBudWxsKSB7XG4gICAgICBtZXNzYWdlICs9IFwiLCBvcmlnaW5hdGVkIGZyb20gcmVxdWVzdCAocmVzcG9uc2UgY29kZTogXCIgKyB4aHIuc3RhdHVzICsgXCIsIHJlc3BvbnNlIHRleHQ6IFwiICsgeGhyLnJlc3BvbnNlVGV4dCArIFwiKVwiO1xuICAgIH1cbiAgICBfdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gRGV0YWlsZWRFcnJvcjtcbn0oRXJyb3IpO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBEZXRhaWxlZEVycm9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZmluZ2VycHJpbnQ7XG5cbnZhciBfaXNSZWFjdE5hdGl2ZSA9IHJlcXVpcmUoXCIuL25vZGUvaXNSZWFjdE5hdGl2ZVwiKTtcblxudmFyIF9pc1JlYWN0TmF0aXZlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lzUmVhY3ROYXRpdmUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgZmluZ2VycHJpbnQgZm9yIGEgZmlsZSB3aGljaCB3aWxsIGJlIHVzZWQgdGhlIHN0b3JlIHRoZSBlbmRwb2ludFxuICpcbiAqIEBwYXJhbSB7RmlsZX0gZmlsZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBmaW5nZXJwcmludChmaWxlLCBvcHRpb25zKSB7XG4gIGlmIChfaXNSZWFjdE5hdGl2ZTIuZGVmYXVsdCkge1xuICAgIHJldHVybiByZWFjdE5hdGl2ZUZpbmdlcnByaW50KGZpbGUsIG9wdGlvbnMpO1xuICB9XG5cbiAgcmV0dXJuIFtcInR1c1wiLCBmaWxlLm5hbWUsIGZpbGUudHlwZSwgZmlsZS5zaXplLCBmaWxlLmxhc3RNb2RpZmllZCwgb3B0aW9ucy5lbmRwb2ludF0uam9pbihcIi1cIik7XG59XG5cbmZ1bmN0aW9uIHJlYWN0TmF0aXZlRmluZ2VycHJpbnQoZmlsZSwgb3B0aW9ucykge1xuICB2YXIgZXhpZkhhc2ggPSBmaWxlLmV4aWYgPyBoYXNoQ29kZShKU09OLnN0cmluZ2lmeShmaWxlLmV4aWYpKSA6IFwibm9leGlmXCI7XG4gIHJldHVybiBbXCJ0dXNcIiwgZmlsZS5uYW1lIHx8IFwibm9uYW1lXCIsIGZpbGUuc2l6ZSB8fCBcIm5vc2l6ZVwiLCBleGlmSGFzaCwgb3B0aW9ucy5lbmRwb2ludF0uam9pbihcIi9cIik7XG59XG5cbmZ1bmN0aW9uIGhhc2hDb2RlKHN0cikge1xuICAvLyBmcm9tIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84ODMxOTM3LzE1MTY2NlxuICB2YXIgaGFzaCA9IDA7XG4gIGlmIChzdHIubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGhhc2g7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY2hhciA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggPSAoaGFzaCA8PCA1KSAtIGhhc2ggKyBjaGFyO1xuICAgIGhhc2ggPSBoYXNoICYgaGFzaDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gIH1cbiAgcmV0dXJuIGhhc2g7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfdXBsb2FkID0gcmVxdWlyZShcIi4vdXBsb2FkXCIpO1xuXG52YXIgX3VwbG9hZDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGxvYWQpO1xuXG52YXIgX3N0b3JhZ2UgPSByZXF1aXJlKFwiLi9ub2RlL3N0b3JhZ2VcIik7XG5cbnZhciBzdG9yYWdlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3N0b3JhZ2UpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiBnbG9iYWwgd2luZG93ICovXG52YXIgZGVmYXVsdE9wdGlvbnMgPSBfdXBsb2FkMi5kZWZhdWx0LmRlZmF1bHRPcHRpb25zO1xuXG5cbnZhciBtb2R1bGVFeHBvcnQgPSB7XG4gIFVwbG9hZDogX3VwbG9hZDIuZGVmYXVsdCxcbiAgY2FuU3RvcmVVUkxzOiBzdG9yYWdlLmNhblN0b3JlVVJMcyxcbiAgZGVmYXVsdE9wdGlvbnM6IGRlZmF1bHRPcHRpb25zXG59O1xuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAvLyBCcm93c2VyIGVudmlyb25tZW50IHVzaW5nIFhNTEh0dHBSZXF1ZXN0XG4gIHZhciBfd2luZG93ID0gd2luZG93LFxuICAgICAgWE1MSHR0cFJlcXVlc3QgPSBfd2luZG93LlhNTEh0dHBSZXF1ZXN0LFxuICAgICAgQmxvYiA9IF93aW5kb3cuQmxvYjtcblxuXG4gIG1vZHVsZUV4cG9ydC5pc1N1cHBvcnRlZCA9IFhNTEh0dHBSZXF1ZXN0ICYmIEJsb2IgJiYgdHlwZW9mIEJsb2IucHJvdG90eXBlLnNsaWNlID09PSBcImZ1bmN0aW9uXCI7XG59IGVsc2Uge1xuICAvLyBOb2RlLmpzIGVudmlyb25tZW50IHVzaW5nIGh0dHAgbW9kdWxlXG4gIG1vZHVsZUV4cG9ydC5pc1N1cHBvcnRlZCA9IHRydWU7XG4gIC8vIG1ha2UgRmlsZVN0b3JhZ2UgbW9kdWxlIGF2YWlsYWJsZSBhcyBpdCB3aWxsIG5vdCBiZSBzZXQgYnkgZGVmYXVsdC5cbiAgbW9kdWxlRXhwb3J0LkZpbGVTdG9yYWdlID0gc3RvcmFnZS5GaWxlU3RvcmFnZTtcbn1cblxuLy8gVGhlIHVzYWdlIG9mIHRoZSBjb21tb25qcyBleHBvcnRpbmcgc3ludGF4IGluc3RlYWQgb2YgdGhlIG5ldyBFQ01BU2NyaXB0XG4vLyBvbmUgaXMgYWN0dWFsbHkgaW50ZWRlZCBhbmQgcHJldmVudHMgd2VpcmQgYmVoYXZpb3VyIGlmIHdlIGFyZSB0cnlpbmcgdG9cbi8vIGltcG9ydCB0aGlzIG1vZHVsZSBpbiBhbm90aGVyIG1vZHVsZSB1c2luZyBCYWJlbC5cbm1vZHVsZS5leHBvcnRzID0gbW9kdWxlRXhwb3J0OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpOyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuLy8gV2UgaW1wb3J0IHRoZSBmaWxlcyB1c2VkIGluc2lkZSB0aGUgTm9kZSBlbnZpcm9ubWVudCB3aGljaCBhcmUgcmV3cml0dGVuXG4vLyBmb3IgYnJvd3NlcnMgdXNpbmcgdGhlIHJ1bGVzIGRlZmluZWQgaW4gdGhlIHBhY2thZ2UuanNvblxuXG5cbnZhciBfZmluZ2VycHJpbnQgPSByZXF1aXJlKFwiLi9maW5nZXJwcmludFwiKTtcblxudmFyIF9maW5nZXJwcmludDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9maW5nZXJwcmludCk7XG5cbnZhciBfZXJyb3IgPSByZXF1aXJlKFwiLi9lcnJvclwiKTtcblxudmFyIF9lcnJvcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9lcnJvcik7XG5cbnZhciBfZXh0ZW5kID0gcmVxdWlyZShcImV4dGVuZFwiKTtcblxudmFyIF9leHRlbmQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZXh0ZW5kKTtcblxudmFyIF9qc0Jhc2UgPSByZXF1aXJlKFwianMtYmFzZTY0XCIpO1xuXG52YXIgX3JlcXVlc3QgPSByZXF1aXJlKFwiLi9ub2RlL3JlcXVlc3RcIik7XG5cbnZhciBfc291cmNlID0gcmVxdWlyZShcIi4vbm9kZS9zb3VyY2VcIik7XG5cbnZhciBfc3RvcmFnZSA9IHJlcXVpcmUoXCIuL25vZGUvc3RvcmFnZVwiKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICBlbmRwb2ludDogbnVsbCxcbiAgZmluZ2VycHJpbnQ6IF9maW5nZXJwcmludDIuZGVmYXVsdCxcbiAgcmVzdW1lOiB0cnVlLFxuICBvblByb2dyZXNzOiBudWxsLFxuICBvbkNodW5rQ29tcGxldGU6IG51bGwsXG4gIG9uU3VjY2VzczogbnVsbCxcbiAgb25FcnJvcjogbnVsbCxcbiAgaGVhZGVyczoge30sXG4gIGNodW5rU2l6ZTogSW5maW5pdHksXG4gIHdpdGhDcmVkZW50aWFsczogZmFsc2UsXG4gIHVwbG9hZFVybDogbnVsbCxcbiAgdXBsb2FkU2l6ZTogbnVsbCxcbiAgb3ZlcnJpZGVQYXRjaE1ldGhvZDogZmFsc2UsXG4gIHJldHJ5RGVsYXlzOiBudWxsLFxuICByZW1vdmVGaW5nZXJwcmludE9uU3VjY2VzczogZmFsc2UsXG4gIHVwbG9hZExlbmd0aERlZmVycmVkOiBmYWxzZSxcbiAgdXJsU3RvcmFnZTogbnVsbFxufTtcblxudmFyIFVwbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gVXBsb2FkKGZpbGUsIG9wdGlvbnMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgVXBsb2FkKTtcblxuICAgIHRoaXMub3B0aW9ucyA9ICgwLCBfZXh0ZW5kMi5kZWZhdWx0KSh0cnVlLCB7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgLy8gVGhlIHN0b3JhZ2UgbW9kdWxlIHVzZWQgdG8gc3RvcmUgVVJMc1xuICAgIHRoaXMuX3N0b3JhZ2UgPSB0aGlzLm9wdGlvbnMudXJsU3RvcmFnZTtcblxuICAgIC8vIFRoZSB1bmRlcmx5aW5nIEZpbGUvQmxvYiBvYmplY3RcbiAgICB0aGlzLmZpbGUgPSBmaWxlO1xuXG4gICAgLy8gVGhlIFVSTCBhZ2FpbnN0IHdoaWNoIHRoZSBmaWxlIHdpbGwgYmUgdXBsb2FkZWRcbiAgICB0aGlzLnVybCA9IG51bGw7XG5cbiAgICAvLyBUaGUgdW5kZXJseWluZyBYSFIgb2JqZWN0IGZvciB0aGUgY3VycmVudCBQQVRDSCByZXF1ZXN0XG4gICAgdGhpcy5feGhyID0gbnVsbDtcblxuICAgIC8vIFRoZSBmaW5nZXJwaW5ydCBmb3IgdGhlIGN1cnJlbnQgZmlsZSAoc2V0IGFmdGVyIHN0YXJ0KCkpXG4gICAgdGhpcy5fZmluZ2VycHJpbnQgPSBudWxsO1xuXG4gICAgLy8gVGhlIG9mZnNldCB1c2VkIGluIHRoZSBjdXJyZW50IFBBVENIIHJlcXVlc3RcbiAgICB0aGlzLl9vZmZzZXQgPSBudWxsO1xuXG4gICAgLy8gVHJ1ZSBpZiB0aGUgY3VycmVudCBQQVRDSCByZXF1ZXN0IGhhcyBiZWVuIGFib3J0ZWRcbiAgICB0aGlzLl9hYm9ydGVkID0gZmFsc2U7XG5cbiAgICAvLyBUaGUgZmlsZSdzIHNpemUgaW4gYnl0ZXNcbiAgICB0aGlzLl9zaXplID0gbnVsbDtcblxuICAgIC8vIFRoZSBTb3VyY2Ugb2JqZWN0IHdoaWNoIHdpbGwgd3JhcCBhcm91bmQgdGhlIGdpdmVuIGZpbGUgYW5kIHByb3ZpZGVzIHVzXG4gICAgLy8gd2l0aCBhIHVuaWZpZWQgaW50ZXJmYWNlIGZvciBnZXR0aW5nIGl0cyBzaXplIGFuZCBzbGljZSBjaHVua3MgZnJvbSBpdHNcbiAgICAvLyBjb250ZW50IGFsbG93aW5nIHVzIHRvIGVhc2lseSBoYW5kbGUgRmlsZXMsIEJsb2JzLCBCdWZmZXJzIGFuZCBTdHJlYW1zLlxuICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG5cbiAgICAvLyBUaGUgY3VycmVudCBjb3VudCBvZiBhdHRlbXB0cyB3aGljaCBoYXZlIGJlZW4gbWFkZS4gTnVsbCBpbmRpY2F0ZXMgbm9uZS5cbiAgICB0aGlzLl9yZXRyeUF0dGVtcHQgPSAwO1xuXG4gICAgLy8gVGhlIHRpbWVvdXQncyBJRCB3aGljaCBpcyB1c2VkIHRvIGRlbGF5IHRoZSBuZXh0IHJldHJ5XG4gICAgdGhpcy5fcmV0cnlUaW1lb3V0ID0gbnVsbDtcblxuICAgIC8vIFRoZSBvZmZzZXQgb2YgdGhlIHJlbW90ZSB1cGxvYWQgYmVmb3JlIHRoZSBsYXRlc3QgYXR0ZW1wdCB3YXMgc3RhcnRlZC5cbiAgICB0aGlzLl9vZmZzZXRCZWZvcmVSZXRyeSA9IDA7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoVXBsb2FkLCBbe1xuICAgIGtleTogXCJzdGFydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgIHZhciBmaWxlID0gdGhpcy5maWxlO1xuXG4gICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcihcInR1czogbm8gZmlsZSBvciBzdHJlYW0gdG8gdXBsb2FkIHByb3ZpZGVkXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmRwb2ludCAmJiAhdGhpcy5vcHRpb25zLnVwbG9hZFVybCkge1xuICAgICAgICB0aGlzLl9lbWl0RXJyb3IobmV3IEVycm9yKFwidHVzOiBuZWl0aGVyIGFuIGVuZHBvaW50IG9yIGFuIHVwbG9hZCBVUkwgaXMgcHJvdmlkZWRcIikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzdW1lICYmIHRoaXMuX3N0b3JhZ2UgPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9zdG9yYWdlID0gKDAsIF9zdG9yYWdlLmdldFN0b3JhZ2UpKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9zb3VyY2UpIHtcbiAgICAgICAgdGhpcy5fc3RhcnQodGhpcy5fc291cmNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICgwLCBfc291cmNlLmdldFNvdXJjZSkoZmlsZSwgdGhpcy5vcHRpb25zLmNodW5rU2l6ZSwgZnVuY3Rpb24gKGVyciwgc291cmNlKSB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgX3RoaXMuX2VtaXRFcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF90aGlzLl9zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgICAgX3RoaXMuX3N0YXJ0KHNvdXJjZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJfc3RhcnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX3N0YXJ0KHNvdXJjZSkge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciBmaWxlID0gdGhpcy5maWxlO1xuXG4gICAgICAvLyBGaXJzdCwgd2UgbG9vayBhdCB0aGUgdXBsb2FkTGVuZ3RoRGVmZXJyZWQgb3B0aW9uLlxuICAgICAgLy8gTmV4dCwgd2UgY2hlY2sgaWYgdGhlIGNhbGxlciBoYXMgc3VwcGxpZWQgYSBtYW51YWwgdXBsb2FkIHNpemUuXG4gICAgICAvLyBGaW5hbGx5LCB3ZSB0cnkgdG8gdXNlIHRoZSBjYWxjdWxhdGVkIHNpemUgZnJvbSB0aGUgc291cmNlIG9iamVjdC5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXBsb2FkTGVuZ3RoRGVmZXJyZWQpIHtcbiAgICAgICAgdGhpcy5fc2l6ZSA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy51cGxvYWRTaXplICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fc2l6ZSA9ICt0aGlzLm9wdGlvbnMudXBsb2FkU2l6ZTtcbiAgICAgICAgaWYgKGlzTmFOKHRoaXMuX3NpemUpKSB7XG4gICAgICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcihcInR1czogY2Fubm90IGNvbnZlcnQgYHVwbG9hZFNpemVgIG9wdGlvbiBpbnRvIGEgbnVtYmVyXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NpemUgPSBzb3VyY2Uuc2l6ZTtcbiAgICAgICAgaWYgKHRoaXMuX3NpemUgPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuX2VtaXRFcnJvcihuZXcgRXJyb3IoXCJ0dXM6IGNhbm5vdCBhdXRvbWF0aWNhbGx5IGRlcml2ZSB1cGxvYWQncyBzaXplIGZyb20gaW5wdXQgYW5kIG11c3QgYmUgc3BlY2lmaWVkIG1hbnVhbGx5IHVzaW5nIHRoZSBgdXBsb2FkU2l6ZWAgb3B0aW9uXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHJldHJ5RGVsYXlzID0gdGhpcy5vcHRpb25zLnJldHJ5RGVsYXlzO1xuICAgICAgaWYgKHJldHJ5RGVsYXlzICE9IG51bGwpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZXRyeURlbGF5cykgIT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgICAgIHRoaXMuX2VtaXRFcnJvcihuZXcgRXJyb3IoXCJ0dXM6IHRoZSBgcmV0cnlEZWxheXNgIG9wdGlvbiBtdXN0IGVpdGhlciBiZSBhbiBhcnJheSBvciBudWxsXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGVycm9yQ2FsbGJhY2sgPSB0aGlzLm9wdGlvbnMub25FcnJvcjtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMub25FcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIGVycm9yIGNhbGxiYWNrIHdoaWNoIG1heSBoYXZlIGJlZW4gc2V0LlxuICAgICAgICAgICAgX3RoaXMyLm9wdGlvbnMub25FcnJvciA9IGVycm9yQ2FsbGJhY2s7XG5cbiAgICAgICAgICAgIC8vIFdlIHdpbGwgcmVzZXQgdGhlIGF0dGVtcHQgY291bnRlciBpZlxuICAgICAgICAgICAgLy8gLSB3ZSB3ZXJlIGFscmVhZHkgYWJsZSB0byBjb25uZWN0IHRvIHRoZSBzZXJ2ZXIgKG9mZnNldCAhPSBudWxsKSBhbmRcbiAgICAgICAgICAgIC8vIC0gd2Ugd2VyZSBhYmxlIHRvIHVwbG9hZCBhIHNtYWxsIGNodW5rIG9mIGRhdGEgdG8gdGhlIHNlcnZlclxuICAgICAgICAgICAgdmFyIHNob3VsZFJlc2V0RGVsYXlzID0gX3RoaXMyLl9vZmZzZXQgIT0gbnVsbCAmJiBfdGhpczIuX29mZnNldCA+IF90aGlzMi5fb2Zmc2V0QmVmb3JlUmV0cnk7XG4gICAgICAgICAgICBpZiAoc2hvdWxkUmVzZXREZWxheXMpIHtcbiAgICAgICAgICAgICAgX3RoaXMyLl9yZXRyeUF0dGVtcHQgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgXCJuYXZpZ2F0b3JcIiBpbiB3aW5kb3cgJiYgd2luZG93Lm5hdmlnYXRvci5vbkxpbmUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIGlzT25saW5lID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdlIG9ubHkgYXR0ZW1wdCBhIHJldHJ5IGlmXG4gICAgICAgICAgICAvLyAtIHdlIGRpZG4ndCBleGNlZWQgdGhlIG1heGl1bSBudW1iZXIgb2YgcmV0cmllcywgeWV0LCBhbmRcbiAgICAgICAgICAgIC8vIC0gdGhpcyBlcnJvciB3YXMgY2F1c2VkIGJ5IGEgcmVxdWVzdCBvciBpdCdzIHJlc3BvbnNlIGFuZFxuICAgICAgICAgICAgLy8gLSB0aGUgZXJyb3IgaXMgc2VydmVyIGVycm9yIChpLmUuIG5vIGEgc3RhdHVzIDR4eCBvciBhIDQwOSBvciA0MjMpIGFuZFxuICAgICAgICAgICAgLy8gLSB0aGUgYnJvd3NlciBkb2VzIG5vdCBpbmRpY2F0ZSB0aGF0IHdlIGFyZSBvZmZsaW5lXG4gICAgICAgICAgICB2YXIgc3RhdHVzID0gZXJyLm9yaWdpbmFsUmVxdWVzdCA/IGVyci5vcmlnaW5hbFJlcXVlc3Quc3RhdHVzIDogMDtcbiAgICAgICAgICAgIHZhciBpc1NlcnZlckVycm9yID0gIWluU3RhdHVzQ2F0ZWdvcnkoc3RhdHVzLCA0MDApIHx8IHN0YXR1cyA9PT0gNDA5IHx8IHN0YXR1cyA9PT0gNDIzO1xuICAgICAgICAgICAgdmFyIHNob3VsZFJldHJ5ID0gX3RoaXMyLl9yZXRyeUF0dGVtcHQgPCByZXRyeURlbGF5cy5sZW5ndGggJiYgZXJyLm9yaWdpbmFsUmVxdWVzdCAhPSBudWxsICYmIGlzU2VydmVyRXJyb3IgJiYgaXNPbmxpbmU7XG5cbiAgICAgICAgICAgIGlmICghc2hvdWxkUmV0cnkpIHtcbiAgICAgICAgICAgICAgX3RoaXMyLl9lbWl0RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVsYXkgPSByZXRyeURlbGF5c1tfdGhpczIuX3JldHJ5QXR0ZW1wdCsrXTtcblxuICAgICAgICAgICAgX3RoaXMyLl9vZmZzZXRCZWZvcmVSZXRyeSA9IF90aGlzMi5fb2Zmc2V0O1xuICAgICAgICAgICAgX3RoaXMyLm9wdGlvbnMudXBsb2FkVXJsID0gX3RoaXMyLnVybDtcblxuICAgICAgICAgICAgX3RoaXMyLl9yZXRyeVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgX3RoaXMyLnN0YXJ0KCk7XG4gICAgICAgICAgICB9LCBkZWxheSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZXNldCB0aGUgYWJvcnRlZCBmbGFnIHdoZW4gdGhlIHVwbG9hZCBpcyBzdGFydGVkIG9yIGVsc2UgdGhlXG4gICAgICAvLyBfc3RhcnRVcGxvYWQgd2lsbCBzdG9wIGJlZm9yZSBzZW5kaW5nIGEgcmVxdWVzdCBpZiB0aGUgdXBsb2FkIGhhcyBiZWVuXG4gICAgICAvLyBhYm9ydGVkIHByZXZpb3VzbHkuXG4gICAgICB0aGlzLl9hYm9ydGVkID0gZmFsc2U7XG5cbiAgICAgIC8vIFRoZSB1cGxvYWQgaGFkIGJlZW4gc3RhcnRlZCBwcmV2aW91c2x5IGFuZCB3ZSBzaG91bGQgcmV1c2UgdGhpcyBVUkwuXG4gICAgICBpZiAodGhpcy51cmwgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9yZXN1bWVVcGxvYWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBBIFVSTCBoYXMgbWFudWFsbHkgYmVlbiBzcGVjaWZpZWQsIHNvIHdlIHRyeSB0byByZXN1bWVcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXBsb2FkVXJsICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy51cmwgPSB0aGlzLm9wdGlvbnMudXBsb2FkVXJsO1xuICAgICAgICB0aGlzLl9yZXN1bWVVcGxvYWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBUcnkgdG8gZmluZCB0aGUgZW5kcG9pbnQgZm9yIHRoZSBmaWxlIGluIHRoZSBzdG9yYWdlXG4gICAgICBpZiAodGhpcy5faGFzU3RvcmFnZSgpKSB7XG4gICAgICAgIHRoaXMuX2ZpbmdlcnByaW50ID0gdGhpcy5vcHRpb25zLmZpbmdlcnByaW50KGZpbGUsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLl9maW5nZXJwcmludCwgZnVuY3Rpb24gKGVyciwgcmVzdW1lZFVybCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIF90aGlzMi5fZW1pdEVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlc3VtZWRVcmwgIT0gbnVsbCkge1xuICAgICAgICAgICAgX3RoaXMyLnVybCA9IHJlc3VtZWRVcmw7XG4gICAgICAgICAgICBfdGhpczIuX3Jlc3VtZVVwbG9hZCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfdGhpczIuX2NyZWF0ZVVwbG9hZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBbiB1cGxvYWQgaGFzIG5vdCBzdGFydGVkIGZvciB0aGUgZmlsZSB5ZXQsIHNvIHdlIHN0YXJ0IGEgbmV3IG9uZVxuICAgICAgICB0aGlzLl9jcmVhdGVVcGxvYWQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYWJvcnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWJvcnQoKSB7XG4gICAgICBpZiAodGhpcy5feGhyICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX3hoci5hYm9ydCgpO1xuICAgICAgICB0aGlzLl9zb3VyY2UuY2xvc2UoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2Fib3J0ZWQgPSB0cnVlO1xuXG4gICAgICBpZiAodGhpcy5fcmV0cnlUaW1lb3V0ICE9IG51bGwpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3JldHJ5VGltZW91dCk7XG4gICAgICAgIHRoaXMuX3JldHJ5VGltZW91dCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIl9oYXNTdG9yYWdlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9oYXNTdG9yYWdlKCkge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXN1bWUgJiYgdGhpcy5fc3RvcmFnZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiX2VtaXRYaHJFcnJvclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBfZW1pdFhockVycm9yKHhociwgZXJyLCBjYXVzaW5nRXJyKSB7XG4gICAgICB0aGlzLl9lbWl0RXJyb3IobmV3IF9lcnJvcjIuZGVmYXVsdChlcnIsIGNhdXNpbmdFcnIsIHhocikpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJfZW1pdEVycm9yXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9lbWl0RXJyb3IoZXJyKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vbkVycm9yID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uRXJyb3IoZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiX2VtaXRTdWNjZXNzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9lbWl0U3VjY2VzcygpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLm9uU3VjY2VzcyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5vblN1Y2Nlc3MoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoZXMgbm90aWZpY2F0aW9uIHdoZW4gZGF0YSBoYXMgYmVlbiBzZW50IHRvIHRoZSBzZXJ2ZXIuIFRoaXNcbiAgICAgKiBkYXRhIG1heSBub3QgaGF2ZSBiZWVuIGFjY2VwdGVkIGJ5IHRoZSBzZXJ2ZXIgeWV0LlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gYnl0ZXNTZW50ICBOdW1iZXIgb2YgYnl0ZXMgc2VudCB0byB0aGUgc2VydmVyLlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gYnl0ZXNUb3RhbCBUb3RhbCBudW1iZXIgb2YgYnl0ZXMgdG8gYmUgc2VudCB0byB0aGUgc2VydmVyLlxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiX2VtaXRQcm9ncmVzc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBfZW1pdFByb2dyZXNzKGJ5dGVzU2VudCwgYnl0ZXNUb3RhbCkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub25Qcm9ncmVzcyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5vblByb2dyZXNzKGJ5dGVzU2VudCwgYnl0ZXNUb3RhbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaGVzIG5vdGlmaWNhdGlvbiB3aGVuIGEgY2h1bmsgb2YgZGF0YSBoYXMgYmVlbiBzZW50IHRvIHRoZSBzZXJ2ZXJcbiAgICAgKiBhbmQgYWNjZXB0ZWQgYnkgdGhlIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IGNodW5rU2l6ZSAgU2l6ZSBvZiB0aGUgY2h1bmsgdGhhdCB3YXMgYWNjZXB0ZWQgYnkgdGhlXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IGJ5dGVzQWNjZXB0ZWQgVG90YWwgbnVtYmVyIG9mIGJ5dGVzIHRoYXQgaGF2ZSBiZWVuXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdGVkIGJ5IHRoZSBzZXJ2ZXIuXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBieXRlc1RvdGFsIFRvdGFsIG51bWJlciBvZiBieXRlcyB0byBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJfZW1pdENodW5rQ29tcGxldGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX2VtaXRDaHVua0NvbXBsZXRlKGNodW5rU2l6ZSwgYnl0ZXNBY2NlcHRlZCwgYnl0ZXNUb3RhbCkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub25DaHVua0NvbXBsZXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uQ2h1bmtDb21wbGV0ZShjaHVua1NpemUsIGJ5dGVzQWNjZXB0ZWQsIGJ5dGVzVG90YWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgaGVhZGVycyB1c2VkIGluIHRoZSByZXF1ZXN0IGFuZCB0aGUgd2l0aENyZWRlbnRpYWxzIHByb3BlcnR5XG4gICAgICogYXMgZGVmaW5lZCBpbiB0aGUgb3B0aW9uc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtYTUxIdHRwUmVxdWVzdH0geGhyXG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJfc2V0dXBYSFJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX3NldHVwWEhSKHhocikge1xuICAgICAgdGhpcy5feGhyID0geGhyO1xuXG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlR1cy1SZXN1bWFibGVcIiwgXCIxLjAuMFwiKTtcbiAgICAgIHZhciBoZWFkZXJzID0gdGhpcy5vcHRpb25zLmhlYWRlcnM7XG5cbiAgICAgIGZvciAodmFyIG5hbWUgaW4gaGVhZGVycykge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCBoZWFkZXJzW25hbWVdKTtcbiAgICAgIH1cblxuICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRoaXMub3B0aW9ucy53aXRoQ3JlZGVudGlhbHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IHVwbG9hZCB1c2luZyB0aGUgY3JlYXRpb24gZXh0ZW5zaW9uIGJ5IHNlbmRpbmcgYSBQT1NUXG4gICAgICogcmVxdWVzdCB0byB0aGUgZW5kcG9pbnQuIEFmdGVyIHN1Y2Nlc3NmdWwgY3JlYXRpb24gdGhlIGZpbGUgd2lsbCBiZVxuICAgICAqIHVwbG9hZGVkXG4gICAgICpcbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcIl9jcmVhdGVVcGxvYWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX2NyZWF0ZVVwbG9hZCgpIHtcbiAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmRwb2ludCkge1xuICAgICAgICB0aGlzLl9lbWl0RXJyb3IobmV3IEVycm9yKFwidHVzOiB1bmFibGUgdG8gY3JlYXRlIHVwbG9hZCBiZWNhdXNlIG5vIGVuZHBvaW50IGlzIHByb3ZpZGVkXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgeGhyID0gKDAsIF9yZXF1ZXN0Lm5ld1JlcXVlc3QpKCk7XG4gICAgICB4aHIub3BlbihcIlBPU1RcIiwgdGhpcy5vcHRpb25zLmVuZHBvaW50LCB0cnVlKTtcblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFpblN0YXR1c0NhdGVnb3J5KHhoci5zdGF0dXMsIDIwMCkpIHtcbiAgICAgICAgICBfdGhpczMuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogdW5leHBlY3RlZCByZXNwb25zZSB3aGlsZSBjcmVhdGluZyB1cGxvYWRcIikpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHhoci5nZXRSZXNwb25zZUhlYWRlcihcIkxvY2F0aW9uXCIpO1xuICAgICAgICBpZiAobG9jYXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgIF90aGlzMy5fZW1pdFhockVycm9yKHhociwgbmV3IEVycm9yKFwidHVzOiBpbnZhbGlkIG9yIG1pc3NpbmcgTG9jYXRpb24gaGVhZGVyXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfdGhpczMudXJsID0gKDAsIF9yZXF1ZXN0LnJlc29sdmVVcmwpKF90aGlzMy5vcHRpb25zLmVuZHBvaW50LCBsb2NhdGlvbik7XG5cbiAgICAgICAgaWYgKF90aGlzMy5fc2l6ZSA9PT0gMCkge1xuICAgICAgICAgIC8vIE5vdGhpbmcgdG8gdXBsb2FkIGFuZCBmaWxlIHdhcyBzdWNjZXNzZnVsbHkgY3JlYXRlZFxuICAgICAgICAgIF90aGlzMy5fZW1pdFN1Y2Nlc3MoKTtcbiAgICAgICAgICBfdGhpczMuX3NvdXJjZS5jbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfdGhpczMuX2hhc1N0b3JhZ2UoKSkge1xuICAgICAgICAgIF90aGlzMy5fc3RvcmFnZS5zZXRJdGVtKF90aGlzMy5fZmluZ2VycHJpbnQsIF90aGlzMy51cmwsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgX3RoaXMzLl9lbWl0RXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzMy5fb2Zmc2V0ID0gMDtcbiAgICAgICAgX3RoaXMzLl9zdGFydFVwbG9hZCgpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIF90aGlzMy5fZW1pdFhockVycm9yKHhociwgbmV3IEVycm9yKFwidHVzOiBmYWlsZWQgdG8gY3JlYXRlIHVwbG9hZFwiKSwgZXJyKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuX3NldHVwWEhSKHhocik7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnVwbG9hZExlbmd0aERlZmVycmVkKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiVXBsb2FkLURlZmVyLUxlbmd0aFwiLCAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiVXBsb2FkLUxlbmd0aFwiLCB0aGlzLl9zaXplKTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIG1ldGFkYXRhIGlmIHZhbHVlcyBoYXZlIGJlZW4gYWRkZWRcbiAgICAgIHZhciBtZXRhZGF0YSA9IGVuY29kZU1ldGFkYXRhKHRoaXMub3B0aW9ucy5tZXRhZGF0YSk7XG4gICAgICBpZiAobWV0YWRhdGEgIT09IFwiXCIpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJVcGxvYWQtTWV0YWRhdGFcIiwgbWV0YWRhdGEpO1xuICAgICAgfVxuXG4gICAgICB4aHIuc2VuZChudWxsKTtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIFRyeSB0byByZXN1bWUgYW4gZXhpc3RpbmcgdXBsb2FkLiBGaXJzdCBhIEhFQUQgcmVxdWVzdCB3aWxsIGJlIHNlbnRcbiAgICAgKiB0byByZXRyaWV2ZSB0aGUgb2Zmc2V0LiBJZiB0aGUgcmVxdWVzdCBmYWlscyBhIG5ldyB1cGxvYWQgd2lsbCBiZVxuICAgICAqIGNyZWF0ZWQuIEluIHRoZSBjYXNlIG9mIGEgc3VjY2Vzc2Z1bCByZXNwb25zZSB0aGUgZmlsZSB3aWxsIGJlIHVwbG9hZGVkLlxuICAgICAqXG4gICAgICogQGFwaSBwcml2YXRlXG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJfcmVzdW1lVXBsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9yZXN1bWVVcGxvYWQoKSB7XG4gICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgdmFyIHhociA9ICgwLCBfcmVxdWVzdC5uZXdSZXF1ZXN0KSgpO1xuICAgICAgeGhyLm9wZW4oXCJIRUFEXCIsIHRoaXMudXJsLCB0cnVlKTtcblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFpblN0YXR1c0NhdGVnb3J5KHhoci5zdGF0dXMsIDIwMCkpIHtcbiAgICAgICAgICBpZiAoX3RoaXM0Lm9wdGlvbnMucmVzdW1lICYmIF90aGlzNC5fc3RvcmFnZSAmJiBpblN0YXR1c0NhdGVnb3J5KHhoci5zdGF0dXMsIDQwMCkpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBzdG9yZWQgZmluZ2VycHJpbnQgYW5kIGNvcnJlc3BvbmRpbmcgZW5kcG9pbnQsXG4gICAgICAgICAgICAvLyBvbiBjbGllbnQgZXJyb3JzIHNpbmNlIHRoZSBmaWxlIGNhbiBub3QgYmUgZm91bmRcbiAgICAgICAgICAgIF90aGlzNC5fc3RvcmFnZS5yZW1vdmVJdGVtKF90aGlzNC5fZmluZ2VycHJpbnQsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIF90aGlzNC5fZW1pdEVycm9yKGVycik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIElmIHRoZSB1cGxvYWQgaXMgbG9ja2VkIChpbmRpY2F0ZWQgYnkgdGhlIDQyMyBMb2NrZWQgc3RhdHVzIGNvZGUpLCB3ZVxuICAgICAgICAgIC8vIGVtaXQgYW4gZXJyb3IgaW5zdGVhZCBvZiBkaXJlY3RseSBzdGFydGluZyBhIG5ldyB1cGxvYWQuIFRoaXMgd2F5IHRoZVxuICAgICAgICAgIC8vIHJldHJ5IGxvZ2ljIGNhbiBjYXRjaCB0aGUgZXJyb3IgYW5kIHdpbGwgcmV0cnkgdGhlIHVwbG9hZC4gQW4gdXBsb2FkXG4gICAgICAgICAgLy8gaXMgdXN1YWxseSBsb2NrZWQgZm9yIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUgYW5kIHdpbGwgYmUgYXZhaWxhYmxlXG4gICAgICAgICAgLy8gYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gNDIzKSB7XG4gICAgICAgICAgICBfdGhpczQuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogdXBsb2FkIGlzIGN1cnJlbnRseSBsb2NrZWQ7IHJldHJ5IGxhdGVyXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIV90aGlzNC5vcHRpb25zLmVuZHBvaW50KSB7XG4gICAgICAgICAgICAvLyBEb24ndCBhdHRlbXB0IHRvIGNyZWF0ZSBhIG5ldyB1cGxvYWQgaWYgbm8gZW5kcG9pbnQgaXMgcHJvdmlkZWQuXG4gICAgICAgICAgICBfdGhpczQuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogdW5hYmxlIHRvIHJlc3VtZSB1cGxvYWQgKG5ldyB1cGxvYWQgY2Fubm90IGJlIGNyZWF0ZWQgd2l0aG91dCBhbiBlbmRwb2ludClcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFRyeSB0byBjcmVhdGUgYSBuZXcgdXBsb2FkXG4gICAgICAgICAgX3RoaXM0LnVybCA9IG51bGw7XG4gICAgICAgICAgX3RoaXM0Ll9jcmVhdGVVcGxvYWQoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb2Zmc2V0ID0gcGFyc2VJbnQoeGhyLmdldFJlc3BvbnNlSGVhZGVyKFwiVXBsb2FkLU9mZnNldFwiKSwgMTApO1xuICAgICAgICBpZiAoaXNOYU4ob2Zmc2V0KSkge1xuICAgICAgICAgIF90aGlzNC5fZW1pdFhockVycm9yKHhociwgbmV3IEVycm9yKFwidHVzOiBpbnZhbGlkIG9yIG1pc3Npbmcgb2Zmc2V0IHZhbHVlXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVuZ3RoID0gcGFyc2VJbnQoeGhyLmdldFJlc3BvbnNlSGVhZGVyKFwiVXBsb2FkLUxlbmd0aFwiKSwgMTApO1xuICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSAmJiAhX3RoaXM0Lm9wdGlvbnMudXBsb2FkTGVuZ3RoRGVmZXJyZWQpIHtcbiAgICAgICAgICBfdGhpczQuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogaW52YWxpZCBvciBtaXNzaW5nIGxlbmd0aCB2YWx1ZVwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBsb2FkIGhhcyBhbHJlYWR5IGJlZW4gY29tcGxldGVkIGFuZCB3ZSBkbyBub3QgbmVlZCB0byBzZW5kIGFkZGl0aW9uYWxcbiAgICAgICAgLy8gZGF0YSB0byB0aGUgc2VydmVyXG4gICAgICAgIGlmIChvZmZzZXQgPT09IGxlbmd0aCkge1xuICAgICAgICAgIF90aGlzNC5fZW1pdFByb2dyZXNzKGxlbmd0aCwgbGVuZ3RoKTtcbiAgICAgICAgICBfdGhpczQuX2VtaXRTdWNjZXNzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM0Ll9vZmZzZXQgPSBvZmZzZXQ7XG4gICAgICAgIF90aGlzNC5fc3RhcnRVcGxvYWQoKTtcbiAgICAgIH07XG5cbiAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBfdGhpczQuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogZmFpbGVkIHRvIHJlc3VtZSB1cGxvYWRcIiksIGVycik7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLl9zZXR1cFhIUih4aHIpO1xuICAgICAgeGhyLnNlbmQobnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgdXBsb2FkaW5nIHRoZSBmaWxlIHVzaW5nIFBBVENIIHJlcXVlc3RzLiBUaGUgZmlsZSB3aWxsIGJlIGRpdmlkZWRcbiAgICAgKiBpbnRvIGNodW5rcyBhcyBzcGVjaWZpZWQgaW4gdGhlIGNodW5rU2l6ZSBvcHRpb24uIER1cmluZyB0aGUgdXBsb2FkXG4gICAgICogdGhlIG9uUHJvZ3Jlc3MgZXZlbnQgaGFuZGxlciBtYXkgYmUgaW52b2tlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICAgKlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiX3N0YXJ0VXBsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9zdGFydFVwbG9hZCgpIHtcbiAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgICAvLyBJZiB0aGUgdXBsb2FkIGhhcyBiZWVuIGFib3J0ZWQsIHdlIHdpbGwgbm90IHNlbmQgdGhlIG5leHQgUEFUQ0ggcmVxdWVzdC5cbiAgICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IGlmIHRoZSBhYm9ydCBtZXRob2Qgd2FzIGNhbGxlZCBkdXJpbmcgYSBjYWxsYmFjaywgc3VjaFxuICAgICAgLy8gYXMgb25DaHVua0NvbXBsZXRlIG9yIG9uUHJvZ3Jlc3MuXG4gICAgICBpZiAodGhpcy5fYWJvcnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSAoMCwgX3JlcXVlc3QubmV3UmVxdWVzdCkoKTtcblxuICAgICAgLy8gU29tZSBicm93c2VyIGFuZCBzZXJ2ZXJzIG1heSBub3Qgc3VwcG9ydCB0aGUgUEFUQ0ggbWV0aG9kLiBGb3IgdGhvc2VcbiAgICAgIC8vIGNhc2VzLCB5b3UgY2FuIHRlbGwgdHVzLWpzLWNsaWVudCB0byB1c2UgYSBQT1NUIHJlcXVlc3Qgd2l0aCB0aGVcbiAgICAgIC8vIFgtSFRUUC1NZXRob2QtT3ZlcnJpZGUgaGVhZGVyIGZvciBzaW11bGF0aW5nIGEgUEFUQ0ggcmVxdWVzdC5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcnJpZGVQYXRjaE1ldGhvZCkge1xuICAgICAgICB4aHIub3BlbihcIlBPU1RcIiwgdGhpcy51cmwsIHRydWUpO1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtSFRUUC1NZXRob2QtT3ZlcnJpZGVcIiwgXCJQQVRDSFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHhoci5vcGVuKFwiUEFUQ0hcIiwgdGhpcy51cmwsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWluU3RhdHVzQ2F0ZWdvcnkoeGhyLnN0YXR1cywgMjAwKSkge1xuICAgICAgICAgIF90aGlzNS5fZW1pdFhockVycm9yKHhociwgbmV3IEVycm9yKFwidHVzOiB1bmV4cGVjdGVkIHJlc3BvbnNlIHdoaWxlIHVwbG9hZGluZyBjaHVua1wiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9mZnNldCA9IHBhcnNlSW50KHhoci5nZXRSZXNwb25zZUhlYWRlcihcIlVwbG9hZC1PZmZzZXRcIiksIDEwKTtcbiAgICAgICAgaWYgKGlzTmFOKG9mZnNldCkpIHtcbiAgICAgICAgICBfdGhpczUuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogaW52YWxpZCBvciBtaXNzaW5nIG9mZnNldCB2YWx1ZVwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM1Ll9lbWl0UHJvZ3Jlc3Mob2Zmc2V0LCBfdGhpczUuX3NpemUpO1xuICAgICAgICBfdGhpczUuX2VtaXRDaHVua0NvbXBsZXRlKG9mZnNldCAtIF90aGlzNS5fb2Zmc2V0LCBvZmZzZXQsIF90aGlzNS5fc2l6ZSk7XG5cbiAgICAgICAgX3RoaXM1Ll9vZmZzZXQgPSBvZmZzZXQ7XG5cbiAgICAgICAgaWYgKG9mZnNldCA9PSBfdGhpczUuX3NpemUpIHtcbiAgICAgICAgICBpZiAoX3RoaXM1Lm9wdGlvbnMucmVtb3ZlRmluZ2VycHJpbnRPblN1Y2Nlc3MgJiYgX3RoaXM1Lm9wdGlvbnMucmVzdW1lKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgc3RvcmVkIGZpbmdlcnByaW50IGFuZCBjb3JyZXNwb25kaW5nIGVuZHBvaW50LiBUaGlzIGNhdXNlc1xuICAgICAgICAgICAgLy8gbmV3IHVwbG9hZCBvZiB0aGUgc2FtZSBmaWxlIG11c3QgYmUgdHJlYXRlZCBhcyBhIGRpZmZlcmVudCBmaWxlLlxuICAgICAgICAgICAgU3RvcmFnZS5yZW1vdmVJdGVtKF90aGlzNS5fZmluZ2VycHJpbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFlheSwgZmluYWxseSBkb25lIDopXG4gICAgICAgICAgX3RoaXM1Ll9lbWl0U3VjY2VzcygpO1xuICAgICAgICAgIF90aGlzNS5fc291cmNlLmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM1Ll9zdGFydFVwbG9hZCgpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIC8vIERvbid0IGVtaXQgYW4gZXJyb3IgaWYgdGhlIHVwbG9hZCB3YXMgYWJvcnRlZCBtYW51YWxseVxuICAgICAgICBpZiAoX3RoaXM1Ll9hYm9ydGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM1Ll9lbWl0WGhyRXJyb3IoeGhyLCBuZXcgRXJyb3IoXCJ0dXM6IGZhaWxlZCB0byB1cGxvYWQgY2h1bmsgYXQgb2Zmc2V0IFwiICsgX3RoaXM1Ll9vZmZzZXQpLCBlcnIpO1xuICAgICAgfTtcblxuICAgICAgLy8gVGVzdCBzdXBwb3J0IGZvciBwcm9ncmVzcyBldmVudHMgYmVmb3JlIGF0dGFjaGluZyBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgaWYgKFwidXBsb2FkXCIgaW4geGhyKSB7XG4gICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgaWYgKCFlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBfdGhpczUuX2VtaXRQcm9ncmVzcyhzdGFydCArIGUubG9hZGVkLCBfdGhpczUuX3NpemUpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zZXR1cFhIUih4aHIpO1xuXG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlVwbG9hZC1PZmZzZXRcIiwgdGhpcy5fb2Zmc2V0KTtcbiAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbVwiKTtcblxuICAgICAgdmFyIHN0YXJ0ID0gdGhpcy5fb2Zmc2V0O1xuICAgICAgdmFyIGVuZCA9IHRoaXMuX29mZnNldCArIHRoaXMub3B0aW9ucy5jaHVua1NpemU7XG5cbiAgICAgIC8vIFRoZSBzcGVjaWZpZWQgY2h1bmtTaXplIG1heSBiZSBJbmZpbml0eSBvciB0aGUgY2FsY2x1YXRlZCBlbmQgcG9zaXRpb25cbiAgICAgIC8vIG1heSBleGNlZWQgdGhlIGZpbGUncyBzaXplLiBJbiBib3RoIGNhc2VzLCB3ZSBsaW1pdCB0aGUgZW5kIHBvc2l0aW9uIHRvXG4gICAgICAvLyB0aGUgaW5wdXQncyB0b3RhbCBzaXplIGZvciBzaW1wbGVyIGNhbGN1bGF0aW9ucyBhbmQgY29ycmVjdG5lc3MuXG4gICAgICBpZiAoKGVuZCA9PT0gSW5maW5pdHkgfHwgZW5kID4gdGhpcy5fc2l6ZSkgJiYgIXRoaXMub3B0aW9ucy51cGxvYWRMZW5ndGhEZWZlcnJlZCkge1xuICAgICAgICBlbmQgPSB0aGlzLl9zaXplO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zb3VyY2Uuc2xpY2Uoc3RhcnQsIGVuZCwgZnVuY3Rpb24gKGVyciwgdmFsdWUsIGNvbXBsZXRlKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBfdGhpczUuX2VtaXRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfdGhpczUub3B0aW9ucy51cGxvYWRMZW5ndGhEZWZlcnJlZCkge1xuICAgICAgICAgIGlmIChjb21wbGV0ZSkge1xuICAgICAgICAgICAgX3RoaXM1Ll9zaXplID0gX3RoaXM1Ll9vZmZzZXQgKyAodmFsdWUgJiYgdmFsdWUuc2l6ZSA/IHZhbHVlLnNpemUgOiAwKTtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiVXBsb2FkLUxlbmd0aFwiLCBfdGhpczUuX3NpemUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgIHhoci5zZW5kKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgeGhyLnNlbmQodmFsdWUpO1xuICAgICAgICAgIF90aGlzNS5fZW1pdFByb2dyZXNzKF90aGlzNS5fb2Zmc2V0LCBfdGhpczUuX3NpemUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gVXBsb2FkO1xufSgpO1xuXG5mdW5jdGlvbiBlbmNvZGVNZXRhZGF0YShtZXRhZGF0YSkge1xuICB2YXIgZW5jb2RlZCA9IFtdO1xuXG4gIGZvciAodmFyIGtleSBpbiBtZXRhZGF0YSkge1xuICAgIGVuY29kZWQucHVzaChrZXkgKyBcIiBcIiArIF9qc0Jhc2UuQmFzZTY0LmVuY29kZShtZXRhZGF0YVtrZXldKSk7XG4gIH1cblxuICByZXR1cm4gZW5jb2RlZC5qb2luKFwiLFwiKTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHN0YXR1cyBpcyBpbiB0aGUgcmFuZ2Ugb2YgdGhlIGV4cGVjdGVkIGNhdGVnb3J5LlxuICogRm9yIGV4YW1wbGUsIG9ubHkgYSBzdGF0dXMgYmV0d2VlbiAyMDAgYW5kIDI5OSB3aWxsIHNhdGlzZnkgdGhlIGNhdGVnb3J5IDIwMC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gaW5TdGF0dXNDYXRlZ29yeShzdGF0dXMsIGNhdGVnb3J5KSB7XG4gIHJldHVybiBzdGF0dXMgPj0gY2F0ZWdvcnkgJiYgc3RhdHVzIDwgY2F0ZWdvcnkgKyAxMDA7XG59XG5cblVwbG9hZC5kZWZhdWx0T3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBVcGxvYWQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVxdWlyZWQgPSByZXF1aXJlKCdyZXF1aXJlcy1wb3J0JylcbiAgLCBxcyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5naWZ5JylcbiAgLCBzbGFzaGVzID0gL15bQS1aYS16XVtBLVphLXowLTkrLS5dKjpcXC9cXC8vXG4gICwgcHJvdG9jb2xyZSA9IC9eKFthLXpdW2EtejAtOS4rLV0qOik/KFxcL1xcLyk/KFtcXFNcXHNdKikvaVxuICAsIHdoaXRlc3BhY2UgPSAnW1xcXFx4MDlcXFxceDBBXFxcXHgwQlxcXFx4MENcXFxceDBEXFxcXHgyMFxcXFx4QTBcXFxcdTE2ODBcXFxcdTE4MEVcXFxcdTIwMDBcXFxcdTIwMDFcXFxcdTIwMDJcXFxcdTIwMDNcXFxcdTIwMDRcXFxcdTIwMDVcXFxcdTIwMDZcXFxcdTIwMDdcXFxcdTIwMDhcXFxcdTIwMDlcXFxcdTIwMEFcXFxcdTIwMkZcXFxcdTIwNUZcXFxcdTMwMDBcXFxcdTIwMjhcXFxcdTIwMjlcXFxcdUZFRkZdJ1xuICAsIGxlZnQgPSBuZXcgUmVnRXhwKCdeJysgd2hpdGVzcGFjZSArJysnKTtcblxuLyoqXG4gKiBUcmltIGEgZ2l2ZW4gc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgU3RyaW5nIHRvIHRyaW0uXG4gKiBAcHVibGljXG4gKi9cbmZ1bmN0aW9uIHRyaW1MZWZ0KHN0cikge1xuICByZXR1cm4gKHN0ciA/IHN0ciA6ICcnKS50b1N0cmluZygpLnJlcGxhY2UobGVmdCwgJycpO1xufVxuXG4vKipcbiAqIFRoZXNlIGFyZSB0aGUgcGFyc2UgcnVsZXMgZm9yIHRoZSBVUkwgcGFyc2VyLCBpdCBpbmZvcm1zIHRoZSBwYXJzZXJcbiAqIGFib3V0OlxuICpcbiAqIDAuIFRoZSBjaGFyIGl0IE5lZWRzIHRvIHBhcnNlLCBpZiBpdCdzIGEgc3RyaW5nIGl0IHNob3VsZCBiZSBkb25lIHVzaW5nXG4gKiAgICBpbmRleE9mLCBSZWdFeHAgdXNpbmcgZXhlYyBhbmQgTmFOIG1lYW5zIHNldCBhcyBjdXJyZW50IHZhbHVlLlxuICogMS4gVGhlIHByb3BlcnR5IHdlIHNob3VsZCBzZXQgd2hlbiBwYXJzaW5nIHRoaXMgdmFsdWUuXG4gKiAyLiBJbmRpY2F0aW9uIGlmIGl0J3MgYmFja3dhcmRzIG9yIGZvcndhcmQgcGFyc2luZywgd2hlbiBzZXQgYXMgbnVtYmVyIGl0J3NcbiAqICAgIHRoZSB2YWx1ZSBvZiBleHRyYSBjaGFycyB0aGF0IHNob3VsZCBiZSBzcGxpdCBvZmYuXG4gKiAzLiBJbmhlcml0IGZyb20gbG9jYXRpb24gaWYgbm9uIGV4aXN0aW5nIGluIHRoZSBwYXJzZXIuXG4gKiA0LiBgdG9Mb3dlckNhc2VgIHRoZSByZXN1bHRpbmcgdmFsdWUuXG4gKi9cbnZhciBydWxlcyA9IFtcbiAgWycjJywgJ2hhc2gnXSwgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGZyb20gdGhlIGJhY2suXG4gIFsnPycsICdxdWVyeSddLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBmcm9tIHRoZSBiYWNrLlxuICBmdW5jdGlvbiBzYW5pdGl6ZShhZGRyZXNzKSB7ICAgICAgICAgIC8vIFNhbml0aXplIHdoYXQgaXMgbGVmdCBvZiB0aGUgYWRkcmVzc1xuICAgIHJldHVybiBhZGRyZXNzLnJlcGxhY2UoJ1xcXFwnLCAnLycpO1xuICB9LFxuICBbJy8nLCAncGF0aG5hbWUnXSwgICAgICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QgZnJvbSB0aGUgYmFjay5cbiAgWydAJywgJ2F1dGgnLCAxXSwgICAgICAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGZyb20gdGhlIGZyb250LlxuICBbTmFOLCAnaG9zdCcsIHVuZGVmaW5lZCwgMSwgMV0sICAgICAgIC8vIFNldCBsZWZ0IG92ZXIgdmFsdWUuXG4gIFsvOihcXGQrKSQvLCAncG9ydCcsIHVuZGVmaW5lZCwgMV0sICAgIC8vIFJlZ0V4cCB0aGUgYmFjay5cbiAgW05hTiwgJ2hvc3RuYW1lJywgdW5kZWZpbmVkLCAxLCAxXSAgICAvLyBTZXQgbGVmdCBvdmVyLlxuXTtcblxuLyoqXG4gKiBUaGVzZSBwcm9wZXJ0aWVzIHNob3VsZCBub3QgYmUgY29waWVkIG9yIGluaGVyaXRlZCBmcm9tLiBUaGlzIGlzIG9ubHkgbmVlZGVkXG4gKiBmb3IgYWxsIG5vbiBibG9iIFVSTCdzIGFzIGEgYmxvYiBVUkwgZG9lcyBub3QgaW5jbHVkZSBhIGhhc2gsIG9ubHkgdGhlXG4gKiBvcmlnaW4uXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbnZhciBpZ25vcmUgPSB7IGhhc2g6IDEsIHF1ZXJ5OiAxIH07XG5cbi8qKlxuICogVGhlIGxvY2F0aW9uIG9iamVjdCBkaWZmZXJzIHdoZW4geW91ciBjb2RlIGlzIGxvYWRlZCB0aHJvdWdoIGEgbm9ybWFsIHBhZ2UsXG4gKiBXb3JrZXIgb3IgdGhyb3VnaCBhIHdvcmtlciB1c2luZyBhIGJsb2IuIEFuZCB3aXRoIHRoZSBibG9iYmxlIGJlZ2lucyB0aGVcbiAqIHRyb3VibGUgYXMgdGhlIGxvY2F0aW9uIG9iamVjdCB3aWxsIGNvbnRhaW4gdGhlIFVSTCBvZiB0aGUgYmxvYiwgbm90IHRoZVxuICogbG9jYXRpb24gb2YgdGhlIHBhZ2Ugd2hlcmUgb3VyIGNvZGUgaXMgbG9hZGVkIGluLiBUaGUgYWN0dWFsIG9yaWdpbiBpc1xuICogZW5jb2RlZCBpbiB0aGUgYHBhdGhuYW1lYCBzbyB3ZSBjYW4gdGhhbmtmdWxseSBnZW5lcmF0ZSBhIGdvb2QgXCJkZWZhdWx0XCJcbiAqIGxvY2F0aW9uIGZyb20gaXQgc28gd2UgY2FuIGdlbmVyYXRlIHByb3BlciByZWxhdGl2ZSBVUkwncyBhZ2Fpbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IGxvYyBPcHRpb25hbCBkZWZhdWx0IGxvY2F0aW9uIG9iamVjdC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IGxvbGNhdGlvbiBvYmplY3QuXG4gKiBAcHVibGljXG4gKi9cbmZ1bmN0aW9uIGxvbGNhdGlvbihsb2MpIHtcbiAgdmFyIGdsb2JhbFZhcjtcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIGdsb2JhbFZhciA9IHdpbmRvdztcbiAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIGdsb2JhbFZhciA9IGdsb2JhbDtcbiAgZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSBnbG9iYWxWYXIgPSBzZWxmO1xuICBlbHNlIGdsb2JhbFZhciA9IHt9O1xuXG4gIHZhciBsb2NhdGlvbiA9IGdsb2JhbFZhci5sb2NhdGlvbiB8fCB7fTtcbiAgbG9jID0gbG9jIHx8IGxvY2F0aW9uO1xuXG4gIHZhciBmaW5hbGRlc3RpbmF0aW9uID0ge31cbiAgICAsIHR5cGUgPSB0eXBlb2YgbG9jXG4gICAgLCBrZXk7XG5cbiAgaWYgKCdibG9iOicgPT09IGxvYy5wcm90b2NvbCkge1xuICAgIGZpbmFsZGVzdGluYXRpb24gPSBuZXcgVXJsKHVuZXNjYXBlKGxvYy5wYXRobmFtZSksIHt9KTtcbiAgfSBlbHNlIGlmICgnc3RyaW5nJyA9PT0gdHlwZSkge1xuICAgIGZpbmFsZGVzdGluYXRpb24gPSBuZXcgVXJsKGxvYywge30pO1xuICAgIGZvciAoa2V5IGluIGlnbm9yZSkgZGVsZXRlIGZpbmFsZGVzdGluYXRpb25ba2V5XTtcbiAgfSBlbHNlIGlmICgnb2JqZWN0JyA9PT0gdHlwZSkge1xuICAgIGZvciAoa2V5IGluIGxvYykge1xuICAgICAgaWYgKGtleSBpbiBpZ25vcmUpIGNvbnRpbnVlO1xuICAgICAgZmluYWxkZXN0aW5hdGlvbltrZXldID0gbG9jW2tleV07XG4gICAgfVxuXG4gICAgaWYgKGZpbmFsZGVzdGluYXRpb24uc2xhc2hlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmaW5hbGRlc3RpbmF0aW9uLnNsYXNoZXMgPSBzbGFzaGVzLnRlc3QobG9jLmhyZWYpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmaW5hbGRlc3RpbmF0aW9uO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIFByb3RvY29sRXh0cmFjdFxuICogQHR5cGUgT2JqZWN0XG4gKiBAcHJvcGVydHkge1N0cmluZ30gcHJvdG9jb2wgUHJvdG9jb2wgbWF0Y2hlZCBpbiB0aGUgVVJMLCBpbiBsb3dlcmNhc2UuXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHNsYXNoZXMgYHRydWVgIGlmIHByb3RvY29sIGlzIGZvbGxvd2VkIGJ5IFwiLy9cIiwgZWxzZSBgZmFsc2VgLlxuICogQHByb3BlcnR5IHtTdHJpbmd9IHJlc3QgUmVzdCBvZiB0aGUgVVJMIHRoYXQgaXMgbm90IHBhcnQgb2YgdGhlIHByb3RvY29sLlxuICovXG5cbi8qKlxuICogRXh0cmFjdCBwcm90b2NvbCBpbmZvcm1hdGlvbiBmcm9tIGEgVVJMIHdpdGgvd2l0aG91dCBkb3VibGUgc2xhc2ggKFwiLy9cIikuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFkZHJlc3MgVVJMIHdlIHdhbnQgdG8gZXh0cmFjdCBmcm9tLlxuICogQHJldHVybiB7UHJvdG9jb2xFeHRyYWN0fSBFeHRyYWN0ZWQgaW5mb3JtYXRpb24uXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBleHRyYWN0UHJvdG9jb2woYWRkcmVzcykge1xuICBhZGRyZXNzID0gdHJpbUxlZnQoYWRkcmVzcyk7XG4gIHZhciBtYXRjaCA9IHByb3RvY29scmUuZXhlYyhhZGRyZXNzKTtcblxuICByZXR1cm4ge1xuICAgIHByb3RvY29sOiBtYXRjaFsxXSA/IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkgOiAnJyxcbiAgICBzbGFzaGVzOiAhIW1hdGNoWzJdLFxuICAgIHJlc3Q6IG1hdGNoWzNdXG4gIH07XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIHJlbGF0aXZlIFVSTCBwYXRobmFtZSBhZ2FpbnN0IGEgYmFzZSBVUkwgcGF0aG5hbWUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHJlbGF0aXZlIFBhdGhuYW1lIG9mIHRoZSByZWxhdGl2ZSBVUkwuXG4gKiBAcGFyYW0ge1N0cmluZ30gYmFzZSBQYXRobmFtZSBvZiB0aGUgYmFzZSBVUkwuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFJlc29sdmVkIHBhdGhuYW1lLlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZShyZWxhdGl2ZSwgYmFzZSkge1xuICBpZiAocmVsYXRpdmUgPT09ICcnKSByZXR1cm4gYmFzZTtcblxuICB2YXIgcGF0aCA9IChiYXNlIHx8ICcvJykuc3BsaXQoJy8nKS5zbGljZSgwLCAtMSkuY29uY2F0KHJlbGF0aXZlLnNwbGl0KCcvJykpXG4gICAgLCBpID0gcGF0aC5sZW5ndGhcbiAgICAsIGxhc3QgPSBwYXRoW2kgLSAxXVxuICAgICwgdW5zaGlmdCA9IGZhbHNlXG4gICAgLCB1cCA9IDA7XG5cbiAgd2hpbGUgKGktLSkge1xuICAgIGlmIChwYXRoW2ldID09PSAnLicpIHtcbiAgICAgIHBhdGguc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAocGF0aFtpXSA9PT0gJy4uJykge1xuICAgICAgcGF0aC5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIGlmIChpID09PSAwKSB1bnNoaWZ0ID0gdHJ1ZTtcbiAgICAgIHBhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICBpZiAodW5zaGlmdCkgcGF0aC51bnNoaWZ0KCcnKTtcbiAgaWYgKGxhc3QgPT09ICcuJyB8fCBsYXN0ID09PSAnLi4nKSBwYXRoLnB1c2goJycpO1xuXG4gIHJldHVybiBwYXRoLmpvaW4oJy8nKTtcbn1cblxuLyoqXG4gKiBUaGUgYWN0dWFsIFVSTCBpbnN0YW5jZS4gSW5zdGVhZCBvZiByZXR1cm5pbmcgYW4gb2JqZWN0IHdlJ3ZlIG9wdGVkLWluIHRvXG4gKiBjcmVhdGUgYW4gYWN0dWFsIGNvbnN0cnVjdG9yIGFzIGl0J3MgbXVjaCBtb3JlIG1lbW9yeSBlZmZpY2llbnQgYW5kXG4gKiBmYXN0ZXIgYW5kIGl0IHBsZWFzZXMgbXkgT0NELlxuICpcbiAqIEl0IGlzIHdvcnRoIG5vdGluZyB0aGF0IHdlIHNob3VsZCBub3QgdXNlIGBVUkxgIGFzIGNsYXNzIG5hbWUgdG8gcHJldmVudFxuICogY2xhc2hlcyB3aXRoIHRoZSBnbG9iYWwgVVJMIGluc3RhbmNlIHRoYXQgZ290IGludHJvZHVjZWQgaW4gYnJvd3NlcnMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1N0cmluZ30gYWRkcmVzcyBVUkwgd2Ugd2FudCB0byBwYXJzZS5cbiAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gW2xvY2F0aW9uXSBMb2NhdGlvbiBkZWZhdWx0cyBmb3IgcmVsYXRpdmUgcGF0aHMuXG4gKiBAcGFyYW0ge0Jvb2xlYW58RnVuY3Rpb259IFtwYXJzZXJdIFBhcnNlciBmb3IgdGhlIHF1ZXJ5IHN0cmluZy5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIFVybChhZGRyZXNzLCBsb2NhdGlvbiwgcGFyc2VyKSB7XG4gIGFkZHJlc3MgPSB0cmltTGVmdChhZGRyZXNzKTtcblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVXJsKSkge1xuICAgIHJldHVybiBuZXcgVXJsKGFkZHJlc3MsIGxvY2F0aW9uLCBwYXJzZXIpO1xuICB9XG5cbiAgdmFyIHJlbGF0aXZlLCBleHRyYWN0ZWQsIHBhcnNlLCBpbnN0cnVjdGlvbiwgaW5kZXgsIGtleVxuICAgICwgaW5zdHJ1Y3Rpb25zID0gcnVsZXMuc2xpY2UoKVxuICAgICwgdHlwZSA9IHR5cGVvZiBsb2NhdGlvblxuICAgICwgdXJsID0gdGhpc1xuICAgICwgaSA9IDA7XG5cbiAgLy9cbiAgLy8gVGhlIGZvbGxvd2luZyBpZiBzdGF0ZW1lbnRzIGFsbG93cyB0aGlzIG1vZHVsZSB0d28gaGF2ZSBjb21wYXRpYmlsaXR5IHdpdGhcbiAgLy8gMiBkaWZmZXJlbnQgQVBJOlxuICAvL1xuICAvLyAxLiBOb2RlLmpzJ3MgYHVybC5wYXJzZWAgYXBpIHdoaWNoIGFjY2VwdHMgYSBVUkwsIGJvb2xlYW4gYXMgYXJndW1lbnRzXG4gIC8vICAgIHdoZXJlIHRoZSBib29sZWFuIGluZGljYXRlcyB0aGF0IHRoZSBxdWVyeSBzdHJpbmcgc2hvdWxkIGFsc28gYmUgcGFyc2VkLlxuICAvL1xuICAvLyAyLiBUaGUgYFVSTGAgaW50ZXJmYWNlIG9mIHRoZSBicm93c2VyIHdoaWNoIGFjY2VwdHMgYSBVUkwsIG9iamVjdCBhc1xuICAvLyAgICBhcmd1bWVudHMuIFRoZSBzdXBwbGllZCBvYmplY3Qgd2lsbCBiZSB1c2VkIGFzIGRlZmF1bHQgdmFsdWVzIC8gZmFsbC1iYWNrXG4gIC8vICAgIGZvciByZWxhdGl2ZSBwYXRocy5cbiAgLy9cbiAgaWYgKCdvYmplY3QnICE9PSB0eXBlICYmICdzdHJpbmcnICE9PSB0eXBlKSB7XG4gICAgcGFyc2VyID0gbG9jYXRpb247XG4gICAgbG9jYXRpb24gPSBudWxsO1xuICB9XG5cbiAgaWYgKHBhcnNlciAmJiAnZnVuY3Rpb24nICE9PSB0eXBlb2YgcGFyc2VyKSBwYXJzZXIgPSBxcy5wYXJzZTtcblxuICBsb2NhdGlvbiA9IGxvbGNhdGlvbihsb2NhdGlvbik7XG5cbiAgLy9cbiAgLy8gRXh0cmFjdCBwcm90b2NvbCBpbmZvcm1hdGlvbiBiZWZvcmUgcnVubmluZyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAvL1xuICBleHRyYWN0ZWQgPSBleHRyYWN0UHJvdG9jb2woYWRkcmVzcyB8fCAnJyk7XG4gIHJlbGF0aXZlID0gIWV4dHJhY3RlZC5wcm90b2NvbCAmJiAhZXh0cmFjdGVkLnNsYXNoZXM7XG4gIHVybC5zbGFzaGVzID0gZXh0cmFjdGVkLnNsYXNoZXMgfHwgcmVsYXRpdmUgJiYgbG9jYXRpb24uc2xhc2hlcztcbiAgdXJsLnByb3RvY29sID0gZXh0cmFjdGVkLnByb3RvY29sIHx8IGxvY2F0aW9uLnByb3RvY29sIHx8ICcnO1xuICBhZGRyZXNzID0gZXh0cmFjdGVkLnJlc3Q7XG5cbiAgLy9cbiAgLy8gV2hlbiB0aGUgYXV0aG9yaXR5IGNvbXBvbmVudCBpcyBhYnNlbnQgdGhlIFVSTCBzdGFydHMgd2l0aCBhIHBhdGhcbiAgLy8gY29tcG9uZW50LlxuICAvL1xuICBpZiAoIWV4dHJhY3RlZC5zbGFzaGVzKSBpbnN0cnVjdGlvbnNbM10gPSBbLyguKikvLCAncGF0aG5hbWUnXTtcblxuICBmb3IgKDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGluc3RydWN0aW9uID0gaW5zdHJ1Y3Rpb25zW2ldO1xuXG4gICAgaWYgKHR5cGVvZiBpbnN0cnVjdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYWRkcmVzcyA9IGluc3RydWN0aW9uKGFkZHJlc3MpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcGFyc2UgPSBpbnN0cnVjdGlvblswXTtcbiAgICBrZXkgPSBpbnN0cnVjdGlvblsxXTtcblxuICAgIGlmIChwYXJzZSAhPT0gcGFyc2UpIHtcbiAgICAgIHVybFtrZXldID0gYWRkcmVzcztcbiAgICB9IGVsc2UgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgcGFyc2UpIHtcbiAgICAgIGlmICh+KGluZGV4ID0gYWRkcmVzcy5pbmRleE9mKHBhcnNlKSkpIHtcbiAgICAgICAgaWYgKCdudW1iZXInID09PSB0eXBlb2YgaW5zdHJ1Y3Rpb25bMl0pIHtcbiAgICAgICAgICB1cmxba2V5XSA9IGFkZHJlc3Muc2xpY2UoMCwgaW5kZXgpO1xuICAgICAgICAgIGFkZHJlc3MgPSBhZGRyZXNzLnNsaWNlKGluZGV4ICsgaW5zdHJ1Y3Rpb25bMl0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVybFtrZXldID0gYWRkcmVzcy5zbGljZShpbmRleCk7XG4gICAgICAgICAgYWRkcmVzcyA9IGFkZHJlc3Muc2xpY2UoMCwgaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgoaW5kZXggPSBwYXJzZS5leGVjKGFkZHJlc3MpKSkge1xuICAgICAgdXJsW2tleV0gPSBpbmRleFsxXTtcbiAgICAgIGFkZHJlc3MgPSBhZGRyZXNzLnNsaWNlKDAsIGluZGV4LmluZGV4KTtcbiAgICB9XG5cbiAgICB1cmxba2V5XSA9IHVybFtrZXldIHx8IChcbiAgICAgIHJlbGF0aXZlICYmIGluc3RydWN0aW9uWzNdID8gbG9jYXRpb25ba2V5XSB8fCAnJyA6ICcnXG4gICAgKTtcblxuICAgIC8vXG4gICAgLy8gSG9zdG5hbWUsIGhvc3QgYW5kIHByb3RvY29sIHNob3VsZCBiZSBsb3dlcmNhc2VkIHNvIHRoZXkgY2FuIGJlIHVzZWQgdG9cbiAgICAvLyBjcmVhdGUgYSBwcm9wZXIgYG9yaWdpbmAuXG4gICAgLy9cbiAgICBpZiAoaW5zdHJ1Y3Rpb25bNF0pIHVybFtrZXldID0gdXJsW2tleV0udG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIEFsc28gcGFyc2UgdGhlIHN1cHBsaWVkIHF1ZXJ5IHN0cmluZyBpbiB0byBhbiBvYmplY3QuIElmIHdlJ3JlIHN1cHBsaWVkXG4gIC8vIHdpdGggYSBjdXN0b20gcGFyc2VyIGFzIGZ1bmN0aW9uIHVzZSB0aGF0IGluc3RlYWQgb2YgdGhlIGRlZmF1bHQgYnVpbGQtaW5cbiAgLy8gcGFyc2VyLlxuICAvL1xuICBpZiAocGFyc2VyKSB1cmwucXVlcnkgPSBwYXJzZXIodXJsLnF1ZXJ5KTtcblxuICAvL1xuICAvLyBJZiB0aGUgVVJMIGlzIHJlbGF0aXZlLCByZXNvbHZlIHRoZSBwYXRobmFtZSBhZ2FpbnN0IHRoZSBiYXNlIFVSTC5cbiAgLy9cbiAgaWYgKFxuICAgICAgcmVsYXRpdmVcbiAgICAmJiBsb2NhdGlvbi5zbGFzaGVzXG4gICAgJiYgdXJsLnBhdGhuYW1lLmNoYXJBdCgwKSAhPT0gJy8nXG4gICAgJiYgKHVybC5wYXRobmFtZSAhPT0gJycgfHwgbG9jYXRpb24ucGF0aG5hbWUgIT09ICcnKVxuICApIHtcbiAgICB1cmwucGF0aG5hbWUgPSByZXNvbHZlKHVybC5wYXRobmFtZSwgbG9jYXRpb24ucGF0aG5hbWUpO1xuICB9XG5cbiAgLy9cbiAgLy8gV2Ugc2hvdWxkIG5vdCBhZGQgcG9ydCBudW1iZXJzIGlmIHRoZXkgYXJlIGFscmVhZHkgdGhlIGRlZmF1bHQgcG9ydCBudW1iZXJcbiAgLy8gZm9yIGEgZ2l2ZW4gcHJvdG9jb2wuIEFzIHRoZSBob3N0IGFsc28gY29udGFpbnMgdGhlIHBvcnQgbnVtYmVyIHdlJ3JlIGdvaW5nXG4gIC8vIG92ZXJyaWRlIGl0IHdpdGggdGhlIGhvc3RuYW1lIHdoaWNoIGNvbnRhaW5zIG5vIHBvcnQgbnVtYmVyLlxuICAvL1xuICBpZiAoIXJlcXVpcmVkKHVybC5wb3J0LCB1cmwucHJvdG9jb2wpKSB7XG4gICAgdXJsLmhvc3QgPSB1cmwuaG9zdG5hbWU7XG4gICAgdXJsLnBvcnQgPSAnJztcbiAgfVxuXG4gIC8vXG4gIC8vIFBhcnNlIGRvd24gdGhlIGBhdXRoYCBmb3IgdGhlIHVzZXJuYW1lIGFuZCBwYXNzd29yZC5cbiAgLy9cbiAgdXJsLnVzZXJuYW1lID0gdXJsLnBhc3N3b3JkID0gJyc7XG4gIGlmICh1cmwuYXV0aCkge1xuICAgIGluc3RydWN0aW9uID0gdXJsLmF1dGguc3BsaXQoJzonKTtcbiAgICB1cmwudXNlcm5hbWUgPSBpbnN0cnVjdGlvblswXSB8fCAnJztcbiAgICB1cmwucGFzc3dvcmQgPSBpbnN0cnVjdGlvblsxXSB8fCAnJztcbiAgfVxuXG4gIHVybC5vcmlnaW4gPSB1cmwucHJvdG9jb2wgJiYgdXJsLmhvc3QgJiYgdXJsLnByb3RvY29sICE9PSAnZmlsZTonXG4gICAgPyB1cmwucHJvdG9jb2wgKycvLycrIHVybC5ob3N0XG4gICAgOiAnbnVsbCc7XG5cbiAgLy9cbiAgLy8gVGhlIGhyZWYgaXMganVzdCB0aGUgY29tcGlsZWQgcmVzdWx0LlxuICAvL1xuICB1cmwuaHJlZiA9IHVybC50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIFRoaXMgaXMgY29udmVuaWVuY2UgbWV0aG9kIGZvciBjaGFuZ2luZyBwcm9wZXJ0aWVzIGluIHRoZSBVUkwgaW5zdGFuY2UgdG9cbiAqIGluc3VyZSB0aGF0IHRoZXkgYWxsIHByb3BhZ2F0ZSBjb3JyZWN0bHkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhcnQgICAgICAgICAgUHJvcGVydHkgd2UgbmVlZCB0byBhZGp1c3QuXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSAgICAgICAgICBUaGUgbmV3bHkgYXNzaWduZWQgdmFsdWUuXG4gKiBAcGFyYW0ge0Jvb2xlYW58RnVuY3Rpb259IGZuICBXaGVuIHNldHRpbmcgdGhlIHF1ZXJ5LCBpdCB3aWxsIGJlIHRoZSBmdW5jdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCB0byBwYXJzZSB0aGUgcXVlcnkuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXaGVuIHNldHRpbmcgdGhlIHByb3RvY29sLCBkb3VibGUgc2xhc2ggd2lsbCBiZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCBmcm9tIHRoZSBmaW5hbCB1cmwgaWYgaXQgaXMgdHJ1ZS5cbiAqIEByZXR1cm5zIHtVUkx9IFVSTCBpbnN0YW5jZSBmb3IgY2hhaW5pbmcuXG4gKiBAcHVibGljXG4gKi9cbmZ1bmN0aW9uIHNldChwYXJ0LCB2YWx1ZSwgZm4pIHtcbiAgdmFyIHVybCA9IHRoaXM7XG5cbiAgc3dpdGNoIChwYXJ0KSB7XG4gICAgY2FzZSAncXVlcnknOlxuICAgICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgdmFsdWUgJiYgdmFsdWUubGVuZ3RoKSB7XG4gICAgICAgIHZhbHVlID0gKGZuIHx8IHFzLnBhcnNlKSh2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHVybFtwYXJ0XSA9IHZhbHVlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdwb3J0JzpcbiAgICAgIHVybFtwYXJ0XSA9IHZhbHVlO1xuXG4gICAgICBpZiAoIXJlcXVpcmVkKHZhbHVlLCB1cmwucHJvdG9jb2wpKSB7XG4gICAgICAgIHVybC5ob3N0ID0gdXJsLmhvc3RuYW1lO1xuICAgICAgICB1cmxbcGFydF0gPSAnJztcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgICAgdXJsLmhvc3QgPSB1cmwuaG9zdG5hbWUgKyc6JysgdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnaG9zdG5hbWUnOlxuICAgICAgdXJsW3BhcnRdID0gdmFsdWU7XG5cbiAgICAgIGlmICh1cmwucG9ydCkgdmFsdWUgKz0gJzonKyB1cmwucG9ydDtcbiAgICAgIHVybC5ob3N0ID0gdmFsdWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ2hvc3QnOlxuICAgICAgdXJsW3BhcnRdID0gdmFsdWU7XG5cbiAgICAgIGlmICgvOlxcZCskLy50ZXN0KHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnNwbGl0KCc6Jyk7XG4gICAgICAgIHVybC5wb3J0ID0gdmFsdWUucG9wKCk7XG4gICAgICAgIHVybC5ob3N0bmFtZSA9IHZhbHVlLmpvaW4oJzonKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybC5ob3N0bmFtZSA9IHZhbHVlO1xuICAgICAgICB1cmwucG9ydCA9ICcnO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3Byb3RvY29sJzpcbiAgICAgIHVybC5wcm90b2NvbCA9IHZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICB1cmwuc2xhc2hlcyA9ICFmbjtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAncGF0aG5hbWUnOlxuICAgIGNhc2UgJ2hhc2gnOlxuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHZhciBjaGFyID0gcGFydCA9PT0gJ3BhdGhuYW1lJyA/ICcvJyA6ICcjJztcbiAgICAgICAgdXJsW3BhcnRdID0gdmFsdWUuY2hhckF0KDApICE9PSBjaGFyID8gY2hhciArIHZhbHVlIDogdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmxbcGFydF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHVybFtwYXJ0XSA9IHZhbHVlO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpbnMgPSBydWxlc1tpXTtcblxuICAgIGlmIChpbnNbNF0pIHVybFtpbnNbMV1dID0gdXJsW2luc1sxXV0udG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIHVybC5vcmlnaW4gPSB1cmwucHJvdG9jb2wgJiYgdXJsLmhvc3QgJiYgdXJsLnByb3RvY29sICE9PSAnZmlsZTonXG4gICAgPyB1cmwucHJvdG9jb2wgKycvLycrIHVybC5ob3N0XG4gICAgOiAnbnVsbCc7XG5cbiAgdXJsLmhyZWYgPSB1cmwudG9TdHJpbmcoKTtcblxuICByZXR1cm4gdXJsO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybSB0aGUgcHJvcGVydGllcyBiYWNrIGluIHRvIGEgdmFsaWQgYW5kIGZ1bGwgVVJMIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdHJpbmdpZnkgT3B0aW9uYWwgcXVlcnkgc3RyaW5naWZ5IGZ1bmN0aW9uLlxuICogQHJldHVybnMge1N0cmluZ30gQ29tcGlsZWQgdmVyc2lvbiBvZiB0aGUgVVJMLlxuICogQHB1YmxpY1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyhzdHJpbmdpZnkpIHtcbiAgaWYgKCFzdHJpbmdpZnkgfHwgJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIHN0cmluZ2lmeSkgc3RyaW5naWZ5ID0gcXMuc3RyaW5naWZ5O1xuXG4gIHZhciBxdWVyeVxuICAgICwgdXJsID0gdGhpc1xuICAgICwgcHJvdG9jb2wgPSB1cmwucHJvdG9jb2w7XG5cbiAgaWYgKHByb3RvY29sICYmIHByb3RvY29sLmNoYXJBdChwcm90b2NvbC5sZW5ndGggLSAxKSAhPT0gJzonKSBwcm90b2NvbCArPSAnOic7XG5cbiAgdmFyIHJlc3VsdCA9IHByb3RvY29sICsgKHVybC5zbGFzaGVzID8gJy8vJyA6ICcnKTtcblxuICBpZiAodXJsLnVzZXJuYW1lKSB7XG4gICAgcmVzdWx0ICs9IHVybC51c2VybmFtZTtcbiAgICBpZiAodXJsLnBhc3N3b3JkKSByZXN1bHQgKz0gJzonKyB1cmwucGFzc3dvcmQ7XG4gICAgcmVzdWx0ICs9ICdAJztcbiAgfVxuXG4gIHJlc3VsdCArPSB1cmwuaG9zdCArIHVybC5wYXRobmFtZTtcblxuICBxdWVyeSA9ICdvYmplY3QnID09PSB0eXBlb2YgdXJsLnF1ZXJ5ID8gc3RyaW5naWZ5KHVybC5xdWVyeSkgOiB1cmwucXVlcnk7XG4gIGlmIChxdWVyeSkgcmVzdWx0ICs9ICc/JyAhPT0gcXVlcnkuY2hhckF0KDApID8gJz8nKyBxdWVyeSA6IHF1ZXJ5O1xuXG4gIGlmICh1cmwuaGFzaCkgcmVzdWx0ICs9IHVybC5oYXNoO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblVybC5wcm90b3R5cGUgPSB7IHNldDogc2V0LCB0b1N0cmluZzogdG9TdHJpbmcgfTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgVVJMIHBhcnNlciBhbmQgc29tZSBhZGRpdGlvbmFsIHByb3BlcnRpZXMgdGhhdCBtaWdodCBiZSB1c2VmdWwgZm9yXG4vLyBvdGhlcnMgb3IgdGVzdGluZy5cbi8vXG5VcmwuZXh0cmFjdFByb3RvY29sID0gZXh0cmFjdFByb3RvY29sO1xuVXJsLmxvY2F0aW9uID0gbG9sY2F0aW9uO1xuVXJsLnRyaW1MZWZ0ID0gdHJpbUxlZnQ7XG5VcmwucXMgPSBxcztcblxubW9kdWxlLmV4cG9ydHMgPSBVcmw7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gIChmYWN0b3J5KChnbG9iYWwuV0hBVFdHRmV0Y2ggPSB7fSkpKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICB2YXIgc3VwcG9ydCA9IHtcbiAgICBzZWFyY2hQYXJhbXM6ICdVUkxTZWFyY2hQYXJhbXMnIGluIHNlbGYsXG4gICAgaXRlcmFibGU6ICdTeW1ib2wnIGluIHNlbGYgJiYgJ2l0ZXJhdG9yJyBpbiBTeW1ib2wsXG4gICAgYmxvYjpcbiAgICAgICdGaWxlUmVhZGVyJyBpbiBzZWxmICYmXG4gICAgICAnQmxvYicgaW4gc2VsZiAmJlxuICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9KSgpLFxuICAgIGZvcm1EYXRhOiAnRm9ybURhdGEnIGluIHNlbGYsXG4gICAgYXJyYXlCdWZmZXI6ICdBcnJheUJ1ZmZlcicgaW4gc2VsZlxuICB9O1xuXG4gIGZ1bmN0aW9uIGlzRGF0YVZpZXcob2JqKSB7XG4gICAgcmV0dXJuIG9iaiAmJiBEYXRhVmlldy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihvYmopXG4gIH1cblxuICBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICAgIHZhciB2aWV3Q2xhc3NlcyA9IFtcbiAgICAgICdbb2JqZWN0IEludDhBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDhBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEludDE2QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQxNkFycmF5XScsXG4gICAgICAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgRmxvYXQzMkFycmF5XScsXG4gICAgICAnW29iamVjdCBGbG9hdDY0QXJyYXldJ1xuICAgIF07XG5cbiAgICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPVxuICAgICAgQXJyYXlCdWZmZXIuaXNWaWV3IHx8XG4gICAgICBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiAmJiB2aWV3Q2xhc3Nlcy5pbmRleE9mKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopKSA+IC0xXG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICB9XG4gICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgLy8gQnVpbGQgYSBkZXN0cnVjdGl2ZSBpdGVyYXRvciBmb3IgdGhlIHZhbHVlIGxpc3RcbiAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKTtcbiAgICAgICAgcmV0dXJuIHtkb25lOiB2YWx1ZSA9PT0gdW5kZWZpbmVkLCB2YWx1ZTogdmFsdWV9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICBpdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvclxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlcmF0b3JcbiAgfVxuXG4gIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgIHRoaXMubWFwID0ge307XG5cbiAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMubWFwW25hbWVdO1xuICAgIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSArICcsICcgKyB2YWx1ZSA6IHZhbHVlO1xuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlWydkZWxldGUnXSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV07XG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgIHJldHVybiB0aGlzLmhhcyhuYW1lKSA/IHRoaXMubWFwW25hbWVdIDogbnVsbFxuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuaGFzT3duUHJvcGVydHkobm9ybWFsaXplTmFtZShuYW1lKSlcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHRoaXMubWFwW25hbWVdLCBuYW1lLCB0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgaXRlbXMucHVzaChuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpdGVtcy5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKTtcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH07XG5cbiAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG4gICAgICB9O1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzQXJyYXlCdWZmZXIoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpO1xuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgdmFyIHByb21pc2UgPSBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKTtcbiAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKTtcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEFycmF5QnVmZmVyQXNUZXh0KGJ1Zikge1xuICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmKTtcbiAgICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUodmlld1tpXSk7XG4gICAgfVxuICAgIHJldHVybiBjaGFycy5qb2luKCcnKVxuICB9XG5cbiAgZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gICAgaWYgKGJ1Zi5zbGljZSkge1xuICAgICAgcmV0dXJuIGJ1Zi5zbGljZSgwKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zi5ieXRlTGVuZ3RoKTtcbiAgICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpO1xuICAgICAgcmV0dXJuIHZpZXcuYnVmZmVyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gQm9keSgpIHtcbiAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keTtcbiAgICAgIGlmICghYm9keSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9ICcnO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5O1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmJsb2IgJiYgQmxvYi5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHk7XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keTtcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpO1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIHN1cHBvcnQuYmxvYiAmJiBpc0RhdGFWaWV3KGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKTtcbiAgICAgICAgLy8gSUUgMTAtMTEgY2FuJ3QgaGFuZGxlIGEgRGF0YVZpZXcgYm9keS5cbiAgICAgICAgdGhpcy5fYm9keUluaXQgPSBuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSk7XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8IGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKSkge1xuICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChib2R5KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47Y2hhcnNldD1VVEYtOCcpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlCbG9iICYmIHRoaXMuX2JvZHlCbG9iLnR5cGUpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCB0aGlzLl9ib2R5QmxvYi50eXBlKTtcbiAgICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKSlcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYicpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSlcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnN1bWVkKHRoaXMpIHx8IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlYWRBcnJheUJ1ZmZlckFzVGV4dCh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIHRleHQnKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKEpTT04ucGFyc2UpXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBIVFRQIG1ldGhvZHMgd2hvc2UgY2FwaXRhbGl6YXRpb24gc2hvdWxkIGJlIG5vcm1hbGl6ZWRcbiAgdmFyIG1ldGhvZHMgPSBbJ0RFTEVURScsICdHRVQnLCAnSEVBRCcsICdPUFRJT05TJywgJ1BPU1QnLCAnUFVUJ107XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuIG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xID8gdXBjYXNlZCA6IG1ldGhvZFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5O1xuXG4gICAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpXG4gICAgICB9XG4gICAgICB0aGlzLnVybCA9IGlucHV0LnVybDtcbiAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFscztcbiAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlO1xuICAgICAgdGhpcy5zaWduYWwgPSBpbnB1dC5zaWduYWw7XG4gICAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdDtcbiAgICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVybCA9IFN0cmluZyhpbnB1dCk7XG4gICAgfVxuXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCAnc2FtZS1vcmlnaW4nO1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICB9XG4gICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgJ0dFVCcpO1xuICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbDtcbiAgICB0aGlzLnNpZ25hbCA9IG9wdGlvbnMuc2lnbmFsIHx8IHRoaXMuc2lnbmFsO1xuICAgIHRoaXMucmVmZXJyZXIgPSBudWxsO1xuXG4gICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShib2R5KTtcbiAgfVxuXG4gIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHtib2R5OiB0aGlzLl9ib2R5SW5pdH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGJvZHlcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdCgnJicpXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpO1xuICAgICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJyk7XG4gICAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlSGVhZGVycyhyYXdIZWFkZXJzKSB7XG4gICAgdmFyIGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAgIC8vIFJlcGxhY2UgaW5zdGFuY2VzIG9mIFxcclxcbiBhbmQgXFxuIGZvbGxvd2VkIGJ5IGF0IGxlYXN0IG9uZSBzcGFjZSBvciBob3Jpem9udGFsIHRhYiB3aXRoIGEgc3BhY2VcbiAgICAvLyBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNzIzMCNzZWN0aW9uLTMuMlxuICAgIHZhciBwcmVQcm9jZXNzZWRIZWFkZXJzID0gcmF3SGVhZGVycy5yZXBsYWNlKC9cXHI/XFxuW1xcdCBdKy9nLCAnICcpO1xuICAgIHByZVByb2Nlc3NlZEhlYWRlcnMuc3BsaXQoL1xccj9cXG4vKS5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoJzonKTtcbiAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKTtcbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFydHMuam9pbignOicpLnRyaW0oKTtcbiAgICAgICAgaGVhZGVycy5hcHBlbmQoa2V5LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGhlYWRlcnNcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSk7XG5cbiAgZnVuY3Rpb24gUmVzcG9uc2UoYm9keUluaXQsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZGVmYXVsdCc7XG4gICAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1cyA9PT0gdW5kZWZpbmVkID8gMjAwIDogb3B0aW9ucy5zdGF0dXM7XG4gICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMDtcbiAgICB0aGlzLnN0YXR1c1RleHQgPSAnc3RhdHVzVGV4dCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6ICdPSyc7XG4gICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8ICcnO1xuICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KTtcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpO1xuXG4gIFJlc3BvbnNlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICBzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG4gICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgdXJsOiB0aGlzLnVybFxuICAgIH0pXG4gIH07XG5cbiAgUmVzcG9uc2UuZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogMCwgc3RhdHVzVGV4dDogJyd9KTtcbiAgICByZXNwb25zZS50eXBlID0gJ2Vycm9yJztcbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfTtcblxuICB2YXIgcmVkaXJlY3RTdGF0dXNlcyA9IFszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF07XG5cbiAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbiAgfTtcblxuICBleHBvcnRzLkRPTUV4Y2VwdGlvbiA9IHNlbGYuRE9NRXhjZXB0aW9uO1xuICB0cnkge1xuICAgIG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBleHBvcnRzLkRPTUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKG1lc3NhZ2UsIG5hbWUpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdmFyIGVycm9yID0gRXJyb3IobWVzc2FnZSk7XG4gICAgICB0aGlzLnN0YWNrID0gZXJyb3Iuc3RhY2s7XG4gICAgfTtcbiAgICBleHBvcnRzLkRPTUV4Y2VwdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG4gICAgZXhwb3J0cy5ET01FeGNlcHRpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gZXhwb3J0cy5ET01FeGNlcHRpb247XG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaChpbnB1dCwgaW5pdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpO1xuXG4gICAgICBpZiAocmVxdWVzdC5zaWduYWwgJiYgcmVxdWVzdC5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJykpXG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgZnVuY3Rpb24gYWJvcnRYaHIoKSB7XG4gICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBwYXJzZUhlYWRlcnMoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKVxuICAgICAgICB9O1xuICAgICAgICBvcHRpb25zLnVybCA9ICdyZXNwb25zZVVSTCcgaW4geGhyID8geGhyLnJlc3BvbnNlVVJMIDogb3B0aW9ucy5oZWFkZXJzLmdldCgnWC1SZXF1ZXN0LVVSTCcpO1xuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSk7XG4gICAgICB9O1xuXG4gICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJykpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKTtcblxuICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdpbmNsdWRlJykge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ29taXQnKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJztcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgdmFsdWUpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXF1ZXN0LnNpZ25hbCkge1xuICAgICAgICByZXF1ZXN0LnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0WGhyKTtcblxuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gRE9ORSAoc3VjY2VzcyBvciBmYWlsdXJlKVxuICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgcmVxdWVzdC5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydFhocik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KTtcbiAgICB9KVxuICB9XG5cbiAgZmV0Y2gucG9seWZpbGwgPSB0cnVlO1xuXG4gIGlmICghc2VsZi5mZXRjaCkge1xuICAgIHNlbGYuZmV0Y2ggPSBmZXRjaDtcbiAgICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICAgIHNlbGYuUmVxdWVzdCA9IFJlcXVlc3Q7XG4gICAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlO1xuICB9XG5cbiAgZXhwb3J0cy5IZWFkZXJzID0gSGVhZGVycztcbiAgZXhwb3J0cy5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgZXhwb3J0cy5SZXNwb25zZSA9IFJlc3BvbnNlO1xuICBleHBvcnRzLmZldGNoID0gZmV0Y2g7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICAjIHdpbGRjYXJkXG5cbiAgVmVyeSBzaW1wbGUgd2lsZGNhcmQgbWF0Y2hpbmcsIHdoaWNoIGlzIGRlc2lnbmVkIHRvIHByb3ZpZGUgdGhlIHNhbWVcbiAgZnVuY3Rpb25hbGl0eSB0aGF0IGlzIGZvdW5kIGluIHRoZVxuICBbZXZlXShodHRwczovL2dpdGh1Yi5jb20vYWRvYmUtd2VicGxhdGZvcm0vZXZlKSBldmVudGluZyBsaWJyYXJ5LlxuXG4gICMjIFVzYWdlXG5cbiAgSXQgd29ya3Mgd2l0aCBzdHJpbmdzOlxuXG4gIDw8PCBleGFtcGxlcy9zdHJpbmdzLmpzXG5cbiAgQXJyYXlzOlxuXG4gIDw8PCBleGFtcGxlcy9hcnJheXMuanNcblxuICBPYmplY3RzIChtYXRjaGluZyBhZ2FpbnN0IGtleXMpOlxuXG4gIDw8PCBleGFtcGxlcy9vYmplY3RzLmpzXG5cbiAgV2hpbGUgdGhlIGxpYnJhcnkgd29ya3MgaW4gTm9kZSwgaWYgeW91IGFyZSBhcmUgbG9va2luZyBmb3IgZmlsZS1iYXNlZFxuICB3aWxkY2FyZCBtYXRjaGluZyB0aGVuIHlvdSBzaG91bGQgaGF2ZSBhIGxvb2sgYXQ6XG5cbiAgPGh0dHBzOi8vZ2l0aHViLmNvbS9pc2FhY3Mvbm9kZS1nbG9iPlxuKiovXG5cbmZ1bmN0aW9uIFdpbGRjYXJkTWF0Y2hlcih0ZXh0LCBzZXBhcmF0b3IpIHtcbiAgdGhpcy50ZXh0ID0gdGV4dCA9IHRleHQgfHwgJyc7XG4gIHRoaXMuaGFzV2lsZCA9IH50ZXh0LmluZGV4T2YoJyonKTtcbiAgdGhpcy5zZXBhcmF0b3IgPSBzZXBhcmF0b3I7XG4gIHRoaXMucGFydHMgPSB0ZXh0LnNwbGl0KHNlcGFyYXRvcik7XG59XG5cbldpbGRjYXJkTWF0Y2hlci5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgbWF0Y2hlcyA9IHRydWU7XG4gIHZhciBwYXJ0cyA9IHRoaXMucGFydHM7XG4gIHZhciBpaTtcbiAgdmFyIHBhcnRzQ291bnQgPSBwYXJ0cy5sZW5ndGg7XG4gIHZhciB0ZXN0UGFydHM7XG5cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PSAnc3RyaW5nJyB8fCBpbnB1dCBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgIGlmICghdGhpcy5oYXNXaWxkICYmIHRoaXMudGV4dCAhPSBpbnB1dCkge1xuICAgICAgbWF0Y2hlcyA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ZXN0UGFydHMgPSAoaW5wdXQgfHwgJycpLnNwbGl0KHRoaXMuc2VwYXJhdG9yKTtcbiAgICAgIGZvciAoaWkgPSAwOyBtYXRjaGVzICYmIGlpIDwgcGFydHNDb3VudDsgaWkrKykge1xuICAgICAgICBpZiAocGFydHNbaWldID09PSAnKicpICB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoaWkgPCB0ZXN0UGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgbWF0Y2hlcyA9IHBhcnRzW2lpXSA9PT0gdGVzdFBhcnRzW2lpXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbWF0Y2hlcywgdGhlbiByZXR1cm4gdGhlIGNvbXBvbmVudCBwYXJ0c1xuICAgICAgbWF0Y2hlcyA9IG1hdGNoZXMgJiYgdGVzdFBhcnRzO1xuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0eXBlb2YgaW5wdXQuc3BsaWNlID09ICdmdW5jdGlvbicpIHtcbiAgICBtYXRjaGVzID0gW107XG5cbiAgICBmb3IgKGlpID0gaW5wdXQubGVuZ3RoOyBpaS0tOyApIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKGlucHV0W2lpXSkpIHtcbiAgICAgICAgbWF0Y2hlc1ttYXRjaGVzLmxlbmd0aF0gPSBpbnB1dFtpaV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PSAnb2JqZWN0Jykge1xuICAgIG1hdGNoZXMgPSB7fTtcblxuICAgIGZvciAodmFyIGtleSBpbiBpbnB1dCkge1xuICAgICAgaWYgKHRoaXMubWF0Y2goa2V5KSkge1xuICAgICAgICBtYXRjaGVzW2tleV0gPSBpbnB1dFtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXRjaGVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0ZXh0LCB0ZXN0LCBzZXBhcmF0b3IpIHtcbiAgdmFyIG1hdGNoZXIgPSBuZXcgV2lsZGNhcmRNYXRjaGVyKHRleHQsIHNlcGFyYXRvciB8fCAvW1xcL1xcLl0vKTtcbiAgaWYgKHR5cGVvZiB0ZXN0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIG1hdGNoZXIubWF0Y2godGVzdCk7XG4gIH1cblxuICByZXR1cm4gbWF0Y2hlcjtcbn07XG4iLCIndXNlIHN0cmljdCdcblxuY2xhc3MgQXV0aEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoJ0F1dGhvcml6YXRpb24gcmVxdWlyZWQnKVxuICAgIHRoaXMubmFtZSA9ICdBdXRoRXJyb3InXG4gICAgdGhpcy5pc0F1dGhFcnJvciA9IHRydWVcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhFcnJvclxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IFJlcXVlc3RDbGllbnQgPSByZXF1aXJlKCcuL1JlcXVlc3RDbGllbnQnKVxuY29uc3QgdG9rZW5TdG9yYWdlID0gcmVxdWlyZSgnLi90b2tlblN0b3JhZ2UnKVxuXG5jb25zdCBfZ2V0TmFtZSA9IChpZCkgPT4ge1xuICByZXR1cm4gaWQuc3BsaXQoJy0nKS5tYXAoKHMpID0+IHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnNsaWNlKDEpKS5qb2luKCcgJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQcm92aWRlciBleHRlbmRzIFJlcXVlc3RDbGllbnQge1xuICBjb25zdHJ1Y3RvciAodXBweSwgb3B0cykge1xuICAgIHN1cGVyKHVwcHksIG9wdHMpXG4gICAgdGhpcy5wcm92aWRlciA9IG9wdHMucHJvdmlkZXJcbiAgICB0aGlzLmlkID0gdGhpcy5wcm92aWRlclxuICAgIHRoaXMuYXV0aFByb3ZpZGVyID0gb3B0cy5hdXRoUHJvdmlkZXIgfHwgdGhpcy5wcm92aWRlclxuICAgIHRoaXMubmFtZSA9IHRoaXMub3B0cy5uYW1lIHx8IF9nZXROYW1lKHRoaXMuaWQpXG4gICAgdGhpcy5wbHVnaW5JZCA9IHRoaXMub3B0cy5wbHVnaW5JZFxuICAgIHRoaXMudG9rZW5LZXkgPSBgY29tcGFuaW9uLSR7dGhpcy5wbHVnaW5JZH0tYXV0aC10b2tlbmBcbiAgfVxuXG4gIGhlYWRlcnMgKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBzdXBlci5oZWFkZXJzKCkudGhlbigoaGVhZGVycykgPT4ge1xuICAgICAgICB0aGlzLmdldEF1dGhUb2tlbigpLnRoZW4oKHRva2VuKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShPYmplY3QuYXNzaWduKHt9LCBoZWFkZXJzLCB7ICd1cHB5LWF1dGgtdG9rZW4nOiB0b2tlbiB9KSlcbiAgICAgICAgfSlcbiAgICAgIH0pLmNhdGNoKHJlamVjdClcbiAgICB9KVxuICB9XG5cbiAgb25SZWNlaXZlUmVzcG9uc2UgKHJlc3BvbnNlKSB7XG4gICAgcmVzcG9uc2UgPSBzdXBlci5vblJlY2VpdmVSZXNwb25zZShyZXNwb25zZSlcbiAgICBjb25zdCBhdXRoZW50aWNhdGVkID0gcmVzcG9uc2Uuc3RhdHVzICE9PSA0MDFcbiAgICB0aGlzLnVwcHkuZ2V0UGx1Z2luKHRoaXMucGx1Z2luSWQpLnNldFBsdWdpblN0YXRlKHsgYXV0aGVudGljYXRlZCB9KVxuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgLy8gQHRvZG8oaS5vbGFyZXdhanUpIGNvbnNpZGVyIHdoZXRoZXIgb3Igbm90IHRoaXMgbWV0aG9kIHNob3VsZCBiZSBleHBvc2VkXG4gIHNldEF1dGhUb2tlbiAodG9rZW4pIHtcbiAgICByZXR1cm4gdGhpcy51cHB5LmdldFBsdWdpbih0aGlzLnBsdWdpbklkKS5zdG9yYWdlLnNldEl0ZW0odGhpcy50b2tlbktleSwgdG9rZW4pXG4gIH1cblxuICBnZXRBdXRoVG9rZW4gKCkge1xuICAgIHJldHVybiB0aGlzLnVwcHkuZ2V0UGx1Z2luKHRoaXMucGx1Z2luSWQpLnN0b3JhZ2UuZ2V0SXRlbSh0aGlzLnRva2VuS2V5KVxuICB9XG5cbiAgYXV0aFVybCAoKSB7XG4gICAgcmV0dXJuIGAke3RoaXMuaG9zdG5hbWV9LyR7dGhpcy5pZH0vY29ubmVjdGBcbiAgfVxuXG4gIGZpbGVVcmwgKGlkKSB7XG4gICAgcmV0dXJuIGAke3RoaXMuaG9zdG5hbWV9LyR7dGhpcy5pZH0vZ2V0LyR7aWR9YFxuICB9XG5cbiAgbGlzdCAoZGlyZWN0b3J5KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KGAke3RoaXMuaWR9L2xpc3QvJHtkaXJlY3RvcnkgfHwgJyd9YClcbiAgfVxuXG4gIGxvZ291dCAocmVkaXJlY3QgPSBsb2NhdGlvbi5ocmVmKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuZ2V0KGAke3RoaXMuaWR9L2xvZ291dD9yZWRpcmVjdD0ke3JlZGlyZWN0fWApXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICB0aGlzLnVwcHkuZ2V0UGx1Z2luKHRoaXMucGx1Z2luSWQpLnN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLnRva2VuS2V5KVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzb2x2ZShyZXMpKVxuICAgICAgICAgICAgLmNhdGNoKHJlamVjdClcbiAgICAgICAgfSkuY2F0Y2gocmVqZWN0KVxuICAgIH0pXG4gIH1cblxuICBzdGF0aWMgaW5pdFBsdWdpbiAocGx1Z2luLCBvcHRzLCBkZWZhdWx0T3B0cykge1xuICAgIHBsdWdpbi50eXBlID0gJ2FjcXVpcmVyJ1xuICAgIHBsdWdpbi5maWxlcyA9IFtdXG4gICAgaWYgKGRlZmF1bHRPcHRzKSB7XG4gICAgICBwbHVnaW4ub3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRzLCBvcHRzKVxuICAgIH1cblxuICAgIGlmIChvcHRzLnNlcnZlclVybCB8fCBvcHRzLnNlcnZlclBhdHRlcm4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYHNlcnZlclVybGAgYW5kIGBzZXJ2ZXJQYXR0ZXJuYCBoYXZlIGJlZW4gcmVuYW1lZCB0byBgY29tcGFuaW9uVXJsYCBhbmQgYGNvbXBhbmlvbkFsbG93ZWRIb3N0c2AgcmVzcGVjdGl2ZWx5IGluIHRoZSAwLjMwLjUgcmVsZWFzZS4gUGxlYXNlIGNvbnN1bHQgdGhlIGRvY3MgKGZvciBleGFtcGxlLCBodHRwczovL3VwcHkuaW8vZG9jcy9pbnN0YWdyYW0vIGZvciB0aGUgSW5zdGFncmFtIHBsdWdpbikgYW5kIHVzZSB0aGUgdXBkYXRlZCBvcHRpb25zLmAnKVxuICAgIH1cblxuICAgIGlmIChvcHRzLmNvbXBhbmlvbkFsbG93ZWRIb3N0cykge1xuICAgICAgY29uc3QgcGF0dGVybiA9IG9wdHMuY29tcGFuaW9uQWxsb3dlZEhvc3RzXG4gICAgICAvLyB2YWxpZGF0ZSBjb21wYW5pb25BbGxvd2VkSG9zdHMgcGFyYW1cbiAgICAgIGlmICh0eXBlb2YgcGF0dGVybiAhPT0gJ3N0cmluZycgJiYgIUFycmF5LmlzQXJyYXkocGF0dGVybikgJiYgIShwYXR0ZXJuIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3BsdWdpbi5pZH06IHRoZSBvcHRpb24gXCJjb21wYW5pb25BbGxvd2VkSG9zdHNcIiBtdXN0IGJlIG9uZSBvZiBzdHJpbmcsIEFycmF5LCBSZWdFeHBgKVxuICAgICAgfVxuICAgICAgcGx1Z2luLm9wdHMuY29tcGFuaW9uQWxsb3dlZEhvc3RzID0gcGF0dGVyblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkb2VzIG5vdCBzdGFydCB3aXRoIGh0dHBzOi8vXG4gICAgICBpZiAoL14oPyFodHRwcz86XFwvXFwvKS4qJC9pLnRlc3Qob3B0cy5jb21wYW5pb25VcmwpKSB7XG4gICAgICAgIHBsdWdpbi5vcHRzLmNvbXBhbmlvbkFsbG93ZWRIb3N0cyA9IGBodHRwczovLyR7b3B0cy5jb21wYW5pb25VcmwucmVwbGFjZSgvXlxcL1xcLy8sICcnKX1gXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbHVnaW4ub3B0cy5jb21wYW5pb25BbGxvd2VkSG9zdHMgPSBvcHRzLmNvbXBhbmlvblVybFxuICAgICAgfVxuICAgIH1cblxuICAgIHBsdWdpbi5zdG9yYWdlID0gcGx1Z2luLm9wdHMuc3RvcmFnZSB8fCB0b2tlblN0b3JhZ2VcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IEF1dGhFcnJvciA9IHJlcXVpcmUoJy4vQXV0aEVycm9yJylcblxuLy8gUmVtb3ZlIHRoZSB0cmFpbGluZyBzbGFzaCBzbyB3ZSBjYW4gYWx3YXlzIHNhZmVseSBhcHBlbmQgL3h5ei5cbmZ1bmN0aW9uIHN0cmlwU2xhc2ggKHVybCkge1xuICByZXR1cm4gdXJsLnJlcGxhY2UoL1xcLyQvLCAnJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXF1ZXN0Q2xpZW50IHtcbiAgY29uc3RydWN0b3IgKHVwcHksIG9wdHMpIHtcbiAgICB0aGlzLnVwcHkgPSB1cHB5XG4gICAgdGhpcy5vcHRzID0gb3B0c1xuICAgIHRoaXMub25SZWNlaXZlUmVzcG9uc2UgPSB0aGlzLm9uUmVjZWl2ZVJlc3BvbnNlLmJpbmQodGhpcylcbiAgfVxuXG4gIGdldCBob3N0bmFtZSAoKSB7XG4gICAgY29uc3QgeyBjb21wYW5pb24gfSA9IHRoaXMudXBweS5nZXRTdGF0ZSgpXG4gICAgY29uc3QgaG9zdCA9IHRoaXMub3B0cy5jb21wYW5pb25VcmxcbiAgICByZXR1cm4gc3RyaXBTbGFzaChjb21wYW5pb24gJiYgY29tcGFuaW9uW2hvc3RdID8gY29tcGFuaW9uW2hvc3RdIDogaG9zdClcbiAgfVxuXG4gIGdldCBkZWZhdWx0SGVhZGVycyAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfVxuICB9XG5cbiAgaGVhZGVycyAoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3QuYXNzaWduKHt9LCB0aGlzLmRlZmF1bHRIZWFkZXJzLCB0aGlzLm9wdHMuc2VydmVySGVhZGVycyB8fCB7fSkpXG4gIH1cblxuICBfZ2V0UG9zdFJlc3BvbnNlRnVuYyAoc2tpcCkge1xuICAgIHJldHVybiAocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmICghc2tpcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vblJlY2VpdmVSZXNwb25zZShyZXNwb25zZSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgfVxuICB9XG5cbiAgb25SZWNlaXZlUmVzcG9uc2UgKHJlc3BvbnNlKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnVwcHkuZ2V0U3RhdGUoKVxuICAgIGNvbnN0IGNvbXBhbmlvbiA9IHN0YXRlLmNvbXBhbmlvbiB8fCB7fVxuICAgIGNvbnN0IGhvc3QgPSB0aGlzLm9wdHMuY29tcGFuaW9uVXJsXG4gICAgY29uc3QgaGVhZGVycyA9IHJlc3BvbnNlLmhlYWRlcnNcbiAgICAvLyBTdG9yZSB0aGUgc2VsZi1pZGVudGlmaWVkIGRvbWFpbiBuYW1lIGZvciB0aGUgQ29tcGFuaW9uIGluc3RhbmNlIHdlIGp1c3QgaGl0LlxuICAgIGlmIChoZWFkZXJzLmhhcygnaS1hbScpICYmIGhlYWRlcnMuZ2V0KCdpLWFtJykgIT09IGNvbXBhbmlvbltob3N0XSkge1xuICAgICAgdGhpcy51cHB5LnNldFN0YXRlKHtcbiAgICAgICAgY29tcGFuaW9uOiBPYmplY3QuYXNzaWduKHt9LCBjb21wYW5pb24sIHtcbiAgICAgICAgICBbaG9zdF06IGhlYWRlcnMuZ2V0KCdpLWFtJylcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgX2dldFVybCAodXJsKSB7XG4gICAgaWYgKC9eKGh0dHBzPzp8KVxcL1xcLy8udGVzdCh1cmwpKSB7XG4gICAgICByZXR1cm4gdXJsXG4gICAgfVxuICAgIHJldHVybiBgJHt0aGlzLmhvc3RuYW1lfS8ke3VybH1gXG4gIH1cblxuICBfanNvbiAocmVzKSB7XG4gICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgdGhyb3cgbmV3IEF1dGhFcnJvcigpXG4gICAgfVxuXG4gICAgaWYgKHJlcy5zdGF0dXMgPCAyMDAgfHwgcmVzLnN0YXR1cyA+IDMwMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgcmVxdWVzdCB0byAke3Jlcy51cmx9LiAke3Jlcy5zdGF0dXNUZXh0fWApXG4gICAgfVxuICAgIHJldHVybiByZXMuanNvbigpXG4gIH1cblxuICBnZXQgKHBhdGgsIHNraXBQb3N0UmVzcG9uc2UpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5oZWFkZXJzKCkudGhlbigoaGVhZGVycykgPT4ge1xuICAgICAgICBmZXRjaCh0aGlzLl9nZXRVcmwocGF0aCksIHtcbiAgICAgICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbidcbiAgICAgICAgfSlcbiAgICAgICAgICAudGhlbih0aGlzLl9nZXRQb3N0UmVzcG9uc2VGdW5jKHNraXBQb3N0UmVzcG9uc2UpKVxuICAgICAgICAgIC50aGVuKChyZXMpID0+IHRoaXMuX2pzb24ocmVzKS50aGVuKHJlc29sdmUpKVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBlcnIgPSBlcnIuaXNBdXRoRXJyb3IgPyBlcnIgOiBuZXcgRXJyb3IoYENvdWxkIG5vdCBnZXQgJHt0aGlzLl9nZXRVcmwocGF0aCl9LiAke2Vycn1gKVxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgcG9zdCAocGF0aCwgZGF0YSwgc2tpcFBvc3RSZXNwb25zZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmhlYWRlcnMoKS50aGVuKChoZWFkZXJzKSA9PiB7XG4gICAgICAgIGZldGNoKHRoaXMuX2dldFVybChwYXRoKSwge1xuICAgICAgICAgIG1ldGhvZDogJ3Bvc3QnLFxuICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICAgICAgfSlcbiAgICAgICAgICAudGhlbih0aGlzLl9nZXRQb3N0UmVzcG9uc2VGdW5jKHNraXBQb3N0UmVzcG9uc2UpKVxuICAgICAgICAgIC50aGVuKChyZXMpID0+IHRoaXMuX2pzb24ocmVzKS50aGVuKHJlc29sdmUpKVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBlcnIgPSBlcnIuaXNBdXRoRXJyb3IgPyBlcnIgOiBuZXcgRXJyb3IoYENvdWxkIG5vdCBwb3N0ICR7dGhpcy5fZ2V0VXJsKHBhdGgpfS4gJHtlcnJ9YClcbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGRlbGV0ZSAocGF0aCwgZGF0YSwgc2tpcFBvc3RSZXNwb25zZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmhlYWRlcnMoKS50aGVuKChoZWFkZXJzKSA9PiB7XG4gICAgICAgIGZldGNoKGAke3RoaXMuaG9zdG5hbWV9LyR7cGF0aH1gLCB7XG4gICAgICAgICAgbWV0aG9kOiAnZGVsZXRlJyxcbiAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgIGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLFxuICAgICAgICAgIGJvZHk6IGRhdGEgPyBKU09OLnN0cmluZ2lmeShkYXRhKSA6IG51bGxcbiAgICAgICAgfSlcbiAgICAgICAgICAudGhlbih0aGlzLl9nZXRQb3N0UmVzcG9uc2VGdW5jKHNraXBQb3N0UmVzcG9uc2UpKVxuICAgICAgICAgIC50aGVuKChyZXMpID0+IHRoaXMuX2pzb24ocmVzKS50aGVuKHJlc29sdmUpKVxuICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBlcnIgPSBlcnIuaXNBdXRoRXJyb3IgPyBlcnIgOiBuZXcgRXJyb3IoYENvdWxkIG5vdCBkZWxldGUgJHt0aGlzLl9nZXRVcmwocGF0aCl9LiAke2Vycn1gKVxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG4iLCJjb25zdCBlZSA9IHJlcXVpcmUoJ25hbWVzcGFjZS1lbWl0dGVyJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBVcHB5U29ja2V0IHtcbiAgY29uc3RydWN0b3IgKG9wdHMpIHtcbiAgICB0aGlzLnF1ZXVlZCA9IFtdXG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZVxuICAgIHRoaXMuc29ja2V0ID0gbmV3IFdlYlNvY2tldChvcHRzLnRhcmdldClcbiAgICB0aGlzLmVtaXR0ZXIgPSBlZSgpXG5cbiAgICB0aGlzLnNvY2tldC5vbm9wZW4gPSAoZSkgPT4ge1xuICAgICAgdGhpcy5pc09wZW4gPSB0cnVlXG5cbiAgICAgIHdoaWxlICh0aGlzLnF1ZXVlZC5sZW5ndGggPiAwICYmIHRoaXMuaXNPcGVuKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gdGhpcy5xdWV1ZWRbMF1cbiAgICAgICAgdGhpcy5zZW5kKGZpcnN0LmFjdGlvbiwgZmlyc3QucGF5bG9hZClcbiAgICAgICAgdGhpcy5xdWV1ZWQgPSB0aGlzLnF1ZXVlZC5zbGljZSgxKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSAoZSkgPT4ge1xuICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuX2hhbmRsZU1lc3NhZ2UgPSB0aGlzLl9oYW5kbGVNZXNzYWdlLmJpbmQodGhpcylcblxuICAgIHRoaXMuc29ja2V0Lm9ubWVzc2FnZSA9IHRoaXMuX2hhbmRsZU1lc3NhZ2VcblxuICAgIHRoaXMuY2xvc2UgPSB0aGlzLmNsb3NlLmJpbmQodGhpcylcbiAgICB0aGlzLmVtaXQgPSB0aGlzLmVtaXQuYmluZCh0aGlzKVxuICAgIHRoaXMub24gPSB0aGlzLm9uLmJpbmQodGhpcylcbiAgICB0aGlzLm9uY2UgPSB0aGlzLm9uY2UuYmluZCh0aGlzKVxuICAgIHRoaXMuc2VuZCA9IHRoaXMuc2VuZC5iaW5kKHRoaXMpXG4gIH1cblxuICBjbG9zZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0LmNsb3NlKClcbiAgfVxuXG4gIHNlbmQgKGFjdGlvbiwgcGF5bG9hZCkge1xuICAgIC8vIGF0dGFjaCB1dWlkXG5cbiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICB0aGlzLnF1ZXVlZC5wdXNoKHthY3Rpb24sIHBheWxvYWR9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICBhY3Rpb24sXG4gICAgICBwYXlsb2FkXG4gICAgfSkpXG4gIH1cblxuICBvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgdGhpcy5lbWl0dGVyLm9uKGFjdGlvbiwgaGFuZGxlcilcbiAgfVxuXG4gIGVtaXQgKGFjdGlvbiwgcGF5bG9hZCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KGFjdGlvbiwgcGF5bG9hZClcbiAgfVxuXG4gIG9uY2UgKGFjdGlvbiwgaGFuZGxlcikge1xuICAgIHRoaXMuZW1pdHRlci5vbmNlKGFjdGlvbiwgaGFuZGxlcilcbiAgfVxuXG4gIF9oYW5kbGVNZXNzYWdlIChlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGUuZGF0YSlcbiAgICAgIHRoaXMuZW1pdChtZXNzYWdlLmFjdGlvbiwgbWVzc2FnZS5wYXlsb2FkKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZS1zdHJpY3QnXG4vKipcbiAqIE1hbmFnZXMgY29tbXVuaWNhdGlvbnMgd2l0aCBDb21wYW5pb25cbiAqL1xuXG5jb25zdCBSZXF1ZXN0Q2xpZW50ID0gcmVxdWlyZSgnLi9SZXF1ZXN0Q2xpZW50JylcbmNvbnN0IFByb3ZpZGVyID0gcmVxdWlyZSgnLi9Qcm92aWRlcicpXG5jb25zdCBTb2NrZXQgPSByZXF1aXJlKCcuL1NvY2tldCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBSZXF1ZXN0Q2xpZW50LFxuICBQcm92aWRlcixcbiAgU29ja2V0XG59XG4iLCIndXNlIHN0cmljdCdcbi8qKlxuICogVGhpcyBtb2R1bGUgc2VydmVzIGFzIGFuIEFzeW5jIHdyYXBwZXIgZm9yIExvY2FsU3RvcmFnZVxuICovXG5tb2R1bGUuZXhwb3J0cy5zZXRJdGVtID0gKGtleSwgdmFsdWUpID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCB2YWx1ZSlcbiAgICByZXNvbHZlKClcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMuZ2V0SXRlbSA9IChrZXkpID0+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKVxufVxuXG5tb2R1bGUuZXhwb3J0cy5yZW1vdmVJdGVtID0gKGtleSkgPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpXG4gICAgcmVzb2x2ZSgpXG4gIH0pXG59XG4iLCJjb25zdCBwcmVhY3QgPSByZXF1aXJlKCdwcmVhY3QnKVxuY29uc3QgZmluZERPTUVsZW1lbnQgPSByZXF1aXJlKCdAdXBweS91dGlscy9saWIvZmluZERPTUVsZW1lbnQnKVxuXG4vKipcbiAqIERlZmVyIGEgZnJlcXVlbnQgY2FsbCB0byB0aGUgbWljcm90YXNrIHF1ZXVlLlxuICovXG5mdW5jdGlvbiBkZWJvdW5jZSAoZm4pIHtcbiAgbGV0IGNhbGxpbmcgPSBudWxsXG4gIGxldCBsYXRlc3RBcmdzID0gbnVsbFxuICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICBsYXRlc3RBcmdzID0gYXJnc1xuICAgIGlmICghY2FsbGluZykge1xuICAgICAgY2FsbGluZyA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjYWxsaW5nID0gbnVsbFxuICAgICAgICAvLyBBdCB0aGlzIHBvaW50IGBhcmdzYCBtYXkgYmUgZGlmZmVyZW50IGZyb20gdGhlIG1vc3RcbiAgICAgICAgLy8gcmVjZW50IHN0YXRlLCBpZiBtdWx0aXBsZSBjYWxscyBoYXBwZW5lZCBzaW5jZSB0aGlzIHRhc2tcbiAgICAgICAgLy8gd2FzIHF1ZXVlZC4gU28gd2UgdXNlIHRoZSBgbGF0ZXN0QXJnc2AsIHdoaWNoIGRlZmluaXRlbHlcbiAgICAgICAgLy8gaXMgdGhlIG1vc3QgcmVjZW50IGNhbGwuXG4gICAgICAgIHJldHVybiBmbiguLi5sYXRlc3RBcmdzKVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxpbmdcbiAgfVxufVxuXG4vKipcbiAqIEJvaWxlcnBsYXRlIHRoYXQgYWxsIFBsdWdpbnMgc2hhcmUgLSBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiBkaXJlY3RseS4gSXQgYWxzbyBzaG93cyB3aGljaCBtZXRob2RzIGZpbmFsIHBsdWdpbnMgc2hvdWxkIGltcGxlbWVudC9vdmVycmlkZSxcbiAqIHRoaXMgZGVjaWRpbmcgb24gc3RydWN0dXJlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBtYWluIFVwcHkgY29yZSBvYmplY3RcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3Qgd2l0aCBwbHVnaW4gb3B0aW9uc1xuICogQHJldHVybiB7YXJyYXkgfCBzdHJpbmd9IGZpbGVzIG9yIHN1Y2Nlc3MvZmFpbCBtZXNzYWdlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGx1Z2luIHtcbiAgY29uc3RydWN0b3IgKHVwcHksIG9wdHMpIHtcbiAgICB0aGlzLnVwcHkgPSB1cHB5XG4gICAgdGhpcy5vcHRzID0gb3B0cyB8fCB7fVxuXG4gICAgdGhpcy51cGRhdGUgPSB0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5tb3VudCA9IHRoaXMubW91bnQuYmluZCh0aGlzKVxuICAgIHRoaXMuaW5zdGFsbCA9IHRoaXMuaW5zdGFsbC5iaW5kKHRoaXMpXG4gICAgdGhpcy51bmluc3RhbGwgPSB0aGlzLnVuaW5zdGFsbC5iaW5kKHRoaXMpXG4gIH1cblxuICBnZXRQbHVnaW5TdGF0ZSAoKSB7XG4gICAgY29uc3QgeyBwbHVnaW5zIH0gPSB0aGlzLnVwcHkuZ2V0U3RhdGUoKVxuICAgIHJldHVybiBwbHVnaW5zW3RoaXMuaWRdIHx8IHt9XG4gIH1cblxuICBzZXRQbHVnaW5TdGF0ZSAodXBkYXRlKSB7XG4gICAgY29uc3QgeyBwbHVnaW5zIH0gPSB0aGlzLnVwcHkuZ2V0U3RhdGUoKVxuXG4gICAgdGhpcy51cHB5LnNldFN0YXRlKHtcbiAgICAgIHBsdWdpbnM6IHtcbiAgICAgICAgLi4ucGx1Z2lucyxcbiAgICAgICAgW3RoaXMuaWRdOiB7XG4gICAgICAgICAgLi4ucGx1Z2luc1t0aGlzLmlkXSxcbiAgICAgICAgICAuLi51cGRhdGVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICB1cGRhdGUgKHN0YXRlKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmVsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3VwZGF0ZVVJKSB7XG4gICAgICB0aGlzLl91cGRhdGVVSShzdGF0ZSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBDYWxsZWQgd2hlbiBwbHVnaW4gaXMgbW91bnRlZCwgd2hldGhlciBpbiBET00gb3IgaW50byBhbm90aGVyIHBsdWdpbi5cbiAgKiBOZWVkZWQgYmVjYXVzZSBzb21ldGltZXMgcGx1Z2lucyBhcmUgbW91bnRlZCBzZXBhcmF0ZWx5L2FmdGVyIGBpbnN0YWxsYCxcbiAgKiBzbyB0aGlzLmVsIGFuZCB0aGlzLnBhcmVudCBtaWdodCBub3QgYmUgYXZhaWxhYmxlIGluIGBpbnN0YWxsYC5cbiAgKiBUaGlzIGlzIHRoZSBjYXNlIHdpdGggQHVwcHkvcmVhY3QgcGx1Z2lucywgZm9yIGV4YW1wbGUuXG4gICovXG4gIG9uTW91bnQgKCkge1xuXG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgc3VwcGxpZWQgYHRhcmdldGAgaXMgYSBET00gZWxlbWVudCBvciBhbiBgb2JqZWN0YC5cbiAgICogSWYgaXTigJlzIGFuIG9iamVjdCDigJQgdGFyZ2V0IGlzIGEgcGx1Z2luLCBhbmQgd2Ugc2VhcmNoIGBwbHVnaW5zYFxuICAgKiBmb3IgYSBwbHVnaW4gd2l0aCBzYW1lIG5hbWUgYW5kIHJldHVybiBpdHMgdGFyZ2V0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHRhcmdldFxuICAgKlxuICAgKi9cbiAgbW91bnQgKHRhcmdldCwgcGx1Z2luKSB7XG4gICAgY29uc3QgY2FsbGVyUGx1Z2luTmFtZSA9IHBsdWdpbi5pZFxuXG4gICAgY29uc3QgdGFyZ2V0RWxlbWVudCA9IGZpbmRET01FbGVtZW50KHRhcmdldClcblxuICAgIGlmICh0YXJnZXRFbGVtZW50KSB7XG4gICAgICB0aGlzLmlzVGFyZ2V0RE9NRWwgPSB0cnVlXG5cbiAgICAgIC8vIEFQSSBmb3IgcGx1Z2lucyB0aGF0IHJlcXVpcmUgYSBzeW5jaHJvbm91cyByZXJlbmRlci5cbiAgICAgIHRoaXMucmVyZW5kZXIgPSAoc3RhdGUpID0+IHtcbiAgICAgICAgLy8gcGx1Z2luIGNvdWxkIGJlIHJlbW92ZWQsIGJ1dCB0aGlzLnJlcmVuZGVyIGlzIGRlYm91bmNlZCBiZWxvdyxcbiAgICAgICAgLy8gc28gaXQgY291bGQgc3RpbGwgYmUgY2FsbGVkIGV2ZW4gYWZ0ZXIgdXBweS5yZW1vdmVQbHVnaW4gb3IgdXBweS5jbG9zZVxuICAgICAgICAvLyBoZW5jZSB0aGUgY2hlY2tcbiAgICAgICAgaWYgKCF0aGlzLnVwcHkuZ2V0UGx1Z2luKHRoaXMuaWQpKSByZXR1cm5cbiAgICAgICAgdGhpcy5lbCA9IHByZWFjdC5yZW5kZXIodGhpcy5yZW5kZXIoc3RhdGUpLCB0YXJnZXRFbGVtZW50LCB0aGlzLmVsKVxuICAgICAgfVxuICAgICAgdGhpcy5fdXBkYXRlVUkgPSBkZWJvdW5jZSh0aGlzLnJlcmVuZGVyKVxuXG4gICAgICB0aGlzLnVwcHkubG9nKGBJbnN0YWxsaW5nICR7Y2FsbGVyUGx1Z2luTmFtZX0gdG8gYSBET00gZWxlbWVudGApXG5cbiAgICAgIC8vIGNsZWFyIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSB0YXJnZXQgY29udGFpbmVyXG4gICAgICBpZiAodGhpcy5vcHRzLnJlcGxhY2VUYXJnZXRDb250ZW50KSB7XG4gICAgICAgIHRhcmdldEVsZW1lbnQuaW5uZXJIVE1MID0gJydcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbCA9IHByZWFjdC5yZW5kZXIodGhpcy5yZW5kZXIodGhpcy51cHB5LmdldFN0YXRlKCkpLCB0YXJnZXRFbGVtZW50KVxuXG4gICAgICB0aGlzLm9uTW91bnQoKVxuICAgICAgcmV0dXJuIHRoaXMuZWxcbiAgICB9XG5cbiAgICBsZXQgdGFyZ2V0UGx1Z2luXG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICdvYmplY3QnICYmIHRhcmdldCBpbnN0YW5jZW9mIFBsdWdpbikge1xuICAgICAgLy8gVGFyZ2V0aW5nIGEgcGx1Z2luICppbnN0YW5jZSpcbiAgICAgIHRhcmdldFBsdWdpbiA9IHRhcmdldFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gVGFyZ2V0aW5nIGEgcGx1Z2luIHR5cGVcbiAgICAgIGNvbnN0IFRhcmdldCA9IHRhcmdldFxuICAgICAgLy8gRmluZCB0aGUgdGFyZ2V0IHBsdWdpbiBpbnN0YW5jZS5cbiAgICAgIHRoaXMudXBweS5pdGVyYXRlUGx1Z2lucygocGx1Z2luKSA9PiB7XG4gICAgICAgIGlmIChwbHVnaW4gaW5zdGFuY2VvZiBUYXJnZXQpIHtcbiAgICAgICAgICB0YXJnZXRQbHVnaW4gPSBwbHVnaW5cbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0UGx1Z2luKSB7XG4gICAgICB0aGlzLnVwcHkubG9nKGBJbnN0YWxsaW5nICR7Y2FsbGVyUGx1Z2luTmFtZX0gdG8gJHt0YXJnZXRQbHVnaW4uaWR9YClcbiAgICAgIHRoaXMucGFyZW50ID0gdGFyZ2V0UGx1Z2luXG4gICAgICB0aGlzLmVsID0gdGFyZ2V0UGx1Z2luLmFkZFRhcmdldChwbHVnaW4pXG5cbiAgICAgIHRoaXMub25Nb3VudCgpXG4gICAgICByZXR1cm4gdGhpcy5lbFxuICAgIH1cblxuICAgIHRoaXMudXBweS5sb2coYE5vdCBpbnN0YWxsaW5nICR7Y2FsbGVyUGx1Z2luTmFtZX1gKVxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB0YXJnZXQgb3B0aW9uIGdpdmVuIHRvICR7Y2FsbGVyUGx1Z2luTmFtZX0uIFBsZWFzZSBtYWtlIHN1cmUgdGhhdCB0aGUgZWxlbWVudCBcbiAgICAgIGV4aXN0cyBvbiB0aGUgcGFnZSwgb3IgdGhhdCB0aGUgcGx1Z2luIHlvdSBhcmUgdGFyZ2V0aW5nIGhhcyBiZWVuIGluc3RhbGxlZC4gQ2hlY2sgdGhhdCB0aGUgPHNjcmlwdD4gdGFnIGluaXRpYWxpemluZyBVcHB5IFxuICAgICAgY29tZXMgYXQgdGhlIGJvdHRvbSBvZiB0aGUgcGFnZSwgYmVmb3JlIHRoZSBjbG9zaW5nIDwvYm9keT4gdGFnIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3RyYW5zbG9hZGl0L3VwcHkvaXNzdWVzLzEwNDIpLmApXG4gIH1cblxuICByZW5kZXIgKHN0YXRlKSB7XG4gICAgdGhyb3cgKG5ldyBFcnJvcignRXh0ZW5kIHRoZSByZW5kZXIgbWV0aG9kIHRvIGFkZCB5b3VyIHBsdWdpbiB0byBhIERPTSBlbGVtZW50JykpXG4gIH1cblxuICBhZGRUYXJnZXQgKHBsdWdpbikge1xuICAgIHRocm93IChuZXcgRXJyb3IoJ0V4dGVuZCB0aGUgYWRkVGFyZ2V0IG1ldGhvZCB0byBhZGQgeW91ciBwbHVnaW4gdG8gYW5vdGhlciBwbHVnaW5cXCdzIHRhcmdldCcpKVxuICB9XG5cbiAgdW5tb3VudCAoKSB7XG4gICAgaWYgKHRoaXMuaXNUYXJnZXRET01FbCAmJiB0aGlzLmVsICYmIHRoaXMuZWwucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5lbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWwpXG4gICAgfVxuICB9XG5cbiAgaW5zdGFsbCAoKSB7XG5cbiAgfVxuXG4gIHVuaW5zdGFsbCAoKSB7XG4gICAgdGhpcy51bm1vdW50KClcbiAgfVxufVxuIiwiY29uc3QgVHJhbnNsYXRvciA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9UcmFuc2xhdG9yJylcbmNvbnN0IGVlID0gcmVxdWlyZSgnbmFtZXNwYWNlLWVtaXR0ZXInKVxuY29uc3QgY3VpZCA9IHJlcXVpcmUoJ2N1aWQnKVxuLy8gY29uc3QgdGhyb3R0bGUgPSByZXF1aXJlKCdsb2Rhc2gudGhyb3R0bGUnKVxuY29uc3QgcHJldHR5Qnl0ZXMgPSByZXF1aXJlKCdwcmV0dGllci1ieXRlcycpXG5jb25zdCBtYXRjaCA9IHJlcXVpcmUoJ21pbWUtbWF0Y2gnKVxuY29uc3QgRGVmYXVsdFN0b3JlID0gcmVxdWlyZSgnQHVwcHkvc3RvcmUtZGVmYXVsdCcpXG5jb25zdCBnZXRGaWxlVHlwZSA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZXRGaWxlVHlwZScpXG5jb25zdCBnZXRGaWxlTmFtZUFuZEV4dGVuc2lvbiA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZXRGaWxlTmFtZUFuZEV4dGVuc2lvbicpXG5jb25zdCBnZW5lcmF0ZUZpbGVJRCA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZW5lcmF0ZUZpbGVJRCcpXG5jb25zdCBnZXRUaW1lU3RhbXAgPSByZXF1aXJlKCdAdXBweS91dGlscy9saWIvZ2V0VGltZVN0YW1wJylcbmNvbnN0IHN1cHBvcnRzVXBsb2FkUHJvZ3Jlc3MgPSByZXF1aXJlKCcuL3N1cHBvcnRzVXBsb2FkUHJvZ3Jlc3MnKVxuY29uc3QgUGx1Z2luID0gcmVxdWlyZSgnLi9QbHVnaW4nKSAvLyBFeHBvcnRlZCBmcm9tIGhlcmUuXG5cbi8qKlxuICogVXBweSBDb3JlIG1vZHVsZS5cbiAqIE1hbmFnZXMgcGx1Z2lucywgc3RhdGUgdXBkYXRlcywgYWN0cyBhcyBhbiBldmVudCBidXMsXG4gKiBhZGRzL3JlbW92ZXMgZmlsZXMgYW5kIG1ldGFkYXRhLlxuICovXG5jbGFzcyBVcHB5IHtcbiAgLyoqXG4gICogSW5zdGFudGlhdGUgVXBweVxuICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIOKAlCBVcHB5IG9wdGlvbnNcbiAgKi9cbiAgY29uc3RydWN0b3IgKG9wdHMpIHtcbiAgICB0aGlzLmRlZmF1bHRMb2NhbGUgPSB7XG4gICAgICBzdHJpbmdzOiB7XG4gICAgICAgIHlvdUNhbk9ubHlVcGxvYWRYOiB7XG4gICAgICAgICAgMDogJ1lvdSBjYW4gb25seSB1cGxvYWQgJXtzbWFydF9jb3VudH0gZmlsZScsXG4gICAgICAgICAgMTogJ1lvdSBjYW4gb25seSB1cGxvYWQgJXtzbWFydF9jb3VudH0gZmlsZXMnLFxuICAgICAgICAgIDI6ICdZb3UgY2FuIG9ubHkgdXBsb2FkICV7c21hcnRfY291bnR9IGZpbGVzJ1xuICAgICAgICB9LFxuICAgICAgICB5b3VIYXZlVG9BdExlYXN0U2VsZWN0WDoge1xuICAgICAgICAgIDA6ICdZb3UgaGF2ZSB0byBzZWxlY3QgYXQgbGVhc3QgJXtzbWFydF9jb3VudH0gZmlsZScsXG4gICAgICAgICAgMTogJ1lvdSBoYXZlIHRvIHNlbGVjdCBhdCBsZWFzdCAle3NtYXJ0X2NvdW50fSBmaWxlcycsXG4gICAgICAgICAgMjogJ1lvdSBoYXZlIHRvIHNlbGVjdCBhdCBsZWFzdCAle3NtYXJ0X2NvdW50fSBmaWxlcydcbiAgICAgICAgfSxcbiAgICAgICAgZXhjZWVkc1NpemU6ICdUaGlzIGZpbGUgZXhjZWVkcyBtYXhpbXVtIGFsbG93ZWQgc2l6ZSBvZicsXG4gICAgICAgIHlvdUNhbk9ubHlVcGxvYWRGaWxlVHlwZXM6ICdZb3UgY2FuIG9ubHkgdXBsb2FkOiAle3R5cGVzfScsXG4gICAgICAgIGNvbXBhbmlvbkVycm9yOiAnQ29ubmVjdGlvbiB3aXRoIENvbXBhbmlvbiBmYWlsZWQnLFxuICAgICAgICBjb21wYW5pb25BdXRoRXJyb3I6ICdBdXRob3JpemF0aW9uIHJlcXVpcmVkJyxcbiAgICAgICAgZmFpbGVkVG9VcGxvYWQ6ICdGYWlsZWQgdG8gdXBsb2FkICV7ZmlsZX0nLFxuICAgICAgICBub0ludGVybmV0Q29ubmVjdGlvbjogJ05vIEludGVybmV0IGNvbm5lY3Rpb24nLFxuICAgICAgICBjb25uZWN0ZWRUb0ludGVybmV0OiAnQ29ubmVjdGVkIHRvIHRoZSBJbnRlcm5ldCcsXG4gICAgICAgIC8vIFN0cmluZ3MgZm9yIHJlbW90ZSBwcm92aWRlcnNcbiAgICAgICAgbm9GaWxlc0ZvdW5kOiAnWW91IGhhdmUgbm8gZmlsZXMgb3IgZm9sZGVycyBoZXJlJyxcbiAgICAgICAgc2VsZWN0WEZpbGVzOiB7XG4gICAgICAgICAgMDogJ1NlbGVjdCAle3NtYXJ0X2NvdW50fSBmaWxlJyxcbiAgICAgICAgICAxOiAnU2VsZWN0ICV7c21hcnRfY291bnR9IGZpbGVzJyxcbiAgICAgICAgICAyOiAnU2VsZWN0ICV7c21hcnRfY291bnR9IGZpbGVzJ1xuICAgICAgICB9LFxuICAgICAgICBjYW5jZWw6ICdDYW5jZWwnLFxuICAgICAgICBsb2dPdXQ6ICdMb2cgb3V0JyxcbiAgICAgICAgZmlsdGVyOiAnRmlsdGVyJyxcbiAgICAgICAgcmVzZXRGaWx0ZXI6ICdSZXNldCBmaWx0ZXInLFxuICAgICAgICBsb2FkaW5nOiAnTG9hZGluZy4uLicsXG4gICAgICAgIGF1dGhlbnRpY2F0ZVdpdGhUaXRsZTogJ1BsZWFzZSBhdXRoZW50aWNhdGUgd2l0aCAle3BsdWdpbk5hbWV9IHRvIHNlbGVjdCBmaWxlcycsXG4gICAgICAgIGF1dGhlbnRpY2F0ZVdpdGg6ICdDb25uZWN0IHRvICV7cGx1Z2luTmFtZX0nXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgaWQ6ICd1cHB5JyxcbiAgICAgIGF1dG9Qcm9jZWVkOiBmYWxzZSxcbiAgICAgIGFsbG93TXVsdGlwbGVVcGxvYWRzOiB0cnVlLFxuICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgcmVzdHJpY3Rpb25zOiB7XG4gICAgICAgIG1heEZpbGVTaXplOiBudWxsLFxuICAgICAgICBtYXhOdW1iZXJPZkZpbGVzOiBudWxsLFxuICAgICAgICBtaW5OdW1iZXJPZkZpbGVzOiBudWxsLFxuICAgICAgICBhbGxvd2VkRmlsZVR5cGVzOiBudWxsXG4gICAgICB9LFxuICAgICAgbWV0YToge30sXG4gICAgICBvbkJlZm9yZUZpbGVBZGRlZDogKGN1cnJlbnRGaWxlLCBmaWxlcykgPT4gY3VycmVudEZpbGUsXG4gICAgICBvbkJlZm9yZVVwbG9hZDogKGZpbGVzKSA9PiBmaWxlcyxcbiAgICAgIHN0b3JlOiBEZWZhdWx0U3RvcmUoKVxuICAgIH1cblxuICAgIC8vIE1lcmdlIGRlZmF1bHQgb3B0aW9ucyB3aXRoIHRoZSBvbmVzIHNldCBieSB1c2VyXG4gICAgdGhpcy5vcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdHMpXG4gICAgdGhpcy5vcHRzLnJlc3RyaWN0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLnJlc3RyaWN0aW9ucywgdGhpcy5vcHRzLnJlc3RyaWN0aW9ucylcblxuICAgIC8vIGkxOG5cbiAgICB0aGlzLnRyYW5zbGF0b3IgPSBuZXcgVHJhbnNsYXRvcihbIHRoaXMuZGVmYXVsdExvY2FsZSwgdGhpcy5vcHRzLmxvY2FsZSBdKVxuICAgIHRoaXMubG9jYWxlID0gdGhpcy50cmFuc2xhdG9yLmxvY2FsZVxuICAgIHRoaXMuaTE4biA9IHRoaXMudHJhbnNsYXRvci50cmFuc2xhdGUuYmluZCh0aGlzLnRyYW5zbGF0b3IpXG4gICAgdGhpcy5pMThuQXJyYXkgPSB0aGlzLnRyYW5zbGF0b3IudHJhbnNsYXRlQXJyYXkuYmluZCh0aGlzLnRyYW5zbGF0b3IpXG5cbiAgICAvLyBDb250YWluZXIgZm9yIGRpZmZlcmVudCB0eXBlcyBvZiBwbHVnaW5zXG4gICAgdGhpcy5wbHVnaW5zID0ge31cblxuICAgIHRoaXMuZ2V0U3RhdGUgPSB0aGlzLmdldFN0YXRlLmJpbmQodGhpcylcbiAgICB0aGlzLmdldFBsdWdpbiA9IHRoaXMuZ2V0UGx1Z2luLmJpbmQodGhpcylcbiAgICB0aGlzLnNldEZpbGVNZXRhID0gdGhpcy5zZXRGaWxlTWV0YS5iaW5kKHRoaXMpXG4gICAgdGhpcy5zZXRGaWxlU3RhdGUgPSB0aGlzLnNldEZpbGVTdGF0ZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5sb2cgPSB0aGlzLmxvZy5iaW5kKHRoaXMpXG4gICAgdGhpcy5pbmZvID0gdGhpcy5pbmZvLmJpbmQodGhpcylcbiAgICB0aGlzLmhpZGVJbmZvID0gdGhpcy5oaWRlSW5mby5iaW5kKHRoaXMpXG4gICAgdGhpcy5hZGRGaWxlID0gdGhpcy5hZGRGaWxlLmJpbmQodGhpcylcbiAgICB0aGlzLnJlbW92ZUZpbGUgPSB0aGlzLnJlbW92ZUZpbGUuYmluZCh0aGlzKVxuICAgIHRoaXMucGF1c2VSZXN1bWUgPSB0aGlzLnBhdXNlUmVzdW1lLmJpbmQodGhpcylcbiAgICB0aGlzLl9jYWxjdWxhdGVQcm9ncmVzcyA9IHRoaXMuX2NhbGN1bGF0ZVByb2dyZXNzLmJpbmQodGhpcylcbiAgICB0aGlzLnVwZGF0ZU9ubGluZVN0YXR1cyA9IHRoaXMudXBkYXRlT25saW5lU3RhdHVzLmJpbmQodGhpcylcbiAgICB0aGlzLnJlc2V0UHJvZ3Jlc3MgPSB0aGlzLnJlc2V0UHJvZ3Jlc3MuYmluZCh0aGlzKVxuXG4gICAgdGhpcy5wYXVzZUFsbCA9IHRoaXMucGF1c2VBbGwuYmluZCh0aGlzKVxuICAgIHRoaXMucmVzdW1lQWxsID0gdGhpcy5yZXN1bWVBbGwuYmluZCh0aGlzKVxuICAgIHRoaXMucmV0cnlBbGwgPSB0aGlzLnJldHJ5QWxsLmJpbmQodGhpcylcbiAgICB0aGlzLmNhbmNlbEFsbCA9IHRoaXMuY2FuY2VsQWxsLmJpbmQodGhpcylcbiAgICB0aGlzLnJldHJ5VXBsb2FkID0gdGhpcy5yZXRyeVVwbG9hZC5iaW5kKHRoaXMpXG4gICAgdGhpcy51cGxvYWQgPSB0aGlzLnVwbG9hZC5iaW5kKHRoaXMpXG5cbiAgICB0aGlzLmVtaXR0ZXIgPSBlZSgpXG4gICAgdGhpcy5vbiA9IHRoaXMub24uYmluZCh0aGlzKVxuICAgIHRoaXMub2ZmID0gdGhpcy5vZmYuYmluZCh0aGlzKVxuICAgIHRoaXMub25jZSA9IHRoaXMuZW1pdHRlci5vbmNlLmJpbmQodGhpcy5lbWl0dGVyKVxuICAgIHRoaXMuZW1pdCA9IHRoaXMuZW1pdHRlci5lbWl0LmJpbmQodGhpcy5lbWl0dGVyKVxuXG4gICAgdGhpcy5wcmVQcm9jZXNzb3JzID0gW11cbiAgICB0aGlzLnVwbG9hZGVycyA9IFtdXG4gICAgdGhpcy5wb3N0UHJvY2Vzc29ycyA9IFtdXG5cbiAgICB0aGlzLnN0b3JlID0gdGhpcy5vcHRzLnN0b3JlXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBwbHVnaW5zOiB7fSxcbiAgICAgIGZpbGVzOiB7fSxcbiAgICAgIGN1cnJlbnRVcGxvYWRzOiB7fSxcbiAgICAgIGFsbG93TmV3VXBsb2FkOiB0cnVlLFxuICAgICAgY2FwYWJpbGl0aWVzOiB7XG4gICAgICAgIHVwbG9hZFByb2dyZXNzOiBzdXBwb3J0c1VwbG9hZFByb2dyZXNzKCksXG4gICAgICAgIGluZGl2aWR1YWxDYW5jZWxsYXRpb246IHRydWUsXG4gICAgICAgIHJlc3VtYWJsZVVwbG9hZHM6IGZhbHNlXG4gICAgICB9LFxuICAgICAgdG90YWxQcm9ncmVzczogMCxcbiAgICAgIG1ldGE6IHsgLi4udGhpcy5vcHRzLm1ldGEgfSxcbiAgICAgIGluZm86IHtcbiAgICAgICAgaXNIaWRkZW46IHRydWUsXG4gICAgICAgIHR5cGU6ICdpbmZvJyxcbiAgICAgICAgbWVzc2FnZTogJydcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5fc3RvcmVVbnN1YnNjcmliZSA9IHRoaXMuc3RvcmUuc3Vic2NyaWJlKChwcmV2U3RhdGUsIG5leHRTdGF0ZSwgcGF0Y2gpID0+IHtcbiAgICAgIHRoaXMuZW1pdCgnc3RhdGUtdXBkYXRlJywgcHJldlN0YXRlLCBuZXh0U3RhdGUsIHBhdGNoKVxuICAgICAgdGhpcy51cGRhdGVBbGwobmV4dFN0YXRlKVxuICAgIH0pXG5cbiAgICAvLyBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nXG4gICAgLy8gdGhpcy51cGRhdGVOdW0gPSAwXG4gICAgaWYgKHRoaXMub3B0cy5kZWJ1ZyAmJiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgd2luZG93Wyd1cHB5TG9nJ10gPSAnJ1xuICAgICAgd2luZG93W3RoaXMub3B0cy5pZF0gPSB0aGlzXG4gICAgfVxuXG4gICAgdGhpcy5fYWRkTGlzdGVuZXJzKClcbiAgfVxuXG4gIG9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICB0aGlzLmVtaXR0ZXIub24oZXZlbnQsIGNhbGxiYWNrKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBvZmYgKGV2ZW50LCBjYWxsYmFjaykge1xuICAgIHRoaXMuZW1pdHRlci5vZmYoZXZlbnQsIGNhbGxiYWNrKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogSXRlcmF0ZSBvbiBhbGwgcGx1Z2lucyBhbmQgcnVuIGB1cGRhdGVgIG9uIHRoZW0uXG4gICAqIENhbGxlZCBlYWNoIHRpbWUgc3RhdGUgY2hhbmdlcy5cbiAgICpcbiAgICovXG4gIHVwZGF0ZUFsbCAoc3RhdGUpIHtcbiAgICB0aGlzLml0ZXJhdGVQbHVnaW5zKHBsdWdpbiA9PiB7XG4gICAgICBwbHVnaW4udXBkYXRlKHN0YXRlKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBzdGF0ZSB3aXRoIGEgcGF0Y2hcbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhdGNoIHtmb286ICdiYXInfVxuICAgKi9cbiAgc2V0U3RhdGUgKHBhdGNoKSB7XG4gICAgdGhpcy5zdG9yZS5zZXRTdGF0ZShwYXRjaClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGN1cnJlbnQgc3RhdGUuXG4gICAqIEByZXR1cm4ge29iamVjdH1cbiAgICovXG4gIGdldFN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9yZS5nZXRTdGF0ZSgpXG4gIH1cblxuICAvKipcbiAgKiBCYWNrIGNvbXBhdCBmb3Igd2hlbiB1cHB5LnN0YXRlIGlzIHVzZWQgaW5zdGVhZCBvZiB1cHB5LmdldFN0YXRlKCkuXG4gICovXG4gIGdldCBzdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKVxuICB9XG5cbiAgLyoqXG4gICogU2hvcnRoYW5kIHRvIHNldCBzdGF0ZSBmb3IgYSBzcGVjaWZpYyBmaWxlLlxuICAqL1xuICBzZXRGaWxlU3RhdGUgKGZpbGVJRCwgc3RhdGUpIHtcbiAgICBpZiAoIXRoaXMuZ2V0U3RhdGUoKS5maWxlc1tmaWxlSURdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbuKAmXQgc2V0IHN0YXRlIGZvciAke2ZpbGVJRH0gKHRoZSBmaWxlIGNvdWxkIGhhdmUgYmVlbiByZW1vdmVkKWApXG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBmaWxlczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzLCB7XG4gICAgICAgIFtmaWxlSURdOiBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXNbZmlsZUlEXSwgc3RhdGUpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICByZXNldFByb2dyZXNzICgpIHtcbiAgICBjb25zdCBkZWZhdWx0UHJvZ3Jlc3MgPSB7XG4gICAgICBwZXJjZW50YWdlOiAwLFxuICAgICAgYnl0ZXNVcGxvYWRlZDogMCxcbiAgICAgIHVwbG9hZENvbXBsZXRlOiBmYWxzZSxcbiAgICAgIHVwbG9hZFN0YXJ0ZWQ6IGZhbHNlXG4gICAgfVxuICAgIGNvbnN0IGZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IHt9XG4gICAgT2JqZWN0LmtleXMoZmlsZXMpLmZvckVhY2goZmlsZUlEID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gT2JqZWN0LmFzc2lnbih7fSwgZmlsZXNbZmlsZUlEXSlcbiAgICAgIHVwZGF0ZWRGaWxlLnByb2dyZXNzID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGUucHJvZ3Jlc3MsIGRlZmF1bHRQcm9ncmVzcylcbiAgICAgIHVwZGF0ZWRGaWxlc1tmaWxlSURdID0gdXBkYXRlZEZpbGVcbiAgICB9KVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBmaWxlczogdXBkYXRlZEZpbGVzLFxuICAgICAgdG90YWxQcm9ncmVzczogMFxuICAgIH0pXG5cbiAgICAvLyBUT0RPIERvY3VtZW50IG9uIHRoZSB3ZWJzaXRlXG4gICAgdGhpcy5lbWl0KCdyZXNldC1wcm9ncmVzcycpXG4gIH1cblxuICBhZGRQcmVQcm9jZXNzb3IgKGZuKSB7XG4gICAgdGhpcy5wcmVQcm9jZXNzb3JzLnB1c2goZm4pXG4gIH1cblxuICByZW1vdmVQcmVQcm9jZXNzb3IgKGZuKSB7XG4gICAgY29uc3QgaSA9IHRoaXMucHJlUHJvY2Vzc29ycy5pbmRleE9mKGZuKVxuICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgdGhpcy5wcmVQcm9jZXNzb3JzLnNwbGljZShpLCAxKVxuICAgIH1cbiAgfVxuXG4gIGFkZFBvc3RQcm9jZXNzb3IgKGZuKSB7XG4gICAgdGhpcy5wb3N0UHJvY2Vzc29ycy5wdXNoKGZuKVxuICB9XG5cbiAgcmVtb3ZlUG9zdFByb2Nlc3NvciAoZm4pIHtcbiAgICBjb25zdCBpID0gdGhpcy5wb3N0UHJvY2Vzc29ycy5pbmRleE9mKGZuKVxuICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgdGhpcy5wb3N0UHJvY2Vzc29ycy5zcGxpY2UoaSwgMSlcbiAgICB9XG4gIH1cblxuICBhZGRVcGxvYWRlciAoZm4pIHtcbiAgICB0aGlzLnVwbG9hZGVycy5wdXNoKGZuKVxuICB9XG5cbiAgcmVtb3ZlVXBsb2FkZXIgKGZuKSB7XG4gICAgY29uc3QgaSA9IHRoaXMudXBsb2FkZXJzLmluZGV4T2YoZm4pXG4gICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICB0aGlzLnVwbG9hZGVycy5zcGxpY2UoaSwgMSlcbiAgICB9XG4gIH1cblxuICBzZXRNZXRhIChkYXRhKSB7XG4gICAgY29uc3QgdXBkYXRlZE1ldGEgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkubWV0YSwgZGF0YSlcbiAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG5cbiAgICBPYmplY3Qua2V5cyh1cGRhdGVkRmlsZXMpLmZvckVhY2goKGZpbGVJRCkgPT4ge1xuICAgICAgdXBkYXRlZEZpbGVzW2ZpbGVJRF0gPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXSwge1xuICAgICAgICBtZXRhOiBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXS5tZXRhLCBkYXRhKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5sb2coJ0FkZGluZyBtZXRhZGF0YTonKVxuICAgIHRoaXMubG9nKGRhdGEpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG1ldGE6IHVwZGF0ZWRNZXRhLFxuICAgICAgZmlsZXM6IHVwZGF0ZWRGaWxlc1xuICAgIH0pXG4gIH1cblxuICBzZXRGaWxlTWV0YSAoZmlsZUlELCBkYXRhKSB7XG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGlmICghdXBkYXRlZEZpbGVzW2ZpbGVJRF0pIHtcbiAgICAgIHRoaXMubG9nKCdXYXMgdHJ5aW5nIHRvIHNldCBtZXRhZGF0YSBmb3IgYSBmaWxlIHRoYXTigJlzIG5vdCB3aXRoIHVzIGFueW1vcmU6ICcsIGZpbGVJRClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBuZXdNZXRhID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGVzW2ZpbGVJRF0ubWV0YSwgZGF0YSlcbiAgICB1cGRhdGVkRmlsZXNbZmlsZUlEXSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlSURdLCB7XG4gICAgICBtZXRhOiBuZXdNZXRhXG4gICAgfSlcbiAgICB0aGlzLnNldFN0YXRlKHtmaWxlczogdXBkYXRlZEZpbGVzfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBmaWxlIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVJRCBUaGUgSUQgb2YgdGhlIGZpbGUgb2JqZWN0IHRvIHJldHVybi5cbiAgICovXG4gIGdldEZpbGUgKGZpbGVJRCkge1xuICAgIHJldHVybiB0aGlzLmdldFN0YXRlKCkuZmlsZXNbZmlsZUlEXVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgZmlsZXMgaW4gYW4gYXJyYXkuXG4gICAqL1xuICBnZXRGaWxlcyAoKSB7XG4gICAgY29uc3QgeyBmaWxlcyB9ID0gdGhpcy5nZXRTdGF0ZSgpXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGZpbGVzKS5tYXAoKGZpbGVJRCkgPT4gZmlsZXNbZmlsZUlEXSlcbiAgfVxuXG4gIC8qKlxuICAqIENoZWNrIGlmIG1pbk51bWJlck9mRmlsZXMgcmVzdHJpY3Rpb24gaXMgcmVhY2hlZCBiZWZvcmUgdXBsb2FkaW5nLlxuICAqXG4gICogQHByaXZhdGVcbiAgKi9cbiAgX2NoZWNrTWluTnVtYmVyT2ZGaWxlcyAoZmlsZXMpIHtcbiAgICBjb25zdCB7bWluTnVtYmVyT2ZGaWxlc30gPSB0aGlzLm9wdHMucmVzdHJpY3Rpb25zXG4gICAgaWYgKE9iamVjdC5rZXlzKGZpbGVzKS5sZW5ndGggPCBtaW5OdW1iZXJPZkZpbGVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5pMThuKCd5b3VIYXZlVG9BdExlYXN0U2VsZWN0WCcsIHsgc21hcnRfY291bnQ6IG1pbk51bWJlck9mRmlsZXMgfSl9YClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBDaGVjayBpZiBmaWxlIHBhc3NlcyBhIHNldCBvZiByZXN0cmljdGlvbnMgc2V0IGluIG9wdGlvbnM6IG1heEZpbGVTaXplLFxuICAqIG1heE51bWJlck9mRmlsZXMgYW5kIGFsbG93ZWRGaWxlVHlwZXMuXG4gICpcbiAgKiBAcGFyYW0ge29iamVjdH0gZmlsZSBvYmplY3QgdG8gY2hlY2tcbiAgKiBAcHJpdmF0ZVxuICAqL1xuICBfY2hlY2tSZXN0cmljdGlvbnMgKGZpbGUpIHtcbiAgICBjb25zdCB7bWF4RmlsZVNpemUsIG1heE51bWJlck9mRmlsZXMsIGFsbG93ZWRGaWxlVHlwZXN9ID0gdGhpcy5vcHRzLnJlc3RyaWN0aW9uc1xuXG4gICAgaWYgKG1heE51bWJlck9mRmlsZXMpIHtcbiAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLmdldFN0YXRlKCkuZmlsZXMpLmxlbmd0aCArIDEgPiBtYXhOdW1iZXJPZkZpbGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmkxOG4oJ3lvdUNhbk9ubHlVcGxvYWRYJywgeyBzbWFydF9jb3VudDogbWF4TnVtYmVyT2ZGaWxlcyB9KX1gKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhbGxvd2VkRmlsZVR5cGVzKSB7XG4gICAgICBjb25zdCBpc0NvcnJlY3RGaWxlVHlwZSA9IGFsbG93ZWRGaWxlVHlwZXMuc29tZSgodHlwZSkgPT4ge1xuICAgICAgICAvLyBpZiAoIWZpbGUudHlwZSkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8gaXMgdGhpcyBpcyBhIG1pbWUtdHlwZVxuICAgICAgICBpZiAodHlwZS5pbmRleE9mKCcvJykgPiAtMSkge1xuICAgICAgICAgIGlmICghZmlsZS50eXBlKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICByZXR1cm4gbWF0Y2goZmlsZS50eXBlLCB0eXBlKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb3RoZXJ3aXNlIHRoaXMgaXMgbGlrZWx5IGFuIGV4dGVuc2lvblxuICAgICAgICBpZiAodHlwZVswXSA9PT0gJy4nKSB7XG4gICAgICAgICAgcmV0dXJuIGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUuc3Vic3RyKDEpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH0pXG5cbiAgICAgIGlmICghaXNDb3JyZWN0RmlsZVR5cGUpIHtcbiAgICAgICAgY29uc3QgYWxsb3dlZEZpbGVUeXBlc1N0cmluZyA9IGFsbG93ZWRGaWxlVHlwZXMuam9pbignLCAnKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5pMThuKCd5b3VDYW5Pbmx5VXBsb2FkRmlsZVR5cGVzJywgeyB0eXBlczogYWxsb3dlZEZpbGVUeXBlc1N0cmluZyB9KSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXZSBjYW4ndCBjaGVjayBtYXhGaWxlU2l6ZSBpZiB0aGUgc2l6ZSBpcyB1bmtub3duLlxuICAgIGlmIChtYXhGaWxlU2l6ZSAmJiBmaWxlLmRhdGEuc2l6ZSAhPSBudWxsKSB7XG4gICAgICBpZiAoZmlsZS5kYXRhLnNpemUgPiBtYXhGaWxlU2l6ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5pMThuKCdleGNlZWRzU2l6ZScpfSAke3ByZXR0eUJ5dGVzKG1heEZpbGVTaXplKX1gKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIEFkZCBhIG5ldyBmaWxlIHRvIGBzdGF0ZS5maWxlc2AuIFRoaXMgd2lsbCBydW4gYG9uQmVmb3JlRmlsZUFkZGVkYCxcbiAgKiB0cnkgdG8gZ3Vlc3MgZmlsZSB0eXBlIGluIGEgY2xldmVyIHdheSwgY2hlY2sgZmlsZSBhZ2FpbnN0IHJlc3RyaWN0aW9ucyxcbiAgKiBhbmQgc3RhcnQgYW4gdXBsb2FkIGlmIGBhdXRvUHJvY2VlZCA9PT0gdHJ1ZWAuXG4gICpcbiAgKiBAcGFyYW0ge29iamVjdH0gZmlsZSBvYmplY3QgdG8gYWRkXG4gICovXG4gIGFkZEZpbGUgKGZpbGUpIHtcbiAgICBjb25zdCB7IGZpbGVzLCBhbGxvd05ld1VwbG9hZCB9ID0gdGhpcy5nZXRTdGF0ZSgpXG5cbiAgICBjb25zdCBvbkVycm9yID0gKG1zZykgPT4ge1xuICAgICAgY29uc3QgZXJyID0gdHlwZW9mIG1zZyA9PT0gJ29iamVjdCcgPyBtc2cgOiBuZXcgRXJyb3IobXNnKVxuICAgICAgdGhpcy5sb2coZXJyLm1lc3NhZ2UpXG4gICAgICB0aGlzLmluZm8oZXJyLm1lc3NhZ2UsICdlcnJvcicsIDUwMDApXG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG5cbiAgICBpZiAoYWxsb3dOZXdVcGxvYWQgPT09IGZhbHNlKSB7XG4gICAgICBvbkVycm9yKG5ldyBFcnJvcignQ2Fubm90IGFkZCBuZXcgZmlsZXM6IGFscmVhZHkgdXBsb2FkaW5nLicpKVxuICAgIH1cblxuICAgIGNvbnN0IG9uQmVmb3JlRmlsZUFkZGVkUmVzdWx0ID0gdGhpcy5vcHRzLm9uQmVmb3JlRmlsZUFkZGVkKGZpbGUsIGZpbGVzKVxuXG4gICAgaWYgKG9uQmVmb3JlRmlsZUFkZGVkUmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5sb2coJ05vdCBhZGRpbmcgZmlsZSBiZWNhdXNlIG9uQmVmb3JlRmlsZUFkZGVkIHJldHVybmVkIGZhbHNlJylcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb25CZWZvcmVGaWxlQWRkZWRSZXN1bHQgPT09ICdvYmplY3QnICYmIG9uQmVmb3JlRmlsZUFkZGVkUmVzdWx0KSB7XG4gICAgICAvLyB3YXJuaW5nIGFmdGVyIHRoZSBjaGFuZ2UgaW4gMC4yNFxuICAgICAgaWYgKG9uQmVmb3JlRmlsZUFkZGVkUmVzdWx0LnRoZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb25CZWZvcmVGaWxlQWRkZWQoKSByZXR1cm5lZCBhIFByb21pc2UsIGJ1dCB0aGlzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQuIEl0IG11c3QgYmUgc3luY2hyb25vdXMuJylcbiAgICAgIH1cbiAgICAgIGZpbGUgPSBvbkJlZm9yZUZpbGVBZGRlZFJlc3VsdFxuICAgIH1cblxuICAgIGNvbnN0IGZpbGVUeXBlID0gZ2V0RmlsZVR5cGUoZmlsZSlcbiAgICBsZXQgZmlsZU5hbWVcbiAgICBpZiAoZmlsZS5uYW1lKSB7XG4gICAgICBmaWxlTmFtZSA9IGZpbGUubmFtZVxuICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUuc3BsaXQoJy8nKVswXSA9PT0gJ2ltYWdlJykge1xuICAgICAgZmlsZU5hbWUgPSBmaWxlVHlwZS5zcGxpdCgnLycpWzBdICsgJy4nICsgZmlsZVR5cGUuc3BsaXQoJy8nKVsxXVxuICAgIH0gZWxzZSB7XG4gICAgICBmaWxlTmFtZSA9ICdub25hbWUnXG4gICAgfVxuICAgIGNvbnN0IGZpbGVFeHRlbnNpb24gPSBnZXRGaWxlTmFtZUFuZEV4dGVuc2lvbihmaWxlTmFtZSkuZXh0ZW5zaW9uXG4gICAgY29uc3QgaXNSZW1vdGUgPSBmaWxlLmlzUmVtb3RlIHx8IGZhbHNlXG5cbiAgICBjb25zdCBmaWxlSUQgPSBnZW5lcmF0ZUZpbGVJRChmaWxlKVxuXG4gICAgY29uc3QgbWV0YSA9IGZpbGUubWV0YSB8fCB7fVxuICAgIG1ldGEubmFtZSA9IGZpbGVOYW1lXG4gICAgbWV0YS50eXBlID0gZmlsZVR5cGVcblxuICAgIC8vIGBudWxsYCBtZWFucyB0aGUgc2l6ZSBpcyB1bmtub3duLlxuICAgIGNvbnN0IHNpemUgPSBpc0Zpbml0ZShmaWxlLmRhdGEuc2l6ZSkgPyBmaWxlLmRhdGEuc2l6ZSA6IG51bGxcbiAgICBjb25zdCBuZXdGaWxlID0ge1xuICAgICAgc291cmNlOiBmaWxlLnNvdXJjZSB8fCAnJyxcbiAgICAgIGlkOiBmaWxlSUQsXG4gICAgICBuYW1lOiBmaWxlTmFtZSxcbiAgICAgIGV4dGVuc2lvbjogZmlsZUV4dGVuc2lvbiB8fCAnJyxcbiAgICAgIG1ldGE6IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5tZXRhLCBtZXRhKSxcbiAgICAgIHR5cGU6IGZpbGVUeXBlLFxuICAgICAgZGF0YTogZmlsZS5kYXRhLFxuICAgICAgcHJvZ3Jlc3M6IHtcbiAgICAgICAgcGVyY2VudGFnZTogMCxcbiAgICAgICAgYnl0ZXNVcGxvYWRlZDogMCxcbiAgICAgICAgYnl0ZXNUb3RhbDogc2l6ZSxcbiAgICAgICAgdXBsb2FkQ29tcGxldGU6IGZhbHNlLFxuICAgICAgICB1cGxvYWRTdGFydGVkOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHNpemU6IHNpemUsXG4gICAgICBpc1JlbW90ZTogaXNSZW1vdGUsXG4gICAgICByZW1vdGU6IGZpbGUucmVtb3RlIHx8ICcnLFxuICAgICAgcHJldmlldzogZmlsZS5wcmV2aWV3XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2NoZWNrUmVzdHJpY3Rpb25zKG5ld0ZpbGUpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmVtaXQoJ3Jlc3RyaWN0aW9uLWZhaWxlZCcsIG5ld0ZpbGUsIGVycilcbiAgICAgIG9uRXJyb3IoZXJyKVxuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZmlsZXM6IE9iamVjdC5hc3NpZ24oe30sIGZpbGVzLCB7XG4gICAgICAgIFtmaWxlSURdOiBuZXdGaWxlXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLmVtaXQoJ2ZpbGUtYWRkZWQnLCBuZXdGaWxlKVxuICAgIHRoaXMubG9nKGBBZGRlZCBmaWxlOiAke2ZpbGVOYW1lfSwgJHtmaWxlSUR9LCBtaW1lIHR5cGU6ICR7ZmlsZVR5cGV9YClcblxuICAgIGlmICh0aGlzLm9wdHMuYXV0b1Byb2NlZWQgJiYgIXRoaXMuc2NoZWR1bGVkQXV0b1Byb2NlZWQpIHtcbiAgICAgIHRoaXMuc2NoZWR1bGVkQXV0b1Byb2NlZWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5zY2hlZHVsZWRBdXRvUHJvY2VlZCA9IG51bGxcbiAgICAgICAgdGhpcy51cGxvYWQoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2sgfHwgZXJyLm1lc3NhZ2UgfHwgZXJyKVxuICAgICAgICB9KVxuICAgICAgfSwgNClcbiAgICB9XG4gIH1cblxuICByZW1vdmVGaWxlIChmaWxlSUQpIHtcbiAgICBjb25zdCB7IGZpbGVzLCBjdXJyZW50VXBsb2FkcyB9ID0gdGhpcy5nZXRTdGF0ZSgpXG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgZmlsZXMpXG4gICAgY29uc3QgcmVtb3ZlZEZpbGUgPSB1cGRhdGVkRmlsZXNbZmlsZUlEXVxuICAgIGRlbGV0ZSB1cGRhdGVkRmlsZXNbZmlsZUlEXVxuXG4gICAgLy8gUmVtb3ZlIHRoaXMgZmlsZSBmcm9tIGl0cyBgY3VycmVudFVwbG9hZGAuXG4gICAgY29uc3QgdXBkYXRlZFVwbG9hZHMgPSBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50VXBsb2FkcylcbiAgICBjb25zdCByZW1vdmVVcGxvYWRzID0gW11cbiAgICBPYmplY3Qua2V5cyh1cGRhdGVkVXBsb2FkcykuZm9yRWFjaCgodXBsb2FkSUQpID0+IHtcbiAgICAgIGNvbnN0IG5ld0ZpbGVJRHMgPSBjdXJyZW50VXBsb2Fkc1t1cGxvYWRJRF0uZmlsZUlEcy5maWx0ZXIoKHVwbG9hZEZpbGVJRCkgPT4gdXBsb2FkRmlsZUlEICE9PSBmaWxlSUQpXG4gICAgICAvLyBSZW1vdmUgdGhlIHVwbG9hZCBpZiBubyBmaWxlcyBhcmUgYXNzb2NpYXRlZCB3aXRoIGl0IGFueW1vcmUuXG4gICAgICBpZiAobmV3RmlsZUlEcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVtb3ZlVXBsb2Fkcy5wdXNoKHVwbG9hZElEKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgdXBkYXRlZFVwbG9hZHNbdXBsb2FkSURdID0gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFVwbG9hZHNbdXBsb2FkSURdLCB7XG4gICAgICAgIGZpbGVJRHM6IG5ld0ZpbGVJRHNcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgY3VycmVudFVwbG9hZHM6IHVwZGF0ZWRVcGxvYWRzLFxuICAgICAgZmlsZXM6IHVwZGF0ZWRGaWxlc1xuICAgIH0pXG5cbiAgICByZW1vdmVVcGxvYWRzLmZvckVhY2goKHVwbG9hZElEKSA9PiB7XG4gICAgICB0aGlzLl9yZW1vdmVVcGxvYWQodXBsb2FkSUQpXG4gICAgfSlcblxuICAgIHRoaXMuX2NhbGN1bGF0ZVRvdGFsUHJvZ3Jlc3MoKVxuICAgIHRoaXMuZW1pdCgnZmlsZS1yZW1vdmVkJywgcmVtb3ZlZEZpbGUpXG4gICAgdGhpcy5sb2coYEZpbGUgcmVtb3ZlZDogJHtyZW1vdmVkRmlsZS5pZH1gKVxuICB9XG5cbiAgcGF1c2VSZXN1bWUgKGZpbGVJRCkge1xuICAgIGlmICghdGhpcy5nZXRTdGF0ZSgpLmNhcGFiaWxpdGllcy5yZXN1bWFibGVVcGxvYWRzIHx8XG4gICAgICAgICB0aGlzLmdldEZpbGUoZmlsZUlEKS51cGxvYWRDb21wbGV0ZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3Qgd2FzUGF1c2VkID0gdGhpcy5nZXRGaWxlKGZpbGVJRCkuaXNQYXVzZWQgfHwgZmFsc2VcbiAgICBjb25zdCBpc1BhdXNlZCA9ICF3YXNQYXVzZWRcblxuICAgIHRoaXMuc2V0RmlsZVN0YXRlKGZpbGVJRCwge1xuICAgICAgaXNQYXVzZWQ6IGlzUGF1c2VkXG4gICAgfSlcblxuICAgIHRoaXMuZW1pdCgndXBsb2FkLXBhdXNlJywgZmlsZUlELCBpc1BhdXNlZClcblxuICAgIHJldHVybiBpc1BhdXNlZFxuICB9XG5cbiAgcGF1c2VBbGwgKCkge1xuICAgIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlcylcbiAgICBjb25zdCBpblByb2dyZXNzVXBkYXRlZEZpbGVzID0gT2JqZWN0LmtleXModXBkYXRlZEZpbGVzKS5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAgIHJldHVybiAhdXBkYXRlZEZpbGVzW2ZpbGVdLnByb2dyZXNzLnVwbG9hZENvbXBsZXRlICYmXG4gICAgICAgICAgICAgdXBkYXRlZEZpbGVzW2ZpbGVdLnByb2dyZXNzLnVwbG9hZFN0YXJ0ZWRcbiAgICB9KVxuXG4gICAgaW5Qcm9ncmVzc1VwZGF0ZWRGaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkRmlsZSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlXSwge1xuICAgICAgICBpc1BhdXNlZDogdHJ1ZVxuICAgICAgfSlcbiAgICAgIHVwZGF0ZWRGaWxlc1tmaWxlXSA9IHVwZGF0ZWRGaWxlXG4gICAgfSlcbiAgICB0aGlzLnNldFN0YXRlKHtmaWxlczogdXBkYXRlZEZpbGVzfSlcblxuICAgIHRoaXMuZW1pdCgncGF1c2UtYWxsJylcbiAgfVxuXG4gIHJlc3VtZUFsbCAoKSB7XG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGNvbnN0IGluUHJvZ3Jlc3NVcGRhdGVkRmlsZXMgPSBPYmplY3Qua2V5cyh1cGRhdGVkRmlsZXMpLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgcmV0dXJuICF1cGRhdGVkRmlsZXNbZmlsZV0ucHJvZ3Jlc3MudXBsb2FkQ29tcGxldGUgJiZcbiAgICAgICAgICAgICB1cGRhdGVkRmlsZXNbZmlsZV0ucHJvZ3Jlc3MudXBsb2FkU3RhcnRlZFxuICAgIH0pXG5cbiAgICBpblByb2dyZXNzVXBkYXRlZEZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGVzW2ZpbGVdLCB7XG4gICAgICAgIGlzUGF1c2VkOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IG51bGxcbiAgICAgIH0pXG4gICAgICB1cGRhdGVkRmlsZXNbZmlsZV0gPSB1cGRhdGVkRmlsZVxuICAgIH0pXG4gICAgdGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHVwZGF0ZWRGaWxlc30pXG5cbiAgICB0aGlzLmVtaXQoJ3Jlc3VtZS1hbGwnKVxuICB9XG5cbiAgcmV0cnlBbGwgKCkge1xuICAgIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlcylcbiAgICBjb25zdCBmaWxlc1RvUmV0cnkgPSBPYmplY3Qua2V5cyh1cGRhdGVkRmlsZXMpLmZpbHRlcihmaWxlID0+IHtcbiAgICAgIHJldHVybiB1cGRhdGVkRmlsZXNbZmlsZV0uZXJyb3JcbiAgICB9KVxuXG4gICAgZmlsZXNUb1JldHJ5LmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGVzW2ZpbGVdLCB7XG4gICAgICAgIGlzUGF1c2VkOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IG51bGxcbiAgICAgIH0pXG4gICAgICB1cGRhdGVkRmlsZXNbZmlsZV0gPSB1cGRhdGVkRmlsZVxuICAgIH0pXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBmaWxlczogdXBkYXRlZEZpbGVzLFxuICAgICAgZXJyb3I6IG51bGxcbiAgICB9KVxuXG4gICAgdGhpcy5lbWl0KCdyZXRyeS1hbGwnLCBmaWxlc1RvUmV0cnkpXG5cbiAgICBjb25zdCB1cGxvYWRJRCA9IHRoaXMuX2NyZWF0ZVVwbG9hZChmaWxlc1RvUmV0cnkpXG4gICAgcmV0dXJuIHRoaXMuX3J1blVwbG9hZCh1cGxvYWRJRClcbiAgfVxuXG4gIGNhbmNlbEFsbCAoKSB7XG4gICAgdGhpcy5lbWl0KCdjYW5jZWwtYWxsJylcblxuICAgIGNvbnN0IGZpbGVzID0gT2JqZWN0LmtleXModGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGZpbGVzLmZvckVhY2goKGZpbGVJRCkgPT4ge1xuICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGVJRClcbiAgICB9KVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBhbGxvd05ld1VwbG9hZDogdHJ1ZSxcbiAgICAgIHRvdGFsUHJvZ3Jlc3M6IDAsXG4gICAgICBlcnJvcjogbnVsbFxuICAgIH0pXG4gIH1cblxuICByZXRyeVVwbG9hZCAoZmlsZUlEKSB7XG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGVzW2ZpbGVJRF0sXG4gICAgICB7IGVycm9yOiBudWxsLCBpc1BhdXNlZDogZmFsc2UgfVxuICAgIClcbiAgICB1cGRhdGVkRmlsZXNbZmlsZUlEXSA9IHVwZGF0ZWRGaWxlXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBmaWxlczogdXBkYXRlZEZpbGVzXG4gICAgfSlcblxuICAgIHRoaXMuZW1pdCgndXBsb2FkLXJldHJ5JywgZmlsZUlEKVxuXG4gICAgY29uc3QgdXBsb2FkSUQgPSB0aGlzLl9jcmVhdGVVcGxvYWQoWyBmaWxlSUQgXSlcbiAgICByZXR1cm4gdGhpcy5fcnVuVXBsb2FkKHVwbG9hZElEKVxuICB9XG5cbiAgcmVzZXQgKCkge1xuICAgIHRoaXMuY2FuY2VsQWxsKClcbiAgfVxuXG4gIF9jYWxjdWxhdGVQcm9ncmVzcyAoZmlsZSwgZGF0YSkge1xuICAgIGlmICghdGhpcy5nZXRGaWxlKGZpbGUuaWQpKSB7XG4gICAgICB0aGlzLmxvZyhgTm90IHNldHRpbmcgcHJvZ3Jlc3MgZm9yIGEgZmlsZSB0aGF0IGhhcyBiZWVuIHJlbW92ZWQ6ICR7ZmlsZS5pZH1gKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gYnl0ZXNUb3RhbCBtYXkgYmUgbnVsbCBvciB6ZXJvOyBpbiB0aGF0IGNhc2Ugd2UgY2FuJ3QgZGl2aWRlIGJ5IGl0XG4gICAgY29uc3QgY2FuSGF2ZVBlcmNlbnRhZ2UgPSBpc0Zpbml0ZShkYXRhLmJ5dGVzVG90YWwpICYmIGRhdGEuYnl0ZXNUb3RhbCA+IDBcbiAgICB0aGlzLnNldEZpbGVTdGF0ZShmaWxlLmlkLCB7XG4gICAgICBwcm9ncmVzczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRGaWxlKGZpbGUuaWQpLnByb2dyZXNzLCB7XG4gICAgICAgIGJ5dGVzVXBsb2FkZWQ6IGRhdGEuYnl0ZXNVcGxvYWRlZCxcbiAgICAgICAgYnl0ZXNUb3RhbDogZGF0YS5ieXRlc1RvdGFsLFxuICAgICAgICBwZXJjZW50YWdlOiBjYW5IYXZlUGVyY2VudGFnZVxuICAgICAgICAgIC8vIFRPRE8oZ290by1idXMtc3RvcCkgZmxvb3JpbmcgdGhpcyBzaG91bGQgcHJvYmFibHkgYmUgdGhlIGNob2ljZSBvZiB0aGUgVUk/XG4gICAgICAgICAgLy8gd2UgZ2V0IG1vcmUgYWNjdXJhdGUgY2FsY3VsYXRpb25zIGlmIHdlIGRvbid0IHJvdW5kIHRoaXMgYXQgYWxsLlxuICAgICAgICAgID8gTWF0aC5mbG9vcihkYXRhLmJ5dGVzVXBsb2FkZWQgLyBkYXRhLmJ5dGVzVG90YWwgKiAxMDApXG4gICAgICAgICAgOiAwXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLl9jYWxjdWxhdGVUb3RhbFByb2dyZXNzKClcbiAgfVxuXG4gIF9jYWxjdWxhdGVUb3RhbFByb2dyZXNzICgpIHtcbiAgICAvLyBjYWxjdWxhdGUgdG90YWwgcHJvZ3Jlc3MsIHVzaW5nIHRoZSBudW1iZXIgb2YgZmlsZXMgY3VycmVudGx5IHVwbG9hZGluZyxcbiAgICAvLyBtdWx0aXBsaWVkIGJ5IDEwMCBhbmQgdGhlIHN1bW0gb2YgaW5kaXZpZHVhbCBwcm9ncmVzcyBvZiBlYWNoIGZpbGVcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuZ2V0RmlsZXMoKVxuXG4gICAgY29uc3QgaW5Qcm9ncmVzcyA9IGZpbGVzLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgcmV0dXJuIGZpbGUucHJvZ3Jlc3MudXBsb2FkU3RhcnRlZFxuICAgIH0pXG5cbiAgICBpZiAoaW5Qcm9ncmVzcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuZW1pdCgncHJvZ3Jlc3MnLCAwKVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IHRvdGFsUHJvZ3Jlc3M6IDAgfSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHNpemVkRmlsZXMgPSBpblByb2dyZXNzLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5wcm9ncmVzcy5ieXRlc1RvdGFsICE9IG51bGwpXG4gICAgY29uc3QgdW5zaXplZEZpbGVzID0gaW5Qcm9ncmVzcy5maWx0ZXIoKGZpbGUpID0+IGZpbGUucHJvZ3Jlc3MuYnl0ZXNUb3RhbCA9PSBudWxsKVxuXG4gICAgaWYgKHNpemVkRmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBwcm9ncmVzc01heCA9IGluUHJvZ3Jlc3MubGVuZ3RoXG4gICAgICBjb25zdCBjdXJyZW50UHJvZ3Jlc3MgPSB1bnNpemVkRmlsZXMucmVkdWNlKChhY2MsIGZpbGUpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjYyArIGZpbGUucHJvZ3Jlc3MucGVyY2VudGFnZVxuICAgICAgfSwgMClcbiAgICAgIGNvbnN0IHRvdGFsUHJvZ3Jlc3MgPSBNYXRoLnJvdW5kKGN1cnJlbnRQcm9ncmVzcyAvIHByb2dyZXNzTWF4ICogMTAwKVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IHRvdGFsUHJvZ3Jlc3MgfSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxldCB0b3RhbFNpemUgPSBzaXplZEZpbGVzLnJlZHVjZSgoYWNjLCBmaWxlKSA9PiB7XG4gICAgICByZXR1cm4gYWNjICsgZmlsZS5wcm9ncmVzcy5ieXRlc1RvdGFsXG4gICAgfSwgMClcbiAgICBjb25zdCBhdmVyYWdlU2l6ZSA9IHRvdGFsU2l6ZSAvIHNpemVkRmlsZXMubGVuZ3RoXG4gICAgdG90YWxTaXplICs9IGF2ZXJhZ2VTaXplICogdW5zaXplZEZpbGVzLmxlbmd0aFxuXG4gICAgbGV0IHVwbG9hZGVkU2l6ZSA9IDBcbiAgICBzaXplZEZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgIHVwbG9hZGVkU2l6ZSArPSBmaWxlLnByb2dyZXNzLmJ5dGVzVXBsb2FkZWRcbiAgICB9KVxuICAgIHVuc2l6ZWRGaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICB1cGxvYWRlZFNpemUgKz0gYXZlcmFnZVNpemUgKiAoZmlsZS5wcm9ncmVzcy5wZXJjZW50YWdlIHx8IDApXG4gICAgfSlcblxuICAgIGNvbnN0IHRvdGFsUHJvZ3Jlc3MgPSB0b3RhbFNpemUgPT09IDBcbiAgICAgID8gMFxuICAgICAgOiBNYXRoLnJvdW5kKHVwbG9hZGVkU2l6ZSAvIHRvdGFsU2l6ZSAqIDEwMClcblxuICAgIHRoaXMuc2V0U3RhdGUoeyB0b3RhbFByb2dyZXNzIH0pXG4gICAgdGhpcy5lbWl0KCdwcm9ncmVzcycsIHRvdGFsUHJvZ3Jlc3MpXG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGxpc3RlbmVycyBmb3IgYWxsIGdsb2JhbCBhY3Rpb25zLCBsaWtlOlxuICAgKiBgZXJyb3JgLCBgZmlsZS1yZW1vdmVkYCwgYHVwbG9hZC1wcm9ncmVzc2BcbiAgICovXG4gIF9hZGRMaXN0ZW5lcnMgKCkge1xuICAgIHRoaXMub24oJ2Vycm9yJywgKGVycm9yKSA9PiB7XG4gICAgICB0aGlzLnNldFN0YXRlKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5vbigndXBsb2FkLWVycm9yJywgKGZpbGUsIGVycm9yLCByZXNwb25zZSkgPT4ge1xuICAgICAgdGhpcy5zZXRGaWxlU3RhdGUoZmlsZS5pZCwge1xuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgcmVzcG9uc2VcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KVxuXG4gICAgICBsZXQgbWVzc2FnZSA9IHRoaXMuaTE4bignZmFpbGVkVG9VcGxvYWQnLCB7IGZpbGU6IGZpbGUubmFtZSB9KVxuICAgICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgZXJyb3IubWVzc2FnZSkge1xuICAgICAgICBtZXNzYWdlID0geyBtZXNzYWdlOiBtZXNzYWdlLCBkZXRhaWxzOiBlcnJvci5tZXNzYWdlIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuaW5mbyhtZXNzYWdlLCAnZXJyb3InLCA1MDAwKVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCd1cGxvYWQnLCAoKSA9PiB7XG4gICAgICB0aGlzLnNldFN0YXRlKHsgZXJyb3I6IG51bGwgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5vbigndXBsb2FkLXN0YXJ0ZWQnLCAoZmlsZSwgdXBsb2FkKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuZ2V0RmlsZShmaWxlLmlkKSkge1xuICAgICAgICB0aGlzLmxvZyhgTm90IHNldHRpbmcgcHJvZ3Jlc3MgZm9yIGEgZmlsZSB0aGF0IGhhcyBiZWVuIHJlbW92ZWQ6ICR7ZmlsZS5pZH1gKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0RmlsZVN0YXRlKGZpbGUuaWQsIHtcbiAgICAgICAgcHJvZ3Jlc3M6IHtcbiAgICAgICAgICB1cGxvYWRTdGFydGVkOiBEYXRlLm5vdygpLFxuICAgICAgICAgIHVwbG9hZENvbXBsZXRlOiBmYWxzZSxcbiAgICAgICAgICBwZXJjZW50YWdlOiAwLFxuICAgICAgICAgIGJ5dGVzVXBsb2FkZWQ6IDAsXG4gICAgICAgICAgYnl0ZXNUb3RhbDogZmlsZS5zaXplXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIC8vIHVwbG9hZCBwcm9ncmVzcyBldmVudHMgY2FuIG9jY3VyIGZyZXF1ZW50bHksIGVzcGVjaWFsbHkgd2hlbiB5b3UgaGF2ZSBhIGdvb2RcbiAgICAvLyBjb25uZWN0aW9uIHRvIHRoZSByZW1vdGUgc2VydmVyLiBUaGVyZWZvcmUsIHdlIGFyZSB0aHJvdHRlbGluZyB0aGVtIHRvXG4gICAgLy8gcHJldmVudCBhY2Nlc3NpdmUgZnVuY3Rpb24gY2FsbHMuXG4gICAgLy8gc2VlIGFsc286IGh0dHBzOi8vZ2l0aHViLmNvbS90dXMvdHVzLWpzLWNsaWVudC9jb21taXQvOTk0MGYyN2IyMzYxZmQ3ZTEwYmE1OGIwOWI2MGQ4MjQyMjE4M2JiYlxuICAgIC8vIGNvbnN0IF90aHJvdHRsZWRDYWxjdWxhdGVQcm9ncmVzcyA9IHRocm90dGxlKHRoaXMuX2NhbGN1bGF0ZVByb2dyZXNzLCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSlcblxuICAgIHRoaXMub24oJ3VwbG9hZC1wcm9ncmVzcycsIHRoaXMuX2NhbGN1bGF0ZVByb2dyZXNzKVxuXG4gICAgdGhpcy5vbigndXBsb2FkLXN1Y2Nlc3MnLCAoZmlsZSwgdXBsb2FkUmVzcCkgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFByb2dyZXNzID0gdGhpcy5nZXRGaWxlKGZpbGUuaWQpLnByb2dyZXNzXG4gICAgICB0aGlzLnNldEZpbGVTdGF0ZShmaWxlLmlkLCB7XG4gICAgICAgIHByb2dyZXNzOiBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50UHJvZ3Jlc3MsIHtcbiAgICAgICAgICB1cGxvYWRDb21wbGV0ZTogdHJ1ZSxcbiAgICAgICAgICBwZXJjZW50YWdlOiAxMDAsXG4gICAgICAgICAgYnl0ZXNVcGxvYWRlZDogY3VycmVudFByb2dyZXNzLmJ5dGVzVG90YWxcbiAgICAgICAgfSksXG4gICAgICAgIHJlc3BvbnNlOiB1cGxvYWRSZXNwLFxuICAgICAgICB1cGxvYWRVUkw6IHVwbG9hZFJlc3AudXBsb2FkVVJMLFxuICAgICAgICBpc1BhdXNlZDogZmFsc2VcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMuX2NhbGN1bGF0ZVRvdGFsUHJvZ3Jlc3MoKVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdwcmVwcm9jZXNzLXByb2dyZXNzJywgKGZpbGUsIHByb2dyZXNzKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuZ2V0RmlsZShmaWxlLmlkKSkge1xuICAgICAgICB0aGlzLmxvZyhgTm90IHNldHRpbmcgcHJvZ3Jlc3MgZm9yIGEgZmlsZSB0aGF0IGhhcyBiZWVuIHJlbW92ZWQ6ICR7ZmlsZS5pZH1gKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0RmlsZVN0YXRlKGZpbGUuaWQsIHtcbiAgICAgICAgcHJvZ3Jlc3M6IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0RmlsZShmaWxlLmlkKS5wcm9ncmVzcywge1xuICAgICAgICAgIHByZXByb2Nlc3M6IHByb2dyZXNzXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdwcmVwcm9jZXNzLWNvbXBsZXRlJywgKGZpbGUpID0+IHtcbiAgICAgIGlmICghdGhpcy5nZXRGaWxlKGZpbGUuaWQpKSB7XG4gICAgICAgIHRoaXMubG9nKGBOb3Qgc2V0dGluZyBwcm9ncmVzcyBmb3IgYSBmaWxlIHRoYXQgaGFzIGJlZW4gcmVtb3ZlZDogJHtmaWxlLmlkfWApXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgZmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgICBmaWxlc1tmaWxlLmlkXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpbGVzW2ZpbGUuaWRdLCB7XG4gICAgICAgIHByb2dyZXNzOiBPYmplY3QuYXNzaWduKHt9LCBmaWxlc1tmaWxlLmlkXS5wcm9ncmVzcylcbiAgICAgIH0pXG4gICAgICBkZWxldGUgZmlsZXNbZmlsZS5pZF0ucHJvZ3Jlc3MucHJlcHJvY2Vzc1xuXG4gICAgICB0aGlzLnNldFN0YXRlKHsgZmlsZXM6IGZpbGVzIH0pXG4gICAgfSlcblxuICAgIHRoaXMub24oJ3Bvc3Rwcm9jZXNzLXByb2dyZXNzJywgKGZpbGUsIHByb2dyZXNzKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuZ2V0RmlsZShmaWxlLmlkKSkge1xuICAgICAgICB0aGlzLmxvZyhgTm90IHNldHRpbmcgcHJvZ3Jlc3MgZm9yIGEgZmlsZSB0aGF0IGhhcyBiZWVuIHJlbW92ZWQ6ICR7ZmlsZS5pZH1gKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0RmlsZVN0YXRlKGZpbGUuaWQsIHtcbiAgICAgICAgcHJvZ3Jlc3M6IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlc1tmaWxlLmlkXS5wcm9ncmVzcywge1xuICAgICAgICAgIHBvc3Rwcm9jZXNzOiBwcm9ncmVzc1xuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5vbigncG9zdHByb2Nlc3MtY29tcGxldGUnLCAoZmlsZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmdldEZpbGUoZmlsZS5pZCkpIHtcbiAgICAgICAgdGhpcy5sb2coYE5vdCBzZXR0aW5nIHByb2dyZXNzIGZvciBhIGZpbGUgdGhhdCBoYXMgYmVlbiByZW1vdmVkOiAke2ZpbGUuaWR9YClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBjb25zdCBmaWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlcylcbiAgICAgIGZpbGVzW2ZpbGUuaWRdID0gT2JqZWN0LmFzc2lnbih7fSwgZmlsZXNbZmlsZS5pZF0sIHtcbiAgICAgICAgcHJvZ3Jlc3M6IE9iamVjdC5hc3NpZ24oe30sIGZpbGVzW2ZpbGUuaWRdLnByb2dyZXNzKVxuICAgICAgfSlcbiAgICAgIGRlbGV0ZSBmaWxlc1tmaWxlLmlkXS5wcm9ncmVzcy5wb3N0cHJvY2Vzc1xuICAgICAgLy8gVE9ETyBzaG91bGQgd2Ugc2V0IHNvbWUga2luZCBvZiBgZnVsbHlDb21wbGV0ZWAgcHJvcGVydHkgb24gdGhlIGZpbGUgb2JqZWN0XG4gICAgICAvLyBzbyBpdCdzIGVhc2llciB0byBzZWUgdGhhdCB0aGUgZmlsZSBpcyB1cGxvYWTigKZmdWxseSBjb21wbGV0ZeKApnJhdGhlciB0aGFuXG4gICAgICAvLyB3aGF0IHdlIGhhdmUgdG8gZG8gbm93IChgdXBsb2FkQ29tcGxldGUgJiYgIXBvc3Rwcm9jZXNzYClcblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGZpbGVzOiBmaWxlcyB9KVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdyZXN0b3JlZCcsICgpID0+IHtcbiAgICAgIC8vIEZpbGVzIG1heSBoYXZlIGNoYW5nZWQtLWVuc3VyZSBwcm9ncmVzcyBpcyBzdGlsbCBhY2N1cmF0ZS5cbiAgICAgIHRoaXMuX2NhbGN1bGF0ZVRvdGFsUHJvZ3Jlc3MoKVxuICAgIH0pXG5cbiAgICAvLyBzaG93IGluZm9ybWVyIGlmIG9mZmxpbmVcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvbmxpbmUnLCAoKSA9PiB0aGlzLnVwZGF0ZU9ubGluZVN0YXR1cygpKVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCAoKSA9PiB0aGlzLnVwZGF0ZU9ubGluZVN0YXR1cygpKVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZU9ubGluZVN0YXR1cygpLCAzMDAwKVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZU9ubGluZVN0YXR1cyAoKSB7XG4gICAgY29uc3Qgb25saW5lID1cbiAgICAgIHR5cGVvZiB3aW5kb3cubmF2aWdhdG9yLm9uTGluZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgPyB3aW5kb3cubmF2aWdhdG9yLm9uTGluZVxuICAgICAgICA6IHRydWVcbiAgICBpZiAoIW9ubGluZSkge1xuICAgICAgdGhpcy5lbWl0KCdpcy1vZmZsaW5lJylcbiAgICAgIHRoaXMuaW5mbyh0aGlzLmkxOG4oJ25vSW50ZXJuZXRDb25uZWN0aW9uJyksICdlcnJvcicsIDApXG4gICAgICB0aGlzLndhc09mZmxpbmUgPSB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW1pdCgnaXMtb25saW5lJylcbiAgICAgIGlmICh0aGlzLndhc09mZmxpbmUpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdiYWNrLW9ubGluZScpXG4gICAgICAgIHRoaXMuaW5mbyh0aGlzLmkxOG4oJ2Nvbm5lY3RlZFRvSW50ZXJuZXQnKSwgJ3N1Y2Nlc3MnLCAzMDAwKVxuICAgICAgICB0aGlzLndhc09mZmxpbmUgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldElEICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRzLmlkXG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgcGx1Z2luIHdpdGggQ29yZS5cbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IFBsdWdpbiBvYmplY3RcbiAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRzXSBvYmplY3Qgd2l0aCBvcHRpb25zIHRvIGJlIHBhc3NlZCB0byBQbHVnaW5cbiAgICogQHJldHVybiB7T2JqZWN0fSBzZWxmIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgdXNlIChQbHVnaW4sIG9wdHMpIHtcbiAgICBpZiAodHlwZW9mIFBsdWdpbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGV0IG1zZyA9IGBFeHBlY3RlZCBhIHBsdWdpbiBjbGFzcywgYnV0IGdvdCAke1BsdWdpbiA9PT0gbnVsbCA/ICdudWxsJyA6IHR5cGVvZiBQbHVnaW59LmAgK1xuICAgICAgICAnIFBsZWFzZSB2ZXJpZnkgdGhhdCB0aGUgcGx1Z2luIHdhcyBpbXBvcnRlZCBhbmQgc3BlbGxlZCBjb3JyZWN0bHkuJ1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihtc2cpXG4gICAgfVxuXG4gICAgLy8gSW5zdGFudGlhdGVcbiAgICBjb25zdCBwbHVnaW4gPSBuZXcgUGx1Z2luKHRoaXMsIG9wdHMpXG4gICAgY29uc3QgcGx1Z2luSWQgPSBwbHVnaW4uaWRcbiAgICB0aGlzLnBsdWdpbnNbcGx1Z2luLnR5cGVdID0gdGhpcy5wbHVnaW5zW3BsdWdpbi50eXBlXSB8fCBbXVxuXG4gICAgaWYgKCFwbHVnaW5JZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3VyIHBsdWdpbiBtdXN0IGhhdmUgYW4gaWQnKVxuICAgIH1cblxuICAgIGlmICghcGx1Z2luLnR5cGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignWW91ciBwbHVnaW4gbXVzdCBoYXZlIGEgdHlwZScpXG4gICAgfVxuXG4gICAgbGV0IGV4aXN0c1BsdWdpbkFscmVhZHkgPSB0aGlzLmdldFBsdWdpbihwbHVnaW5JZClcbiAgICBpZiAoZXhpc3RzUGx1Z2luQWxyZWFkeSkge1xuICAgICAgbGV0IG1zZyA9IGBBbHJlYWR5IGZvdW5kIGEgcGx1Z2luIG5hbWVkICcke2V4aXN0c1BsdWdpbkFscmVhZHkuaWR9Jy4gYCArXG4gICAgICAgIGBUcmllZCB0byB1c2U6ICcke3BsdWdpbklkfScuXFxuYCArXG4gICAgICAgIGBVcHB5IHBsdWdpbnMgbXVzdCBoYXZlIHVuaXF1ZSAnaWQnIG9wdGlvbnMuIFNlZSBodHRwczovL3VwcHkuaW8vZG9jcy9wbHVnaW5zLyNpZC5gXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKVxuICAgIH1cblxuICAgIHRoaXMucGx1Z2luc1twbHVnaW4udHlwZV0ucHVzaChwbHVnaW4pXG4gICAgcGx1Z2luLmluc3RhbGwoKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIG9uZSBQbHVnaW4gYnkgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGlkIHBsdWdpbiBpZFxuICAgKiBAcmV0dXJuIHtvYmplY3QgfCBib29sZWFufVxuICAgKi9cbiAgZ2V0UGx1Z2luIChpZCkge1xuICAgIGxldCBmb3VuZFBsdWdpbiA9IG51bGxcbiAgICB0aGlzLml0ZXJhdGVQbHVnaW5zKChwbHVnaW4pID0+IHtcbiAgICAgIGlmIChwbHVnaW4uaWQgPT09IGlkKSB7XG4gICAgICAgIGZvdW5kUGx1Z2luID0gcGx1Z2luXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIGZvdW5kUGx1Z2luXG4gIH1cblxuICAvKipcbiAgICogSXRlcmF0ZSB0aHJvdWdoIGFsbCBgdXNlYGQgcGx1Z2lucy5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWV0aG9kIHRoYXQgd2lsbCBiZSBydW4gb24gZWFjaCBwbHVnaW5cbiAgICovXG4gIGl0ZXJhdGVQbHVnaW5zIChtZXRob2QpIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLnBsdWdpbnMpLmZvckVhY2gocGx1Z2luVHlwZSA9PiB7XG4gICAgICB0aGlzLnBsdWdpbnNbcGx1Z2luVHlwZV0uZm9yRWFjaChtZXRob2QpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmluc3RhbGwgYW5kIHJlbW92ZSBhIHBsdWdpbi5cbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IGluc3RhbmNlIFRoZSBwbHVnaW4gaW5zdGFuY2UgdG8gcmVtb3ZlLlxuICAgKi9cbiAgcmVtb3ZlUGx1Z2luIChpbnN0YW5jZSkge1xuICAgIHRoaXMubG9nKGBSZW1vdmluZyBwbHVnaW4gJHtpbnN0YW5jZS5pZH1gKVxuICAgIHRoaXMuZW1pdCgncGx1Z2luLXJlbW92ZScsIGluc3RhbmNlKVxuXG4gICAgaWYgKGluc3RhbmNlLnVuaW5zdGFsbCkge1xuICAgICAgaW5zdGFuY2UudW5pbnN0YWxsKClcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gdGhpcy5wbHVnaW5zW2luc3RhbmNlLnR5cGVdLnNsaWNlKClcbiAgICBjb25zdCBpbmRleCA9IGxpc3QuaW5kZXhPZihpbnN0YW5jZSlcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBsaXN0LnNwbGljZShpbmRleCwgMSlcbiAgICAgIHRoaXMucGx1Z2luc1tpbnN0YW5jZS50eXBlXSA9IGxpc3RcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkU3RhdGUgPSB0aGlzLmdldFN0YXRlKClcbiAgICBkZWxldGUgdXBkYXRlZFN0YXRlLnBsdWdpbnNbaW5zdGFuY2UuaWRdXG4gICAgdGhpcy5zZXRTdGF0ZSh1cGRhdGVkU3RhdGUpXG4gIH1cblxuICAvKipcbiAgICogVW5pbnN0YWxsIGFsbCBwbHVnaW5zIGFuZCBjbG9zZSBkb3duIHRoaXMgVXBweSBpbnN0YW5jZS5cbiAgICovXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLmxvZyhgQ2xvc2luZyBVcHB5IGluc3RhbmNlICR7dGhpcy5vcHRzLmlkfTogcmVtb3ZpbmcgYWxsIGZpbGVzIGFuZCB1bmluc3RhbGxpbmcgcGx1Z2luc2ApXG5cbiAgICB0aGlzLnJlc2V0KClcblxuICAgIHRoaXMuX3N0b3JlVW5zdWJzY3JpYmUoKVxuXG4gICAgdGhpcy5pdGVyYXRlUGx1Z2lucygocGx1Z2luKSA9PiB7XG4gICAgICB0aGlzLnJlbW92ZVBsdWdpbihwbHVnaW4pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAqIFNldCBpbmZvIG1lc3NhZ2UgaW4gYHN0YXRlLmluZm9gLCBzbyB0aGF0IFVJIHBsdWdpbnMgbGlrZSBgSW5mb3JtZXJgXG4gICogY2FuIGRpc3BsYXkgdGhlIG1lc3NhZ2UuXG4gICpcbiAgKiBAcGFyYW0ge3N0cmluZyB8IG9iamVjdH0gbWVzc2FnZSBNZXNzYWdlIHRvIGJlIGRpc3BsYXllZCBieSB0aGUgaW5mb3JtZXJcbiAgKiBAcGFyYW0ge3N0cmluZ30gW3R5cGVdXG4gICogQHBhcmFtIHtudW1iZXJ9IFtkdXJhdGlvbl1cbiAgKi9cblxuICBpbmZvIChtZXNzYWdlLCB0eXBlID0gJ2luZm8nLCBkdXJhdGlvbiA9IDMwMDApIHtcbiAgICBjb25zdCBpc0NvbXBsZXhNZXNzYWdlID0gdHlwZW9mIG1lc3NhZ2UgPT09ICdvYmplY3QnXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGluZm86IHtcbiAgICAgICAgaXNIaWRkZW46IGZhbHNlLFxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBtZXNzYWdlOiBpc0NvbXBsZXhNZXNzYWdlID8gbWVzc2FnZS5tZXNzYWdlIDogbWVzc2FnZSxcbiAgICAgICAgZGV0YWlsczogaXNDb21wbGV4TWVzc2FnZSA/IG1lc3NhZ2UuZGV0YWlscyA6IG51bGxcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5lbWl0KCdpbmZvLXZpc2libGUnKVxuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuaW5mb1RpbWVvdXRJRClcbiAgICBpZiAoZHVyYXRpb24gPT09IDApIHtcbiAgICAgIHRoaXMuaW5mb1RpbWVvdXRJRCA9IHVuZGVmaW5lZFxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gaGlkZSB0aGUgaW5mb3JtZXIgYWZ0ZXIgYGR1cmF0aW9uYCBtaWxsaXNlY29uZHNcbiAgICB0aGlzLmluZm9UaW1lb3V0SUQgPSBzZXRUaW1lb3V0KHRoaXMuaGlkZUluZm8sIGR1cmF0aW9uKVxuICB9XG5cbiAgaGlkZUluZm8gKCkge1xuICAgIGNvbnN0IG5ld0luZm8gPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuaW5mbywge1xuICAgICAgaXNIaWRkZW46IHRydWVcbiAgICB9KVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaW5mbzogbmV3SW5mb1xuICAgIH0pXG4gICAgdGhpcy5lbWl0KCdpbmZvLWhpZGRlbicpXG4gIH1cblxuICAvKipcbiAgICogTG9ncyBzdHVmZiB0byBjb25zb2xlLCBvbmx5IGlmIGBkZWJ1Z2AgaXMgc2V0IHRvIHRydWUuIFNpbGVudCBpbiBwcm9kdWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IG1lc3NhZ2UgdG8gbG9nXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbdHlwZV0gb3B0aW9uYWwgYGVycm9yYCBvciBgd2FybmluZ2BcbiAgICovXG4gIGxvZyAobWVzc2FnZSwgdHlwZSkge1xuICAgIGlmICghdGhpcy5vcHRzLmRlYnVnKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBwcmVmaXggPSBgW1VwcHldIFske2dldFRpbWVTdGFtcCgpfV1gXG5cbiAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgY29uc29sZS5lcnJvcihwcmVmaXgsIG1lc3NhZ2UpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gJ3dhcm5pbmcnKSB7XG4gICAgICBjb25zb2xlLndhcm4ocHJlZml4LCBtZXNzYWdlKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2cocHJlZml4LCBtZXNzYWdlKVxuICB9XG5cbiAgLyoqXG4gICAqIE9ic29sZXRlLCBldmVudCBsaXN0ZW5lcnMgYXJlIG5vdyBhZGRlZCBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAqL1xuICBydW4gKCkge1xuICAgIHRoaXMubG9nKCdDYWxsaW5nIHJ1bigpIGlzIG5vIGxvbmdlciBuZWNlc3NhcnkuJywgJ3dhcm5pbmcnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogUmVzdG9yZSBhbiB1cGxvYWQgYnkgaXRzIElELlxuICAgKi9cbiAgcmVzdG9yZSAodXBsb2FkSUQpIHtcbiAgICB0aGlzLmxvZyhgQ29yZTogYXR0ZW1wdGluZyB0byByZXN0b3JlIHVwbG9hZCBcIiR7dXBsb2FkSUR9XCJgKVxuXG4gICAgaWYgKCF0aGlzLmdldFN0YXRlKCkuY3VycmVudFVwbG9hZHNbdXBsb2FkSURdKSB7XG4gICAgICB0aGlzLl9yZW1vdmVVcGxvYWQodXBsb2FkSUQpXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdOb25leGlzdGVudCB1cGxvYWQnKSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcnVuVXBsb2FkKHVwbG9hZElEKVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiB1cGxvYWQgZm9yIGEgYnVuY2ggb2YgZmlsZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gZmlsZUlEcyBGaWxlIElEcyB0byBpbmNsdWRlIGluIHRoaXMgdXBsb2FkLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IElEIG9mIHRoaXMgdXBsb2FkLlxuICAgKi9cbiAgX2NyZWF0ZVVwbG9hZCAoZmlsZUlEcykge1xuICAgIGNvbnN0IHsgYWxsb3dOZXdVcGxvYWQsIGN1cnJlbnRVcGxvYWRzIH0gPSB0aGlzLmdldFN0YXRlKClcbiAgICBpZiAoIWFsbG93TmV3VXBsb2FkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgYSBuZXcgdXBsb2FkOiBhbHJlYWR5IHVwbG9hZGluZy4nKVxuICAgIH1cblxuICAgIGNvbnN0IHVwbG9hZElEID0gY3VpZCgpXG5cbiAgICB0aGlzLmVtaXQoJ3VwbG9hZCcsIHtcbiAgICAgIGlkOiB1cGxvYWRJRCxcbiAgICAgIGZpbGVJRHM6IGZpbGVJRHNcbiAgICB9KVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBhbGxvd05ld1VwbG9hZDogdGhpcy5vcHRzLmFsbG93TXVsdGlwbGVVcGxvYWRzICE9PSBmYWxzZSxcblxuICAgICAgY3VycmVudFVwbG9hZHM6IHtcbiAgICAgICAgLi4uY3VycmVudFVwbG9hZHMsXG4gICAgICAgIFt1cGxvYWRJRF06IHtcbiAgICAgICAgICBmaWxlSURzOiBmaWxlSURzLFxuICAgICAgICAgIHN0ZXA6IDAsXG4gICAgICAgICAgcmVzdWx0OiB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiB1cGxvYWRJRFxuICB9XG5cbiAgX2dldFVwbG9hZCAodXBsb2FkSUQpIHtcbiAgICBjb25zdCB7IGN1cnJlbnRVcGxvYWRzIH0gPSB0aGlzLmdldFN0YXRlKClcblxuICAgIHJldHVybiBjdXJyZW50VXBsb2Fkc1t1cGxvYWRJRF1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgZGF0YSB0byBhbiB1cGxvYWQncyByZXN1bHQgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXBsb2FkSUQgVGhlIElEIG9mIHRoZSB1cGxvYWQuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIERhdGEgcHJvcGVydGllcyB0byBhZGQgdG8gdGhlIHJlc3VsdCBvYmplY3QuXG4gICAqL1xuICBhZGRSZXN1bHREYXRhICh1cGxvYWRJRCwgZGF0YSkge1xuICAgIGlmICghdGhpcy5fZ2V0VXBsb2FkKHVwbG9hZElEKSkge1xuICAgICAgdGhpcy5sb2coYE5vdCBzZXR0aW5nIHJlc3VsdCBmb3IgYW4gdXBsb2FkIHRoYXQgaGFzIGJlZW4gcmVtb3ZlZDogJHt1cGxvYWRJRH1gKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRVcGxvYWRzID0gdGhpcy5nZXRTdGF0ZSgpLmN1cnJlbnRVcGxvYWRzXG4gICAgY29uc3QgY3VycmVudFVwbG9hZCA9IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXSwge1xuICAgICAgcmVzdWx0OiBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50VXBsb2Fkc1t1cGxvYWRJRF0ucmVzdWx0LCBkYXRhKVxuICAgIH0pXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjdXJyZW50VXBsb2FkczogT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFVwbG9hZHMsIHtcbiAgICAgICAgW3VwbG9hZElEXTogY3VycmVudFVwbG9hZFxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiB1cGxvYWQsIGVnLiBpZiBpdCBoYXMgYmVlbiBjYW5jZWxlZCBvciBjb21wbGV0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cGxvYWRJRCBUaGUgSUQgb2YgdGhlIHVwbG9hZC5cbiAgICovXG4gIF9yZW1vdmVVcGxvYWQgKHVwbG9hZElEKSB7XG4gICAgY29uc3QgY3VycmVudFVwbG9hZHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuY3VycmVudFVwbG9hZHMpXG4gICAgZGVsZXRlIGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjdXJyZW50VXBsb2FkczogY3VycmVudFVwbG9hZHNcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbiB1cGxvYWQuIFRoaXMgcGlja3MgdXAgd2hlcmUgaXQgbGVmdCBvZmYgaW4gY2FzZSB0aGUgdXBsb2FkIGlzIGJlaW5nIHJlc3RvcmVkLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3J1blVwbG9hZCAodXBsb2FkSUQpIHtcbiAgICBjb25zdCB1cGxvYWREYXRhID0gdGhpcy5nZXRTdGF0ZSgpLmN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXVxuICAgIGNvbnN0IHJlc3RvcmVTdGVwID0gdXBsb2FkRGF0YS5zdGVwXG5cbiAgICBjb25zdCBzdGVwcyA9IFtcbiAgICAgIC4uLnRoaXMucHJlUHJvY2Vzc29ycyxcbiAgICAgIC4uLnRoaXMudXBsb2FkZXJzLFxuICAgICAgLi4udGhpcy5wb3N0UHJvY2Vzc29yc1xuICAgIF1cbiAgICBsZXQgbGFzdFN0ZXAgPSBQcm9taXNlLnJlc29sdmUoKVxuICAgIHN0ZXBzLmZvckVhY2goKGZuLCBzdGVwKSA9PiB7XG4gICAgICAvLyBTa2lwIHRoaXMgc3RlcCBpZiB3ZSBhcmUgcmVzdG9yaW5nIGFuZCBoYXZlIGFscmVhZHkgY29tcGxldGVkIHRoaXMgc3RlcCBiZWZvcmUuXG4gICAgICBpZiAoc3RlcCA8IHJlc3RvcmVTdGVwKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBsYXN0U3RlcCA9IGxhc3RTdGVwLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCB7IGN1cnJlbnRVcGxvYWRzIH0gPSB0aGlzLmdldFN0YXRlKClcbiAgICAgICAgY29uc3QgY3VycmVudFVwbG9hZCA9IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXSwge1xuICAgICAgICAgIHN0ZXA6IHN0ZXBcbiAgICAgICAgfSlcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgY3VycmVudFVwbG9hZHM6IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRVcGxvYWRzLCB7XG4gICAgICAgICAgICBbdXBsb2FkSURdOiBjdXJyZW50VXBsb2FkXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBUT0RPIGdpdmUgdGhpcyB0aGUgYGN1cnJlbnRVcGxvYWRgIG9iamVjdCBhcyBpdHMgb25seSBwYXJhbWV0ZXIgbWF5YmU/XG4gICAgICAgIC8vIE90aGVyd2lzZSB3aGVuIG1vcmUgbWV0YWRhdGEgbWF5IGJlIGFkZGVkIHRvIHRoZSB1cGxvYWQgdGhpcyB3b3VsZCBrZWVwIGdldHRpbmcgbW9yZSBwYXJhbWV0ZXJzXG4gICAgICAgIHJldHVybiBmbihjdXJyZW50VXBsb2FkLmZpbGVJRHMsIHVwbG9hZElEKVxuICAgICAgfSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICAvLyBOb3QgcmV0dXJuaW5nIHRoZSBgY2F0Y2hgZWQgcHJvbWlzZSwgYmVjYXVzZSB3ZSBzdGlsbCB3YW50IHRvIHJldHVybiBhIHJlamVjdGVkXG4gICAgLy8gcHJvbWlzZSBmcm9tIHRoaXMgbWV0aG9kIGlmIHRoZSB1cGxvYWQgZmFpbGVkLlxuICAgIGxhc3RTdGVwLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIsIHVwbG9hZElEKVxuICAgICAgdGhpcy5fcmVtb3ZlVXBsb2FkKHVwbG9hZElEKVxuICAgIH0pXG5cbiAgICByZXR1cm4gbGFzdFN0ZXAudGhlbigoKSA9PiB7XG4gICAgICAvLyBTZXQgcmVzdWx0IGRhdGEuXG4gICAgICBjb25zdCB7IGN1cnJlbnRVcGxvYWRzIH0gPSB0aGlzLmdldFN0YXRlKClcbiAgICAgIGNvbnN0IGN1cnJlbnRVcGxvYWQgPSBjdXJyZW50VXBsb2Fkc1t1cGxvYWRJRF1cbiAgICAgIGlmICghY3VycmVudFVwbG9hZCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZXMgPSBjdXJyZW50VXBsb2FkLmZpbGVJRHNcbiAgICAgICAgLm1hcCgoZmlsZUlEKSA9PiB0aGlzLmdldEZpbGUoZmlsZUlEKSlcbiAgICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBmaWxlcy5maWx0ZXIoKGZpbGUpID0+ICFmaWxlLmVycm9yKVxuICAgICAgY29uc3QgZmFpbGVkID0gZmlsZXMuZmlsdGVyKChmaWxlKSA9PiBmaWxlLmVycm9yKVxuICAgICAgdGhpcy5hZGRSZXN1bHREYXRhKHVwbG9hZElELCB7IHN1Y2Nlc3NmdWwsIGZhaWxlZCwgdXBsb2FkSUQgfSlcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIC8vIEVtaXQgY29tcGxldGlvbiBldmVudHMuXG4gICAgICAvLyBUaGlzIGlzIGluIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gdGhhdCB0aGUgYGN1cnJlbnRVcGxvYWRzYCB2YXJpYWJsZVxuICAgICAgLy8gYWx3YXlzIHJlZmVycyB0byB0aGUgbGF0ZXN0IHN0YXRlLiBJbiB0aGUgaGFuZGxlciByaWdodCBhYm92ZSBpdCByZWZlcnNcbiAgICAgIC8vIHRvIGFuIG91dGRhdGVkIG9iamVjdCB3aXRob3V0IHRoZSBgLnJlc3VsdGAgcHJvcGVydHkuXG4gICAgICBjb25zdCB7IGN1cnJlbnRVcGxvYWRzIH0gPSB0aGlzLmdldFN0YXRlKClcbiAgICAgIGlmICghY3VycmVudFVwbG9hZHNbdXBsb2FkSURdKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgY3VycmVudFVwbG9hZCA9IGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXVxuICAgICAgY29uc3QgcmVzdWx0ID0gY3VycmVudFVwbG9hZC5yZXN1bHRcbiAgICAgIHRoaXMuZW1pdCgnY29tcGxldGUnLCByZXN1bHQpXG5cbiAgICAgIHRoaXMuX3JlbW92ZVVwbG9hZCh1cGxvYWRJRClcblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdCA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMubG9nKGBOb3Qgc2V0dGluZyByZXN1bHQgZm9yIGFuIHVwbG9hZCB0aGF0IGhhcyBiZWVuIHJlbW92ZWQ6ICR7dXBsb2FkSUR9YClcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IGFuIHVwbG9hZCBmb3IgYWxsIHRoZSBmaWxlcyB0aGF0IGFyZSBub3QgY3VycmVudGx5IGJlaW5nIHVwbG9hZGVkLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgdXBsb2FkICgpIHtcbiAgICBpZiAoIXRoaXMucGx1Z2lucy51cGxvYWRlcikge1xuICAgICAgdGhpcy5sb2coJ05vIHVwbG9hZGVyIHR5cGUgcGx1Z2lucyBhcmUgdXNlZCcsICd3YXJuaW5nJylcbiAgICB9XG5cbiAgICBsZXQgZmlsZXMgPSB0aGlzLmdldFN0YXRlKCkuZmlsZXNcbiAgICBjb25zdCBvbkJlZm9yZVVwbG9hZFJlc3VsdCA9IHRoaXMub3B0cy5vbkJlZm9yZVVwbG9hZChmaWxlcylcblxuICAgIGlmIChvbkJlZm9yZVVwbG9hZFJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vdCBzdGFydGluZyB0aGUgdXBsb2FkIGJlY2F1c2Ugb25CZWZvcmVVcGxvYWQgcmV0dXJuZWQgZmFsc2UnKSlcbiAgICB9XG5cbiAgICBpZiAob25CZWZvcmVVcGxvYWRSZXN1bHQgJiYgdHlwZW9mIG9uQmVmb3JlVXBsb2FkUmVzdWx0ID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gd2FybmluZyBhZnRlciB0aGUgY2hhbmdlIGluIDAuMjRcbiAgICAgIGlmIChvbkJlZm9yZVVwbG9hZFJlc3VsdC50aGVuKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29uQmVmb3JlVXBsb2FkKCkgcmV0dXJuZWQgYSBQcm9taXNlLCBidXQgdGhpcyBpcyBubyBsb25nZXIgc3VwcG9ydGVkLiBJdCBtdXN0IGJlIHN5bmNocm9ub3VzLicpXG4gICAgICB9XG5cbiAgICAgIGZpbGVzID0gb25CZWZvcmVVcGxvYWRSZXN1bHRcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuX2NoZWNrTWluTnVtYmVyT2ZGaWxlcyhmaWxlcykpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgY3VycmVudFVwbG9hZHMgfSA9IHRoaXMuZ2V0U3RhdGUoKVxuICAgICAgICAvLyBnZXQgYSBsaXN0IG9mIGZpbGVzIHRoYXQgYXJlIGN1cnJlbnRseSBhc3NpZ25lZCB0byB1cGxvYWRzXG4gICAgICAgIGNvbnN0IGN1cnJlbnRseVVwbG9hZGluZ0ZpbGVzID0gT2JqZWN0LmtleXMoY3VycmVudFVwbG9hZHMpLnJlZHVjZSgocHJldiwgY3VycikgPT4gcHJldi5jb25jYXQoY3VycmVudFVwbG9hZHNbY3Vycl0uZmlsZUlEcyksIFtdKVxuXG4gICAgICAgIGNvbnN0IHdhaXRpbmdGaWxlSURzID0gW11cbiAgICAgICAgT2JqZWN0LmtleXMoZmlsZXMpLmZvckVhY2goKGZpbGVJRCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmdldEZpbGUoZmlsZUlEKVxuICAgICAgICAgIC8vIGlmIHRoZSBmaWxlIGhhc24ndCBzdGFydGVkIHVwbG9hZGluZyBhbmQgaGFzbid0IGFscmVhZHkgYmVlbiBhc3NpZ25lZCB0byBhbiB1cGxvYWQuLlxuICAgICAgICAgIGlmICgoIWZpbGUucHJvZ3Jlc3MudXBsb2FkU3RhcnRlZCkgJiYgKGN1cnJlbnRseVVwbG9hZGluZ0ZpbGVzLmluZGV4T2YoZmlsZUlEKSA9PT0gLTEpKSB7XG4gICAgICAgICAgICB3YWl0aW5nRmlsZUlEcy5wdXNoKGZpbGUuaWQpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnN0IHVwbG9hZElEID0gdGhpcy5fY3JlYXRlVXBsb2FkKHdhaXRpbmdGaWxlSURzKVxuICAgICAgICByZXR1cm4gdGhpcy5fcnVuVXBsb2FkKHVwbG9hZElEKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB0eXBlb2YgZXJyID09PSAnb2JqZWN0JyA/IGVyci5tZXNzYWdlIDogZXJyXG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSB0eXBlb2YgZXJyID09PSAnb2JqZWN0JyA/IGVyci5kZXRhaWxzIDogbnVsbFxuICAgICAgICB0aGlzLmxvZyhgJHttZXNzYWdlfSAke2RldGFpbHN9YClcbiAgICAgICAgdGhpcy5pbmZvKHsgbWVzc2FnZTogbWVzc2FnZSwgZGV0YWlsczogZGV0YWlscyB9LCAnZXJyb3InLCA0MDAwKVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QodHlwZW9mIGVyciA9PT0gJ29iamVjdCcgPyBlcnIgOiBuZXcgRXJyb3IoZXJyKSlcbiAgICAgIH0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICByZXR1cm4gbmV3IFVwcHkob3B0cylcbn1cblxuLy8gRXhwb3NlIGNsYXNzIGNvbnN0cnVjdG9yLlxubW9kdWxlLmV4cG9ydHMuVXBweSA9IFVwcHlcbm1vZHVsZS5leHBvcnRzLlBsdWdpbiA9IFBsdWdpblxuIiwiLy8gRWRnZSAxNS54IGRvZXMgbm90IGZpcmUgJ3Byb2dyZXNzJyBldmVudHMgb24gdXBsb2Fkcy5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vdHJhbnNsb2FkaXQvdXBweS9pc3N1ZXMvOTQ1XG4vLyBBbmQgaHR0cHM6Ly9kZXZlbG9wZXIubWljcm9zb2Z0LmNvbS9lbi11cy9taWNyb3NvZnQtZWRnZS9wbGF0Zm9ybS9pc3N1ZXMvMTIyMjQ1MTAvXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN1cHBvcnRzVXBsb2FkUHJvZ3Jlc3MgKHVzZXJBZ2VudCkge1xuICAvLyBBbGxvdyBwYXNzaW5nIGluIHVzZXJBZ2VudCBmb3IgdGVzdHNcbiAgaWYgKHVzZXJBZ2VudCA9PSBudWxsKSB7XG4gICAgdXNlckFnZW50ID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgPyBuYXZpZ2F0b3IudXNlckFnZW50IDogbnVsbFxuICB9XG4gIC8vIEFzc3VtZSBpdCB3b3JrcyBiZWNhdXNlIGJhc2ljYWxseSBldmVyeXRoaW5nIHN1cHBvcnRzIHByb2dyZXNzIGV2ZW50cy5cbiAgaWYgKCF1c2VyQWdlbnQpIHJldHVybiB0cnVlXG5cbiAgY29uc3QgbSA9IC9FZGdlXFwvKFxcZCtcXC5cXGQrKS8uZXhlYyh1c2VyQWdlbnQpXG4gIGlmICghbSkgcmV0dXJuIHRydWVcblxuICBjb25zdCBlZGdlVmVyc2lvbiA9IG1bMV1cbiAgbGV0IFttYWpvciwgbWlub3JdID0gZWRnZVZlcnNpb24uc3BsaXQoJy4nKVxuICBtYWpvciA9IHBhcnNlSW50KG1ham9yLCAxMClcbiAgbWlub3IgPSBwYXJzZUludChtaW5vciwgMTApXG5cbiAgLy8gV29ya2VkIGJlZm9yZTpcbiAgLy8gRWRnZSA0MC4xNTA2My4wLjBcbiAgLy8gTWljcm9zb2Z0IEVkZ2VIVE1MIDE1LjE1MDYzXG4gIGlmIChtYWpvciA8IDE1IHx8IChtYWpvciA9PT0gMTUgJiYgbWlub3IgPCAxNTA2MykpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLy8gRml4ZWQgaW46XG4gIC8vIE1pY3Jvc29mdCBFZGdlSFRNTCAxOC4xODIxOFxuICBpZiAobWFqb3IgPiAxOCB8fCAobWFqb3IgPT09IDE4ICYmIG1pbm9yID49IDE4MjE4KSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvLyBvdGhlciB2ZXJzaW9ucyBkb24ndCB3b3JrLlxuICByZXR1cm4gZmFsc2Vcbn1cbiIsImNvbnN0IHsgUGx1Z2luIH0gPSByZXF1aXJlKCdAdXBweS9jb3JlJylcbmNvbnN0IFRyYW5zbGF0b3IgPSByZXF1aXJlKCdAdXBweS91dGlscy9saWIvVHJhbnNsYXRvcicpXG5jb25zdCB0b0FycmF5ID0gcmVxdWlyZSgnQHVwcHkvdXRpbHMvbGliL3RvQXJyYXknKVxuY29uc3QgZHJhZ0Ryb3AgPSByZXF1aXJlKCdkcmFnLWRyb3AnKVxuY29uc3QgeyBoIH0gPSByZXF1aXJlKCdwcmVhY3QnKVxuXG4vKipcbiAqIERyYWcgJiBEcm9wIHBsdWdpblxuICpcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcmFnRHJvcCBleHRlbmRzIFBsdWdpbiB7XG4gIGNvbnN0cnVjdG9yICh1cHB5LCBvcHRzKSB7XG4gICAgc3VwZXIodXBweSwgb3B0cylcbiAgICB0aGlzLnR5cGUgPSAnYWNxdWlyZXInXG4gICAgdGhpcy5pZCA9IHRoaXMub3B0cy5pZCB8fCAnRHJhZ0Ryb3AnXG4gICAgdGhpcy50aXRsZSA9ICdEcmFnICYgRHJvcCdcblxuICAgIHRoaXMuZGVmYXVsdExvY2FsZSA9IHtcbiAgICAgIHN0cmluZ3M6IHtcbiAgICAgICAgZHJvcEhlcmVPcjogJ0Ryb3AgZmlsZXMgaGVyZSBvciAle2Jyb3dzZX0nLFxuICAgICAgICBicm93c2U6ICdicm93c2UnXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBvcHRpb25zXG4gICAgY29uc3QgZGVmYXVsdE9wdHMgPSB7XG4gICAgICB0YXJnZXQ6IG51bGwsXG4gICAgICBpbnB1dE5hbWU6ICdmaWxlc1tdJyxcbiAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgIG5vdGU6IG51bGxcbiAgICB9XG5cbiAgICAvLyBNZXJnZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgb25lcyBzZXQgYnkgdXNlclxuICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRzLCBvcHRzKVxuXG4gICAgLy8gQ2hlY2sgZm9yIGJyb3dzZXIgZHJhZ0Ryb3Agc3VwcG9ydFxuICAgIHRoaXMuaXNEcmFnRHJvcFN1cHBvcnRlZCA9IHRoaXMuY2hlY2tEcmFnRHJvcFN1cHBvcnQoKVxuXG4gICAgLy8gaTE4blxuICAgIHRoaXMudHJhbnNsYXRvciA9IG5ldyBUcmFuc2xhdG9yKFsgdGhpcy5kZWZhdWx0TG9jYWxlLCB0aGlzLnVwcHkubG9jYWxlLCB0aGlzLm9wdHMubG9jYWxlIF0pXG4gICAgdGhpcy5pMThuID0gdGhpcy50cmFuc2xhdG9yLnRyYW5zbGF0ZS5iaW5kKHRoaXMudHJhbnNsYXRvcilcbiAgICB0aGlzLmkxOG5BcnJheSA9IHRoaXMudHJhbnNsYXRvci50cmFuc2xhdGVBcnJheS5iaW5kKHRoaXMudHJhbnNsYXRvcilcblxuICAgIC8vIEJpbmQgYHRoaXNgIHRvIGNsYXNzIG1ldGhvZHNcbiAgICB0aGlzLmhhbmRsZURyb3AgPSB0aGlzLmhhbmRsZURyb3AuYmluZCh0aGlzKVxuICAgIHRoaXMuaGFuZGxlSW5wdXRDaGFuZ2UgPSB0aGlzLmhhbmRsZUlucHV0Q2hhbmdlLmJpbmQodGhpcylcbiAgICB0aGlzLmNoZWNrRHJhZ0Ryb3BTdXBwb3J0ID0gdGhpcy5jaGVja0RyYWdEcm9wU3VwcG9ydC5iaW5kKHRoaXMpXG4gICAgdGhpcy5yZW5kZXIgPSB0aGlzLnJlbmRlci5iaW5kKHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIERyYWcgJiBEcm9wIChub3Qgc3VwcG9ydGVkIG9uIG1vYmlsZSBkZXZpY2VzLCBmb3IgZXhhbXBsZSkuXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBjaGVja0RyYWdEcm9wU3VwcG9ydCAoKSB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcblxuICAgIGlmICghKCdkcmFnZ2FibGUnIGluIGRpdikgfHwgISgnb25kcmFnc3RhcnQnIGluIGRpdiAmJiAnb25kcm9wJyBpbiBkaXYpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBpZiAoISgnRm9ybURhdGEnIGluIHdpbmRvdykpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlmICghKCdGaWxlUmVhZGVyJyBpbiB3aW5kb3cpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgaGFuZGxlRHJvcCAoZmlsZXMpIHtcbiAgICB0aGlzLnVwcHkubG9nKCdbRHJhZ0Ryb3BdIEZpbGVzIGRyb3BwZWQnKVxuXG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy51cHB5LmFkZEZpbGUoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcy5pZCxcbiAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgdHlwZTogZmlsZS50eXBlLFxuICAgICAgICAgIGRhdGE6IGZpbGVcbiAgICAgICAgfSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBOb3RoaW5nLCByZXN0cmljdGlvbiBlcnJvcnMgaGFuZGxlZCBpbiBDb3JlXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGhhbmRsZUlucHV0Q2hhbmdlIChldikge1xuICAgIHRoaXMudXBweS5sb2coJ1tEcmFnRHJvcF0gRmlsZXMgc2VsZWN0ZWQgdGhyb3VnaCBpbnB1dCcpXG5cbiAgICBjb25zdCBmaWxlcyA9IHRvQXJyYXkoZXYudGFyZ2V0LmZpbGVzKVxuXG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy51cHB5LmFkZEZpbGUoe1xuICAgICAgICAgIHNvdXJjZTogdGhpcy5pZCxcbiAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgdHlwZTogZmlsZS50eXBlLFxuICAgICAgICAgIGRhdGE6IGZpbGVcbiAgICAgICAgfSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBOb3RoaW5nLCByZXN0cmljdGlvbiBlcnJvcnMgaGFuZGxlZCBpbiBDb3JlXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoc3RhdGUpIHtcbiAgICAvKiBodHRwOi8vdHltcGFudXMubmV0L2NvZHJvcHMvMjAxNS8wOS8xNS9zdHlsaW5nLWN1c3RvbWl6aW5nLWZpbGUtaW5wdXRzLXNtYXJ0LXdheS8gKi9cbiAgICBjb25zdCBoaWRkZW5JbnB1dFN0eWxlID0ge1xuICAgICAgd2lkdGg6ICcwLjFweCcsXG4gICAgICBoZWlnaHQ6ICcwLjFweCcsXG4gICAgICBvcGFjaXR5OiAwLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICB6SW5kZXg6IC0xXG4gICAgfVxuICAgIGNvbnN0IERyYWdEcm9wQ2xhc3MgPSBgdXBweS1Sb290IHVwcHktRHJhZ0Ryb3AtY29udGFpbmVyICR7dGhpcy5pc0RyYWdEcm9wU3VwcG9ydGVkID8gJ3VwcHktRHJhZ0Ryb3AtLWlzLWRyYWdkcm9wLXN1cHBvcnRlZCcgOiAnJ31gXG4gICAgY29uc3QgRHJhZ0Ryb3BTdHlsZSA9IHtcbiAgICAgIHdpZHRoOiB0aGlzLm9wdHMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMub3B0cy5oZWlnaHRcbiAgICB9XG4gICAgY29uc3QgcmVzdHJpY3Rpb25zID0gdGhpcy51cHB5Lm9wdHMucmVzdHJpY3Rpb25zXG5cbiAgICAvLyBlbXB0eSB2YWx1ZT1cIlwiIG9uIGZpbGUgaW5wdXQsIHNvIHRoYXQgdGhlIGlucHV0IGlzIGNsZWFyZWQgYWZ0ZXIgYSBmaWxlIGlzIHNlbGVjdGVkLFxuICAgIC8vIGJlY2F1c2UgVXBweSB3aWxsIGJlIGhhbmRsaW5nIHRoZSB1cGxvYWQgYW5kIHNvIHdlIGNhbiBzZWxlY3Qgc2FtZSBmaWxlXG4gICAgLy8gYWZ0ZXIgcmVtb3Zpbmcg4oCUIG90aGVyd2lzZSBicm93c2VyIHRoaW5rcyBpdOKAmXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzPXtEcmFnRHJvcENsYXNzfSBzdHlsZT17RHJhZ0Ryb3BTdHlsZX0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ1cHB5LURyYWdEcm9wLWlubmVyXCI+XG4gICAgICAgICAgPHN2ZyBhcmlhLWhpZGRlbj1cInRydWVcIiBjbGFzcz1cIlVwcHlJY29uIHVwcHktRHJhZ0Ryb3AtYXJyb3dcIiB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCI+XG4gICAgICAgICAgICA8cGF0aCBkPVwiTTExIDEwVjBINXYxMEgybDYgNiA2LTZoLTN6bTAgMFwiIGZpbGwtcnVsZT1cImV2ZW5vZGRcIiAvPlxuICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInVwcHktRHJhZ0Ryb3AtbGFiZWxcIj5cbiAgICAgICAgICAgIDxpbnB1dCBzdHlsZT17aGlkZGVuSW5wdXRTdHlsZX1cbiAgICAgICAgICAgICAgY2xhc3M9XCJ1cHB5LURyYWdEcm9wLWlucHV0XCJcbiAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICBuYW1lPXt0aGlzLm9wdHMuaW5wdXROYW1lfVxuICAgICAgICAgICAgICBtdWx0aXBsZT17cmVzdHJpY3Rpb25zLm1heE51bWJlck9mRmlsZXMgIT09IDF9XG4gICAgICAgICAgICAgIGFjY2VwdD17cmVzdHJpY3Rpb25zLmFsbG93ZWRGaWxlVHlwZXN9XG4gICAgICAgICAgICAgIHJlZj17KGlucHV0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dCA9IGlucHV0XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG9uY2hhbmdlPXt0aGlzLmhhbmRsZUlucHV0Q2hhbmdlfVxuICAgICAgICAgICAgICB2YWx1ZT1cIlwiIC8+XG4gICAgICAgICAgICB7dGhpcy5pMThuQXJyYXkoJ2Ryb3BIZXJlT3InLCB7XG4gICAgICAgICAgICAgIGJyb3dzZTogPHNwYW4gY2xhc3M9XCJ1cHB5LURyYWdEcm9wLWRyYWdUZXh0XCI+e3RoaXMuaTE4bignYnJvd3NlJyl9PC9zcGFuPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInVwcHktRHJhZ0Ryb3Atbm90ZVwiPnt0aGlzLm9wdHMubm90ZX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG5cbiAgaW5zdGFsbCAoKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5vcHRzLnRhcmdldFxuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHRoaXMubW91bnQodGFyZ2V0LCB0aGlzKVxuICAgIH1cbiAgICB0aGlzLnJlbW92ZURyYWdEcm9wTGlzdGVuZXIgPSBkcmFnRHJvcCh0aGlzLmVsLCAoZmlsZXMpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlRHJvcChmaWxlcylcbiAgICAgIHRoaXMudXBweS5sb2coZmlsZXMpXG4gICAgfSlcbiAgfVxuXG4gIHVuaW5zdGFsbCAoKSB7XG4gICAgdGhpcy51bm1vdW50KClcbiAgICB0aGlzLnJlbW92ZURyYWdEcm9wTGlzdGVuZXIoKVxuICB9XG59XG4iLCJjb25zdCB7IFBsdWdpbiB9ID0gcmVxdWlyZSgnQHVwcHkvY29yZScpXG5jb25zdCB7IGggfSA9IHJlcXVpcmUoJ3ByZWFjdCcpXG5cbi8qKlxuICogUHJvZ3Jlc3MgYmFyXG4gKlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFByb2dyZXNzQmFyIGV4dGVuZHMgUGx1Z2luIHtcbiAgY29uc3RydWN0b3IgKHVwcHksIG9wdHMpIHtcbiAgICBzdXBlcih1cHB5LCBvcHRzKVxuICAgIHRoaXMuaWQgPSB0aGlzLm9wdHMuaWQgfHwgJ1Byb2dyZXNzQmFyJ1xuICAgIHRoaXMudGl0bGUgPSAnUHJvZ3Jlc3MgQmFyJ1xuICAgIHRoaXMudHlwZSA9ICdwcm9ncmVzc2luZGljYXRvcidcblxuICAgIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHRhcmdldDogJ2JvZHknLFxuICAgICAgcmVwbGFjZVRhcmdldENvbnRlbnQ6IGZhbHNlLFxuICAgICAgZml4ZWQ6IGZhbHNlLFxuICAgICAgaGlkZUFmdGVyRmluaXNoOiB0cnVlXG4gICAgfVxuXG4gICAgLy8gbWVyZ2UgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIG9uZXMgc2V0IGJ5IHVzZXJcbiAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0cylcblxuICAgIHRoaXMucmVuZGVyID0gdGhpcy5yZW5kZXIuYmluZCh0aGlzKVxuICB9XG5cbiAgcmVuZGVyIChzdGF0ZSkge1xuICAgIGNvbnN0IHByb2dyZXNzID0gc3RhdGUudG90YWxQcm9ncmVzcyB8fCAwXG4gICAgY29uc3QgaXNIaWRkZW4gPSBwcm9ncmVzcyA9PT0gMTAwICYmIHRoaXMub3B0cy5oaWRlQWZ0ZXJGaW5pc2hcbiAgICByZXR1cm4gPGRpdiBjbGFzcz1cInVwcHkgdXBweS1Qcm9ncmVzc0JhclwiIHN0eWxlPXt7IHBvc2l0aW9uOiB0aGlzLm9wdHMuZml4ZWQgPyAnZml4ZWQnIDogJ2luaXRpYWwnIH19IGFyaWEtaGlkZGVuPXtpc0hpZGRlbn0+XG4gICAgICA8ZGl2IGNsYXNzPVwidXBweS1Qcm9ncmVzc0Jhci1pbm5lclwiIHN0eWxlPXt7IHdpZHRoOiBwcm9ncmVzcyArICclJyB9fSAvPlxuICAgICAgPGRpdiBjbGFzcz1cInVwcHktUHJvZ3Jlc3NCYXItcGVyY2VudGFnZVwiPntwcm9ncmVzc308L2Rpdj5cbiAgICA8L2Rpdj5cbiAgfVxuXG4gIGluc3RhbGwgKCkge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMub3B0cy50YXJnZXRcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICB0aGlzLm1vdW50KHRhcmdldCwgdGhpcylcbiAgICB9XG4gIH1cblxuICB1bmluc3RhbGwgKCkge1xuICAgIHRoaXMudW5tb3VudCgpXG4gIH1cbn1cbiIsIi8qKlxuICogRGVmYXVsdCBzdG9yZSB0aGF0IGtlZXBzIHN0YXRlIGluIGEgc2ltcGxlIG9iamVjdC5cbiAqL1xuY2xhc3MgRGVmYXVsdFN0b3JlIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuc3RhdGUgPSB7fVxuICAgIHRoaXMuY2FsbGJhY2tzID0gW11cbiAgfVxuXG4gIGdldFN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZVxuICB9XG5cbiAgc2V0U3RhdGUgKHBhdGNoKSB7XG4gICAgY29uc3QgcHJldlN0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0ZSlcbiAgICBjb25zdCBuZXh0U3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnN0YXRlLCBwYXRjaClcblxuICAgIHRoaXMuc3RhdGUgPSBuZXh0U3RhdGVcbiAgICB0aGlzLl9wdWJsaXNoKHByZXZTdGF0ZSwgbmV4dFN0YXRlLCBwYXRjaClcbiAgfVxuXG4gIHN1YnNjcmliZSAobGlzdGVuZXIpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKGxpc3RlbmVyKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAvLyBSZW1vdmUgdGhlIGxpc3RlbmVyLlxuICAgICAgdGhpcy5jYWxsYmFja3Muc3BsaWNlKFxuICAgICAgICB0aGlzLmNhbGxiYWNrcy5pbmRleE9mKGxpc3RlbmVyKSxcbiAgICAgICAgMVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIF9wdWJsaXNoICguLi5hcmdzKSB7XG4gICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmF1bHRTdG9yZSAoKSB7XG4gIHJldHVybiBuZXcgRGVmYXVsdFN0b3JlKClcbn1cbiIsImNvbnN0IHsgUGx1Z2luIH0gPSByZXF1aXJlKCdAdXBweS9jb3JlJylcbmNvbnN0IHR1cyA9IHJlcXVpcmUoJ3R1cy1qcy1jbGllbnQnKVxuY29uc3QgeyBQcm92aWRlciwgUmVxdWVzdENsaWVudCwgU29ja2V0IH0gPSByZXF1aXJlKCdAdXBweS9jb21wYW5pb24tY2xpZW50JylcbmNvbnN0IGVtaXRTb2NrZXRQcm9ncmVzcyA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9lbWl0U29ja2V0UHJvZ3Jlc3MnKVxuY29uc3QgZ2V0U29ja2V0SG9zdCA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZXRTb2NrZXRIb3N0JylcbmNvbnN0IHNldHRsZSA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9zZXR0bGUnKVxuY29uc3QgbGltaXRQcm9taXNlcyA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9saW1pdFByb21pc2VzJylcblxuLy8gRXh0cmFjdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3R1cy90dXMtanMtY2xpZW50L2Jsb2IvbWFzdGVyL2xpYi91cGxvYWQuanMjTDEzXG4vLyBleGNlcHRlZCB3ZSByZW1vdmVkICdmaW5nZXJwcmludCcga2V5IHRvIGF2b2lkIGFkZGluZyBtb3JlIGRlcGVuZGVuY2llc1xuY29uc3QgdHVzRGVmYXVsdE9wdGlvbnMgPSB7XG4gIGVuZHBvaW50OiAnJyxcbiAgcmVzdW1lOiB0cnVlLFxuICBvblByb2dyZXNzOiBudWxsLFxuICBvbkNodW5rQ29tcGxldGU6IG51bGwsXG4gIG9uU3VjY2VzczogbnVsbCxcbiAgb25FcnJvcjogbnVsbCxcbiAgaGVhZGVyczoge30sXG4gIGNodW5rU2l6ZTogSW5maW5pdHksXG4gIHdpdGhDcmVkZW50aWFsczogZmFsc2UsXG4gIHVwbG9hZFVybDogbnVsbCxcbiAgdXBsb2FkU2l6ZTogbnVsbCxcbiAgb3ZlcnJpZGVQYXRjaE1ldGhvZDogZmFsc2UsXG4gIHJldHJ5RGVsYXlzOiBudWxsXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgd3JhcHBlciBhcm91bmQgYW4gZXZlbnQgZW1pdHRlciB3aXRoIGEgYHJlbW92ZWAgbWV0aG9kIHRvIHJlbW92ZVxuICogYWxsIGV2ZW50cyB0aGF0IHdlcmUgYWRkZWQgdXNpbmcgdGhlIHdyYXBwZWQgZW1pdHRlci5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRXZlbnRUcmFja2VyIChlbWl0dGVyKSB7XG4gIGNvbnN0IGV2ZW50cyA9IFtdXG4gIHJldHVybiB7XG4gICAgb24gKGV2ZW50LCBmbikge1xuICAgICAgZXZlbnRzLnB1c2goWyBldmVudCwgZm4gXSlcbiAgICAgIHJldHVybiBlbWl0dGVyLm9uKGV2ZW50LCBmbilcbiAgICB9LFxuICAgIHJlbW92ZSAoKSB7XG4gICAgICBldmVudHMuZm9yRWFjaCgoWyBldmVudCwgZm4gXSkgPT4ge1xuICAgICAgICBlbWl0dGVyLm9mZihldmVudCwgZm4pXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFR1cyByZXN1bWFibGUgZmlsZSB1cGxvYWRlclxuICpcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUdXMgZXh0ZW5kcyBQbHVnaW4ge1xuICBjb25zdHJ1Y3RvciAodXBweSwgb3B0cykge1xuICAgIHN1cGVyKHVwcHksIG9wdHMpXG4gICAgdGhpcy50eXBlID0gJ3VwbG9hZGVyJ1xuICAgIHRoaXMuaWQgPSAnVHVzJ1xuICAgIHRoaXMudGl0bGUgPSAnVHVzJ1xuXG4gICAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgcmVzdW1lOiB0cnVlLFxuICAgICAgYXV0b1JldHJ5OiB0cnVlLFxuICAgICAgdXNlRmFzdFJlbW90ZVJldHJ5OiB0cnVlLFxuICAgICAgbGltaXQ6IDAsXG4gICAgICByZXRyeURlbGF5czogWzAsIDEwMDAsIDMwMDAsIDUwMDBdXG4gICAgfVxuXG4gICAgLy8gbWVyZ2UgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIG9uZXMgc2V0IGJ5IHVzZXJcbiAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0cylcblxuICAgIC8vIFNpbXVsdGFuZW91cyB1cGxvYWQgbGltaXRpbmcgaXMgc2hhcmVkIGFjcm9zcyBhbGwgdXBsb2FkcyB3aXRoIHRoaXMgcGx1Z2luLlxuICAgIGlmICh0eXBlb2YgdGhpcy5vcHRzLmxpbWl0ID09PSAnbnVtYmVyJyAmJiB0aGlzLm9wdHMubGltaXQgIT09IDApIHtcbiAgICAgIHRoaXMubGltaXRVcGxvYWRzID0gbGltaXRQcm9taXNlcyh0aGlzLm9wdHMubGltaXQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGltaXRVcGxvYWRzID0gKGZuKSA9PiBmblxuICAgIH1cblxuICAgIHRoaXMudXBsb2FkZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgIHRoaXMudXBsb2FkZXJFdmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgdGhpcy51cGxvYWRlclNvY2tldHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICB0aGlzLmhhbmRsZVJlc2V0UHJvZ3Jlc3MgPSB0aGlzLmhhbmRsZVJlc2V0UHJvZ3Jlc3MuYmluZCh0aGlzKVxuICAgIHRoaXMuaGFuZGxlVXBsb2FkID0gdGhpcy5oYW5kbGVVcGxvYWQuYmluZCh0aGlzKVxuICB9XG5cbiAgaGFuZGxlUmVzZXRQcm9ncmVzcyAoKSB7XG4gICAgY29uc3QgZmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnVwcHkuZ2V0U3RhdGUoKS5maWxlcylcbiAgICBPYmplY3Qua2V5cyhmaWxlcykuZm9yRWFjaCgoZmlsZUlEKSA9PiB7XG4gICAgICAvLyBPbmx5IGNsb25lIHRoZSBmaWxlIG9iamVjdCBpZiBpdCBoYXMgYSBUdXMgYHVwbG9hZFVybGAgYXR0YWNoZWQuXG4gICAgICBpZiAoZmlsZXNbZmlsZUlEXS50dXMgJiYgZmlsZXNbZmlsZUlEXS50dXMudXBsb2FkVXJsKSB7XG4gICAgICAgIGNvbnN0IHR1c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgZmlsZXNbZmlsZUlEXS50dXMpXG4gICAgICAgIGRlbGV0ZSB0dXNTdGF0ZS51cGxvYWRVcmxcbiAgICAgICAgZmlsZXNbZmlsZUlEXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpbGVzW2ZpbGVJRF0sIHsgdHVzOiB0dXNTdGF0ZSB9KVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLnVwcHkuc2V0U3RhdGUoeyBmaWxlcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENsZWFuIHVwIGFsbCByZWZlcmVuY2VzIGZvciBhIGZpbGUncyB1cGxvYWQ6IHRoZSB0dXMuVXBsb2FkIGluc3RhbmNlLFxuICAgKiBhbnkgZXZlbnRzIHJlbGF0ZWQgdG8gdGhlIGZpbGUsIGFuZCB0aGUgQ29tcGFuaW9uIFdlYlNvY2tldCBjb25uZWN0aW9uLlxuICAgKi9cbiAgcmVzZXRVcGxvYWRlclJlZmVyZW5jZXMgKGZpbGVJRCkge1xuICAgIGlmICh0aGlzLnVwbG9hZGVyc1tmaWxlSURdKSB7XG4gICAgICB0aGlzLnVwbG9hZGVyc1tmaWxlSURdLmFib3J0KClcbiAgICAgIHRoaXMudXBsb2FkZXJzW2ZpbGVJRF0gPSBudWxsXG4gICAgfVxuICAgIGlmICh0aGlzLnVwbG9hZGVyRXZlbnRzW2ZpbGVJRF0pIHtcbiAgICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5yZW1vdmUoKVxuICAgICAgdGhpcy51cGxvYWRlckV2ZW50c1tmaWxlSURdID0gbnVsbFxuICAgIH1cbiAgICBpZiAodGhpcy51cGxvYWRlclNvY2tldHNbZmlsZUlEXSkge1xuICAgICAgdGhpcy51cGxvYWRlclNvY2tldHNbZmlsZUlEXS5jbG9zZSgpXG4gICAgICB0aGlzLnVwbG9hZGVyU29ja2V0c1tmaWxlSURdID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgVHVzIHVwbG9hZFxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gZmlsZSBmb3IgdXNlIHdpdGggdXBsb2FkXG4gICAqIEBwYXJhbSB7aW50ZWdlcn0gY3VycmVudCBmaWxlIGluIGEgcXVldWVcbiAgICogQHBhcmFtIHtpbnRlZ2VyfSB0b3RhbCBudW1iZXIgb2YgZmlsZXMgaW4gYSBxdWV1ZVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHVwbG9hZCAoZmlsZSwgY3VycmVudCwgdG90YWwpIHtcbiAgICB0aGlzLnJlc2V0VXBsb2FkZXJSZWZlcmVuY2VzKGZpbGUuaWQpXG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgdHVzIHVwbG9hZFxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBvcHRzVHVzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAge30sXG4gICAgICAgIHR1c0RlZmF1bHRPcHRpb25zLFxuICAgICAgICB0aGlzLm9wdHMsXG4gICAgICAgIC8vIEluc3RhbGwgZmlsZS1zcGVjaWZpYyB1cGxvYWQgb3ZlcnJpZGVzLlxuICAgICAgICBmaWxlLnR1cyB8fCB7fVxuICAgICAgKVxuXG4gICAgICBvcHRzVHVzLm9uRXJyb3IgPSAoZXJyKSA9PiB7XG4gICAgICAgIHRoaXMudXBweS5sb2coZXJyKVxuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLWVycm9yJywgZmlsZSwgZXJyKVxuICAgICAgICBlcnIubWVzc2FnZSA9IGBGYWlsZWQgYmVjYXVzZTogJHtlcnIubWVzc2FnZX1gXG5cbiAgICAgICAgdGhpcy5yZXNldFVwbG9hZGVyUmVmZXJlbmNlcyhmaWxlLmlkKVxuICAgICAgICByZWplY3QoZXJyKVxuICAgICAgfVxuXG4gICAgICBvcHRzVHVzLm9uUHJvZ3Jlc3MgPSAoYnl0ZXNVcGxvYWRlZCwgYnl0ZXNUb3RhbCkgPT4ge1xuICAgICAgICB0aGlzLm9uUmVjZWl2ZVVwbG9hZFVybChmaWxlLCB1cGxvYWQudXJsKVxuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLXByb2dyZXNzJywgZmlsZSwge1xuICAgICAgICAgIHVwbG9hZGVyOiB0aGlzLFxuICAgICAgICAgIGJ5dGVzVXBsb2FkZWQ6IGJ5dGVzVXBsb2FkZWQsXG4gICAgICAgICAgYnl0ZXNUb3RhbDogYnl0ZXNUb3RhbFxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBvcHRzVHVzLm9uU3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdXBsb2FkUmVzcCA9IHtcbiAgICAgICAgICB1cGxvYWRVUkw6IHVwbG9hZC51cmxcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBweS5lbWl0KCd1cGxvYWQtc3VjY2VzcycsIGZpbGUsIHVwbG9hZFJlc3ApXG5cbiAgICAgICAgaWYgKHVwbG9hZC51cmwpIHtcbiAgICAgICAgICB0aGlzLnVwcHkubG9nKCdEb3dubG9hZCAnICsgdXBsb2FkLmZpbGUubmFtZSArICcgZnJvbSAnICsgdXBsb2FkLnVybClcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVzZXRVcGxvYWRlclJlZmVyZW5jZXMoZmlsZS5pZClcbiAgICAgICAgcmVzb2x2ZSh1cGxvYWQpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvcHlQcm9wID0gKG9iaiwgc3JjUHJvcCwgZGVzdFByb3ApID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHNyY1Byb3ApICYmXG4gICAgICAgICAgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGRlc3RQcm9wKVxuICAgICAgICApIHtcbiAgICAgICAgICBvYmpbZGVzdFByb3BdID0gb2JqW3NyY1Byb3BdXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdHVzZCB1c2VzIG1ldGFkYXRhIGZpZWxkcyAnZmlsZXR5cGUnIGFuZCAnZmlsZW5hbWUnXG4gICAgICBjb25zdCBtZXRhID0gT2JqZWN0LmFzc2lnbih7fSwgZmlsZS5tZXRhKVxuICAgICAgY29weVByb3AobWV0YSwgJ3R5cGUnLCAnZmlsZXR5cGUnKVxuICAgICAgY29weVByb3AobWV0YSwgJ25hbWUnLCAnZmlsZW5hbWUnKVxuICAgICAgb3B0c1R1cy5tZXRhZGF0YSA9IG1ldGFcblxuICAgICAgY29uc3QgdXBsb2FkID0gbmV3IHR1cy5VcGxvYWQoZmlsZS5kYXRhLCBvcHRzVHVzKVxuICAgICAgdGhpcy51cGxvYWRlcnNbZmlsZS5pZF0gPSB1cGxvYWRcbiAgICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZS5pZF0gPSBjcmVhdGVFdmVudFRyYWNrZXIodGhpcy51cHB5KVxuXG4gICAgICB0aGlzLm9uRmlsZVJlbW92ZShmaWxlLmlkLCAodGFyZ2V0RmlsZUlEKSA9PiB7XG4gICAgICAgIHRoaXMucmVzZXRVcGxvYWRlclJlZmVyZW5jZXMoZmlsZS5pZClcbiAgICAgICAgcmVzb2x2ZShgdXBsb2FkICR7dGFyZ2V0RmlsZUlEfSB3YXMgcmVtb3ZlZGApXG4gICAgICB9KVxuXG4gICAgICB0aGlzLm9uUGF1c2UoZmlsZS5pZCwgKGlzUGF1c2VkKSA9PiB7XG4gICAgICAgIGlmIChpc1BhdXNlZCkge1xuICAgICAgICAgIHVwbG9hZC5hYm9ydCgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBsb2FkLnN0YXJ0KClcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgdGhpcy5vblBhdXNlQWxsKGZpbGUuaWQsICgpID0+IHtcbiAgICAgICAgdXBsb2FkLmFib3J0KClcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMub25DYW5jZWxBbGwoZmlsZS5pZCwgKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc2V0VXBsb2FkZXJSZWZlcmVuY2VzKGZpbGUuaWQpXG4gICAgICAgIHJlc29sdmUoYHVwbG9hZCAke2ZpbGUuaWR9IHdhcyBjYW5jZWxlZGApXG4gICAgICB9KVxuXG4gICAgICB0aGlzLm9uUmVzdW1lQWxsKGZpbGUuaWQsICgpID0+IHtcbiAgICAgICAgaWYgKGZpbGUuZXJyb3IpIHtcbiAgICAgICAgICB1cGxvYWQuYWJvcnQoKVxuICAgICAgICB9XG4gICAgICAgIHVwbG9hZC5zdGFydCgpXG4gICAgICB9KVxuXG4gICAgICBpZiAoIWZpbGUuaXNQYXVzZWQpIHtcbiAgICAgICAgdXBsb2FkLnN0YXJ0KClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgdXBsb2FkUmVtb3RlIChmaWxlLCBjdXJyZW50LCB0b3RhbCkge1xuICAgIHRoaXMucmVzZXRVcGxvYWRlclJlZmVyZW5jZXMoZmlsZS5pZClcblxuICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB0aGlzLm9wdHMsXG4gICAgICAvLyBJbnN0YWxsIGZpbGUtc3BlY2lmaWMgdXBsb2FkIG92ZXJyaWRlcy5cbiAgICAgIGZpbGUudHVzIHx8IHt9XG4gICAgKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMudXBweS5sb2coZmlsZS5yZW1vdGUudXJsKVxuICAgICAgaWYgKGZpbGUuc2VydmVyVG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdFRvU2VydmVyU29ja2V0KGZpbGUpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKVxuICAgICAgICAgIC5jYXRjaChyZWplY3QpXG4gICAgICB9XG5cbiAgICAgIHRoaXMudXBweS5lbWl0KCd1cGxvYWQtc3RhcnRlZCcsIGZpbGUpXG4gICAgICBjb25zdCBDbGllbnQgPSBmaWxlLnJlbW90ZS5wcm92aWRlck9wdGlvbnMucHJvdmlkZXIgPyBQcm92aWRlciA6IFJlcXVlc3RDbGllbnRcbiAgICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQodGhpcy51cHB5LCBmaWxlLnJlbW90ZS5wcm92aWRlck9wdGlvbnMpXG4gICAgICBjbGllbnQucG9zdChcbiAgICAgICAgZmlsZS5yZW1vdGUudXJsLFxuICAgICAgICBPYmplY3QuYXNzaWduKHt9LCBmaWxlLnJlbW90ZS5ib2R5LCB7XG4gICAgICAgICAgZW5kcG9pbnQ6IG9wdHMuZW5kcG9pbnQsXG4gICAgICAgICAgdXBsb2FkVXJsOiBvcHRzLnVwbG9hZFVybCxcbiAgICAgICAgICBwcm90b2NvbDogJ3R1cycsXG4gICAgICAgICAgc2l6ZTogZmlsZS5kYXRhLnNpemUsXG4gICAgICAgICAgbWV0YWRhdGE6IGZpbGUubWV0YVxuICAgICAgICB9KVxuICAgICAgKS50aGVuKChyZXMpID0+IHtcbiAgICAgICAgdGhpcy51cHB5LnNldEZpbGVTdGF0ZShmaWxlLmlkLCB7IHNlcnZlclRva2VuOiByZXMudG9rZW4gfSlcbiAgICAgICAgZmlsZSA9IHRoaXMudXBweS5nZXRGaWxlKGZpbGUuaWQpXG4gICAgICAgIHJldHVybiBmaWxlXG4gICAgICB9KVxuICAgICAgLnRoZW4oKGZpbGUpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdFRvU2VydmVyU29ja2V0KGZpbGUpXG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGVycikpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBjb25uZWN0VG9TZXJ2ZXJTb2NrZXQgKGZpbGUpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdG9rZW4gPSBmaWxlLnNlcnZlclRva2VuXG4gICAgICBjb25zdCBob3N0ID0gZ2V0U29ja2V0SG9zdChmaWxlLnJlbW90ZS5jb21wYW5pb25VcmwpXG4gICAgICBjb25zdCBzb2NrZXQgPSBuZXcgU29ja2V0KHsgdGFyZ2V0OiBgJHtob3N0fS9hcGkvJHt0b2tlbn1gIH0pXG4gICAgICB0aGlzLnVwbG9hZGVyU29ja2V0c1tmaWxlLmlkXSA9IHNvY2tldFxuICAgICAgdGhpcy51cGxvYWRlckV2ZW50c1tmaWxlLmlkXSA9IGNyZWF0ZUV2ZW50VHJhY2tlcih0aGlzLnVwcHkpXG5cbiAgICAgIHRoaXMub25GaWxlUmVtb3ZlKGZpbGUuaWQsICgpID0+IHtcbiAgICAgICAgc29ja2V0LnNlbmQoJ3BhdXNlJywge30pXG4gICAgICAgIHJlc29sdmUoYHVwbG9hZCAke2ZpbGUuaWR9IHdhcyByZW1vdmVkYClcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMub25QYXVzZShmaWxlLmlkLCAoaXNQYXVzZWQpID0+IHtcbiAgICAgICAgaXNQYXVzZWQgPyBzb2NrZXQuc2VuZCgncGF1c2UnLCB7fSkgOiBzb2NrZXQuc2VuZCgncmVzdW1lJywge30pXG4gICAgICB9KVxuXG4gICAgICB0aGlzLm9uUGF1c2VBbGwoZmlsZS5pZCwgKCkgPT4gc29ja2V0LnNlbmQoJ3BhdXNlJywge30pKVxuXG4gICAgICB0aGlzLm9uQ2FuY2VsQWxsKGZpbGUuaWQsICgpID0+IHNvY2tldC5zZW5kKCdwYXVzZScsIHt9KSlcblxuICAgICAgdGhpcy5vblJlc3VtZUFsbChmaWxlLmlkLCAoKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLmVycm9yKSB7XG4gICAgICAgICAgc29ja2V0LnNlbmQoJ3BhdXNlJywge30pXG4gICAgICAgIH1cbiAgICAgICAgc29ja2V0LnNlbmQoJ3Jlc3VtZScsIHt9KVxuICAgICAgfSlcblxuICAgICAgdGhpcy5vblJldHJ5KGZpbGUuaWQsICgpID0+IHtcbiAgICAgICAgc29ja2V0LnNlbmQoJ3BhdXNlJywge30pXG4gICAgICAgIHNvY2tldC5zZW5kKCdyZXN1bWUnLCB7fSlcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMub25SZXRyeUFsbChmaWxlLmlkLCAoKSA9PiB7XG4gICAgICAgIHNvY2tldC5zZW5kKCdwYXVzZScsIHt9KVxuICAgICAgICBzb2NrZXQuc2VuZCgncmVzdW1lJywge30pXG4gICAgICB9KVxuXG4gICAgICBpZiAoZmlsZS5pc1BhdXNlZCkge1xuICAgICAgICBzb2NrZXQuc2VuZCgncGF1c2UnLCB7fSlcbiAgICAgIH1cblxuICAgICAgc29ja2V0Lm9uKCdwcm9ncmVzcycsIChwcm9ncmVzc0RhdGEpID0+IGVtaXRTb2NrZXRQcm9ncmVzcyh0aGlzLCBwcm9ncmVzc0RhdGEsIGZpbGUpKVxuXG4gICAgICBzb2NrZXQub24oJ2Vycm9yJywgKGVyckRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgeyBtZXNzYWdlIH0gPSBlcnJEYXRhLmVycm9yXG4gICAgICAgIGNvbnN0IGVycm9yID0gT2JqZWN0LmFzc2lnbihuZXcgRXJyb3IobWVzc2FnZSksIHsgY2F1c2U6IGVyckRhdGEuZXJyb3IgfSlcblxuICAgICAgICAvLyBJZiB0aGUgcmVtb3RlIHJldHJ5IG9wdGltaXNhdGlvbiBzaG91bGQgbm90IGJlIHVzZWQsXG4gICAgICAgIC8vIGNsb3NlIHRoZSBzb2NrZXTigJR0aGlzIHdpbGwgdGVsbCBjb21wYW5pb24gdG8gY2xlYXIgc3RhdGUgYW5kIGRlbGV0ZSB0aGUgZmlsZS5cbiAgICAgICAgaWYgKCF0aGlzLm9wdHMudXNlRmFzdFJlbW90ZVJldHJ5KSB7XG4gICAgICAgICAgdGhpcy5yZXNldFVwbG9hZGVyUmVmZXJlbmNlcyhmaWxlLmlkKVxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc2VydmVyVG9rZW4gc28gdGhhdCBhIG5ldyBvbmUgd2lsbCBiZSBjcmVhdGVkIGZvciB0aGUgcmV0cnkuXG4gICAgICAgICAgdGhpcy51cHB5LnNldEZpbGVTdGF0ZShmaWxlLmlkLCB7XG4gICAgICAgICAgICBzZXJ2ZXJUb2tlbjogbnVsbFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLWVycm9yJywgZmlsZSwgZXJyb3IpXG4gICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgIH0pXG5cbiAgICAgIHNvY2tldC5vbignc3VjY2VzcycsIChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwbG9hZFJlc3AgPSB7XG4gICAgICAgICAgdXBsb2FkVVJMOiBkYXRhLnVybFxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cHB5LmVtaXQoJ3VwbG9hZC1zdWNjZXNzJywgZmlsZSwgdXBsb2FkUmVzcClcbiAgICAgICAgdGhpcy5yZXNldFVwbG9hZGVyUmVmZXJlbmNlcyhmaWxlLmlkKVxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgdXBsb2FkVXJsIG9uIHRoZSBmaWxlIG9wdGlvbnMsIHNvIHRoYXQgd2hlbiBHb2xkZW4gUmV0cmlldmVyXG4gICAqIHJlc3RvcmVzIHN0YXRlLCB3ZSB3aWxsIGNvbnRpbnVlIHVwbG9hZGluZyB0byB0aGUgY29ycmVjdCBVUkwuXG4gICAqL1xuICBvblJlY2VpdmVVcGxvYWRVcmwgKGZpbGUsIHVwbG9hZFVSTCkge1xuICAgIGNvbnN0IGN1cnJlbnRGaWxlID0gdGhpcy51cHB5LmdldEZpbGUoZmlsZS5pZClcbiAgICBpZiAoIWN1cnJlbnRGaWxlKSByZXR1cm5cbiAgICAvLyBPbmx5IGRvIHRoZSB1cGRhdGUgaWYgd2UgZGlkbid0IGhhdmUgYW4gdXBsb2FkIFVSTCB5ZXQuXG4gICAgaWYgKCFjdXJyZW50RmlsZS50dXMgfHwgY3VycmVudEZpbGUudHVzLnVwbG9hZFVybCAhPT0gdXBsb2FkVVJMKSB7XG4gICAgICB0aGlzLnVwcHkubG9nKCdbVHVzXSBTdG9yaW5nIHVwbG9hZCB1cmwnKVxuICAgICAgdGhpcy51cHB5LnNldEZpbGVTdGF0ZShjdXJyZW50RmlsZS5pZCwge1xuICAgICAgICB0dXM6IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRGaWxlLnR1cywge1xuICAgICAgICAgIHVwbG9hZFVybDogdXBsb2FkVVJMXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIG9uRmlsZVJlbW92ZSAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbignZmlsZS1yZW1vdmVkJywgKGZpbGUpID0+IHtcbiAgICAgIGlmIChmaWxlSUQgPT09IGZpbGUuaWQpIGNiKGZpbGUuaWQpXG4gICAgfSlcbiAgfVxuXG4gIG9uUGF1c2UgKGZpbGVJRCwgY2IpIHtcbiAgICB0aGlzLnVwbG9hZGVyRXZlbnRzW2ZpbGVJRF0ub24oJ3VwbG9hZC1wYXVzZScsICh0YXJnZXRGaWxlSUQsIGlzUGF1c2VkKSA9PiB7XG4gICAgICBpZiAoZmlsZUlEID09PSB0YXJnZXRGaWxlSUQpIHtcbiAgICAgICAgLy8gY29uc3QgaXNQYXVzZWQgPSB0aGlzLnVwcHkucGF1c2VSZXN1bWUoZmlsZUlEKVxuICAgICAgICBjYihpc1BhdXNlZClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgb25SZXRyeSAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigndXBsb2FkLXJldHJ5JywgKHRhcmdldEZpbGVJRCkgPT4ge1xuICAgICAgaWYgKGZpbGVJRCA9PT0gdGFyZ2V0RmlsZUlEKSB7XG4gICAgICAgIGNiKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgb25SZXRyeUFsbCAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigncmV0cnktYWxsJywgKGZpbGVzVG9SZXRyeSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnVwcHkuZ2V0RmlsZShmaWxlSUQpKSByZXR1cm5cbiAgICAgIGNiKClcbiAgICB9KVxuICB9XG5cbiAgb25QYXVzZUFsbCAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigncGF1c2UtYWxsJywgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnVwcHkuZ2V0RmlsZShmaWxlSUQpKSByZXR1cm5cbiAgICAgIGNiKClcbiAgICB9KVxuICB9XG5cbiAgb25DYW5jZWxBbGwgKGZpbGVJRCwgY2IpIHtcbiAgICB0aGlzLnVwbG9hZGVyRXZlbnRzW2ZpbGVJRF0ub24oJ2NhbmNlbC1hbGwnLCAoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMudXBweS5nZXRGaWxlKGZpbGVJRCkpIHJldHVyblxuICAgICAgY2IoKVxuICAgIH0pXG4gIH1cblxuICBvblJlc3VtZUFsbCAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigncmVzdW1lLWFsbCcsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy51cHB5LmdldEZpbGUoZmlsZUlEKSkgcmV0dXJuXG4gICAgICBjYigpXG4gICAgfSlcbiAgfVxuXG4gIHVwbG9hZEZpbGVzIChmaWxlcykge1xuICAgIGNvbnN0IGFjdGlvbnMgPSBmaWxlcy5tYXAoKGZpbGUsIGkpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBwYXJzZUludChpLCAxMCkgKyAxXG4gICAgICBjb25zdCB0b3RhbCA9IGZpbGVzLmxlbmd0aFxuXG4gICAgICBpZiAoZmlsZS5lcnJvcikge1xuICAgICAgICByZXR1cm4gKCkgPT4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGZpbGUuZXJyb3IpKVxuICAgICAgfSBlbHNlIGlmIChmaWxlLmlzUmVtb3RlKSB7XG4gICAgICAgIC8vIFdlIGVtaXQgdXBsb2FkLXN0YXJ0ZWQgaGVyZSwgc28gdGhhdCBpdCdzIGFsc28gZW1pdHRlZCBmb3IgZmlsZXNcbiAgICAgICAgLy8gdGhhdCBoYXZlIHRvIHdhaXQgZHVlIHRvIHRoZSBgbGltaXRgIG9wdGlvbi5cbiAgICAgICAgdGhpcy51cHB5LmVtaXQoJ3VwbG9hZC1zdGFydGVkJywgZmlsZSlcbiAgICAgICAgcmV0dXJuIHRoaXMudXBsb2FkUmVtb3RlLmJpbmQodGhpcywgZmlsZSwgY3VycmVudCwgdG90YWwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLXN0YXJ0ZWQnLCBmaWxlKVxuICAgICAgICByZXR1cm4gdGhpcy51cGxvYWQuYmluZCh0aGlzLCBmaWxlLCBjdXJyZW50LCB0b3RhbClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgcHJvbWlzZXMgPSBhY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiB7XG4gICAgICBjb25zdCBsaW1pdGVkQWN0aW9uID0gdGhpcy5saW1pdFVwbG9hZHMoYWN0aW9uKVxuICAgICAgcmV0dXJuIGxpbWl0ZWRBY3Rpb24oKVxuICAgIH0pXG5cbiAgICByZXR1cm4gc2V0dGxlKHByb21pc2VzKVxuICB9XG5cbiAgaGFuZGxlVXBsb2FkIChmaWxlSURzKSB7XG4gICAgaWYgKGZpbGVJRHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnVwcHkubG9nKCdUdXM6IG5vIGZpbGVzIHRvIHVwbG9hZCEnKVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgfVxuXG4gICAgdGhpcy51cHB5LmxvZygnVHVzIGlzIHVwbG9hZGluZy4uLicpXG4gICAgY29uc3QgZmlsZXNUb1VwbG9hZCA9IGZpbGVJRHMubWFwKChmaWxlSUQpID0+IHRoaXMudXBweS5nZXRGaWxlKGZpbGVJRCkpXG5cbiAgICByZXR1cm4gdGhpcy51cGxvYWRGaWxlcyhmaWxlc1RvVXBsb2FkKVxuICAgICAgLnRoZW4oKCkgPT4gbnVsbClcbiAgfVxuXG4gIGluc3RhbGwgKCkge1xuICAgIHRoaXMudXBweS5zZXRTdGF0ZSh7XG4gICAgICBjYXBhYmlsaXRpZXM6IE9iamVjdC5hc3NpZ24oe30sIHRoaXMudXBweS5nZXRTdGF0ZSgpLmNhcGFiaWxpdGllcywge1xuICAgICAgICByZXN1bWFibGVVcGxvYWRzOiB0cnVlXG4gICAgICB9KVxuICAgIH0pXG4gICAgdGhpcy51cHB5LmFkZFVwbG9hZGVyKHRoaXMuaGFuZGxlVXBsb2FkKVxuXG4gICAgdGhpcy51cHB5Lm9uKCdyZXNldC1wcm9ncmVzcycsIHRoaXMuaGFuZGxlUmVzZXRQcm9ncmVzcylcblxuICAgIGlmICh0aGlzLm9wdHMuYXV0b1JldHJ5KSB7XG4gICAgICB0aGlzLnVwcHkub24oJ2JhY2stb25saW5lJywgdGhpcy51cHB5LnJldHJ5QWxsKVxuICAgIH1cbiAgfVxuXG4gIHVuaW5zdGFsbCAoKSB7XG4gICAgdGhpcy51cHB5LnNldFN0YXRlKHtcbiAgICAgIGNhcGFiaWxpdGllczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy51cHB5LmdldFN0YXRlKCkuY2FwYWJpbGl0aWVzLCB7XG4gICAgICAgIHJlc3VtYWJsZVVwbG9hZHM6IGZhbHNlXG4gICAgICB9KVxuICAgIH0pXG4gICAgdGhpcy51cHB5LnJlbW92ZVVwbG9hZGVyKHRoaXMuaGFuZGxlVXBsb2FkKVxuXG4gICAgaWYgKHRoaXMub3B0cy5hdXRvUmV0cnkpIHtcbiAgICAgIHRoaXMudXBweS5vZmYoJ2JhY2stb25saW5lJywgdGhpcy51cHB5LnJldHJ5QWxsKVxuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBUcmFuc2xhdGVzIHN0cmluZ3Mgd2l0aCBpbnRlcnBvbGF0aW9uICYgcGx1cmFsaXphdGlvbiBzdXBwb3J0LlxuICogRXh0ZW5zaWJsZSB3aXRoIGN1c3RvbSBkaWN0aW9uYXJpZXMgYW5kIHBsdXJhbGl6YXRpb24gZnVuY3Rpb25zLlxuICpcbiAqIEJvcnJvd3MgaGVhdmlseSBmcm9tIGFuZCBpbnNwaXJlZCBieSBQb2x5Z2xvdCBodHRwczovL2dpdGh1Yi5jb20vYWlyYm5iL3BvbHlnbG90LmpzLFxuICogYmFzaWNhbGx5IGEgc3RyaXBwZWQtZG93biB2ZXJzaW9uIG9mIGl0LiBEaWZmZXJlbmNlczogcGx1cmFsaXphdGlvbiBmdW5jdGlvbnMgYXJlIG5vdCBoYXJkY29kZWRcbiAqIGFuZCBjYW4gYmUgZWFzaWx5IGFkZGVkIGFtb25nIHdpdGggZGljdGlvbmFyaWVzLCBuZXN0ZWQgb2JqZWN0cyBhcmUgdXNlZCBmb3IgcGx1cmFsaXphdGlvblxuICogYXMgb3Bwb3NlZCB0byBgfHx8fGAgZGVsaW1ldGVyXG4gKlxuICogVXNhZ2UgZXhhbXBsZTogYHRyYW5zbGF0b3IudHJhbnNsYXRlKCdmaWxlc19jaG9zZW4nLCB7c21hcnRfY291bnQ6IDN9KWBcbiAqXG4gKiBAcGFyYW0ge29iamVjdHxBcnJheTxvYmplY3Q+fSBsb2NhbGUgTG9jYWxlIG9yIGxpc3Qgb2YgbG9jYWxlcy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUcmFuc2xhdG9yIHtcbiAgY29uc3RydWN0b3IgKGxvY2FsZXMpIHtcbiAgICB0aGlzLmxvY2FsZSA9IHtcbiAgICAgIHN0cmluZ3M6IHt9LFxuICAgICAgcGx1cmFsaXplOiBmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAobiA9PT0gMSkge1xuICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDFcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShsb2NhbGVzKSkge1xuICAgICAgbG9jYWxlcy5mb3JFYWNoKChsb2NhbGUpID0+IHRoaXMuX2FwcGx5KGxvY2FsZSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FwcGx5KGxvY2FsZXMpXG4gICAgfVxuICB9XG5cbiAgX2FwcGx5IChsb2NhbGUpIHtcbiAgICBpZiAoIWxvY2FsZSB8fCAhbG9jYWxlLnN0cmluZ3MpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHByZXZMb2NhbGUgPSB0aGlzLmxvY2FsZVxuICAgIHRoaXMubG9jYWxlID0gT2JqZWN0LmFzc2lnbih7fSwgcHJldkxvY2FsZSwge1xuICAgICAgc3RyaW5nczogT2JqZWN0LmFzc2lnbih7fSwgcHJldkxvY2FsZS5zdHJpbmdzLCBsb2NhbGUuc3RyaW5ncylcbiAgICB9KVxuICAgIHRoaXMubG9jYWxlLnBsdXJhbGl6ZSA9IGxvY2FsZS5wbHVyYWxpemUgfHwgcHJldkxvY2FsZS5wbHVyYWxpemVcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHN0cmluZyB3aXRoIHBsYWNlaG9sZGVyIHZhcmlhYmxlcyBsaWtlIGAle3NtYXJ0X2NvdW50fSBmaWxlIHNlbGVjdGVkYFxuICAgKiBhbmQgcmVwbGFjZXMgaXQgd2l0aCB2YWx1ZXMgZnJvbSBvcHRpb25zIGB7c21hcnRfY291bnQ6IDV9YFxuICAgKlxuICAgKiBAbGljZW5zZSBodHRwczovL2dpdGh1Yi5jb20vYWlyYm5iL3BvbHlnbG90LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiAgICogdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYWlyYm5iL3BvbHlnbG90LmpzL2Jsb2IvbWFzdGVyL2xpYi9wb2x5Z2xvdC5qcyNMMjk5XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwaHJhc2UgdGhhdCBuZWVkcyBpbnRlcnBvbGF0aW9uLCB3aXRoIHBsYWNlaG9sZGVyc1xuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB3aXRoIHZhbHVlcyB0aGF0IHdpbGwgYmUgdXNlZCB0byByZXBsYWNlIHBsYWNlaG9sZGVyc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGludGVycG9sYXRlZFxuICAgKi9cbiAgaW50ZXJwb2xhdGUgKHBocmFzZSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHsgc3BsaXQsIHJlcGxhY2UgfSA9IFN0cmluZy5wcm90b3R5cGVcbiAgICBjb25zdCBkb2xsYXJSZWdleCA9IC9cXCQvZ1xuICAgIGNvbnN0IGRvbGxhckJpbGxzWWFsbCA9ICckJCQkJ1xuICAgIGxldCBpbnRlcnBvbGF0ZWQgPSBbcGhyYXNlXVxuXG4gICAgZm9yIChsZXQgYXJnIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChhcmcgIT09ICdfJyAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KGFyZykpIHtcbiAgICAgICAgLy8gRW5zdXJlIHJlcGxhY2VtZW50IHZhbHVlIGlzIGVzY2FwZWQgdG8gcHJldmVudCBzcGVjaWFsICQtcHJlZml4ZWRcbiAgICAgICAgLy8gcmVnZXggcmVwbGFjZSB0b2tlbnMuIHRoZSBcIiQkJCRcIiBpcyBuZWVkZWQgYmVjYXVzZSBlYWNoIFwiJFwiIG5lZWRzIHRvXG4gICAgICAgIC8vIGJlIGVzY2FwZWQgd2l0aCBcIiRcIiBpdHNlbGYsIGFuZCB3ZSBuZWVkIHR3byBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dC5cbiAgICAgICAgdmFyIHJlcGxhY2VtZW50ID0gb3B0aW9uc1thcmddXG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlLmNhbGwob3B0aW9uc1thcmddLCBkb2xsYXJSZWdleCwgZG9sbGFyQmlsbHNZYWxsKVxuICAgICAgICB9XG4gICAgICAgIC8vIFdlIGNyZWF0ZSBhIG5ldyBgUmVnRXhwYCBlYWNoIHRpbWUgaW5zdGVhZCBvZiB1c2luZyBhIG1vcmUtZWZmaWNpZW50XG4gICAgICAgIC8vIHN0cmluZyByZXBsYWNlIHNvIHRoYXQgdGhlIHNhbWUgYXJndW1lbnQgY2FuIGJlIHJlcGxhY2VkIG11bHRpcGxlIHRpbWVzXG4gICAgICAgIC8vIGluIHRoZSBzYW1lIHBocmFzZS5cbiAgICAgICAgaW50ZXJwb2xhdGVkID0gaW5zZXJ0UmVwbGFjZW1lbnQoaW50ZXJwb2xhdGVkLCBuZXcgUmVnRXhwKCclXFxcXHsnICsgYXJnICsgJ1xcXFx9JywgJ2cnKSwgcmVwbGFjZW1lbnQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVycG9sYXRlZFxuXG4gICAgZnVuY3Rpb24gaW5zZXJ0UmVwbGFjZW1lbnQgKHNvdXJjZSwgcngsIHJlcGxhY2VtZW50KSB7XG4gICAgICBjb25zdCBuZXdQYXJ0cyA9IFtdXG4gICAgICBzb3VyY2UuZm9yRWFjaCgoY2h1bmspID0+IHtcbiAgICAgICAgc3BsaXQuY2FsbChjaHVuaywgcngpLmZvckVhY2goKHJhdywgaSwgbGlzdCkgPT4ge1xuICAgICAgICAgIGlmIChyYXcgIT09ICcnKSB7XG4gICAgICAgICAgICBuZXdQYXJ0cy5wdXNoKHJhdylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJbnRlcmxhY2Ugd2l0aCB0aGUgYHJlcGxhY2VtZW50YCB2YWx1ZVxuICAgICAgICAgIGlmIChpIDwgbGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBuZXdQYXJ0cy5wdXNoKHJlcGxhY2VtZW50KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICByZXR1cm4gbmV3UGFydHNcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUHVibGljIHRyYW5zbGF0ZSBtZXRob2RcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB3aXRoIHZhbHVlcyB0aGF0IHdpbGwgYmUgdXNlZCBsYXRlciB0byByZXBsYWNlIHBsYWNlaG9sZGVycyBpbiBzdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfSB0cmFuc2xhdGVkIChhbmQgaW50ZXJwb2xhdGVkKVxuICAgKi9cbiAgdHJhbnNsYXRlIChrZXksIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2xhdGVBcnJheShrZXksIG9wdGlvbnMpLmpvaW4oJycpXG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgdHJhbnNsYXRpb24gYW5kIHJldHVybiB0aGUgdHJhbnNsYXRlZCBhbmQgaW50ZXJwb2xhdGVkIHBhcnRzIGFzIGFuIGFycmF5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHdpdGggdmFsdWVzIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHJlcGxhY2UgcGxhY2Vob2xkZXJzXG4gICAqIEByZXR1cm4ge0FycmF5fSBUaGUgdHJhbnNsYXRlZCBhbmQgaW50ZXJwb2xhdGVkIHBhcnRzLCBpbiBvcmRlci5cbiAgICovXG4gIHRyYW5zbGF0ZUFycmF5IChrZXksIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5zbWFydF9jb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBwbHVyYWwgPSB0aGlzLmxvY2FsZS5wbHVyYWxpemUob3B0aW9ucy5zbWFydF9jb3VudClcbiAgICAgIHJldHVybiB0aGlzLmludGVycG9sYXRlKHRoaXMubG9jYWxlLnN0cmluZ3Nba2V5XVtwbHVyYWxdLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmludGVycG9sYXRlKHRoaXMubG9jYWxlLnN0cmluZ3Nba2V5XSwgb3B0aW9ucylcbiAgfVxufVxuIiwiY29uc3QgdGhyb3R0bGUgPSByZXF1aXJlKCdsb2Rhc2gudGhyb3R0bGUnKVxuXG5mdW5jdGlvbiBfZW1pdFNvY2tldFByb2dyZXNzICh1cGxvYWRlciwgcHJvZ3Jlc3NEYXRhLCBmaWxlKSB7XG4gIGNvbnN0IHsgcHJvZ3Jlc3MsIGJ5dGVzVXBsb2FkZWQsIGJ5dGVzVG90YWwgfSA9IHByb2dyZXNzRGF0YVxuICBpZiAocHJvZ3Jlc3MpIHtcbiAgICB1cGxvYWRlci51cHB5LmxvZyhgVXBsb2FkIHByb2dyZXNzOiAke3Byb2dyZXNzfWApXG4gICAgdXBsb2FkZXIudXBweS5lbWl0KCd1cGxvYWQtcHJvZ3Jlc3MnLCBmaWxlLCB7XG4gICAgICB1cGxvYWRlcixcbiAgICAgIGJ5dGVzVXBsb2FkZWQ6IGJ5dGVzVXBsb2FkZWQsXG4gICAgICBieXRlc1RvdGFsOiBieXRlc1RvdGFsXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlKF9lbWl0U29ja2V0UHJvZ3Jlc3MsIDMwMCwge2xlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlfSlcbiIsImNvbnN0IGlzRE9NRWxlbWVudCA9IHJlcXVpcmUoJy4vaXNET01FbGVtZW50JylcblxuLyoqXG4gKiBGaW5kIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gZWxlbWVudFxuICogQHJldHVybiB7Tm9kZXxudWxsfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbmRET01FbGVtZW50IChlbGVtZW50LCBjb250ZXh0ID0gZG9jdW1lbnQpIHtcbiAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBjb250ZXh0LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudClcbiAgfVxuXG4gIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ29iamVjdCcgJiYgaXNET01FbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnRcbiAgfVxufVxuIiwiLyoqXG4gKiBUYWtlcyBhIGZpbGUgb2JqZWN0IGFuZCB0dXJucyBpdCBpbnRvIGZpbGVJRCwgYnkgY29udmVydGluZyBmaWxlLm5hbWUgdG8gbG93ZXJjYXNlLFxuICogcmVtb3ZpbmcgZXh0cmEgY2hhcmFjdGVycyBhbmQgYWRkaW5nIHR5cGUsIHNpemUgYW5kIGxhc3RNb2RpZmllZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBmaWxlSURcbiAqXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2VuZXJhdGVGaWxlSUQgKGZpbGUpIHtcbiAgLy8gZmlsdGVyIGlzIG5lZWRlZCB0byBub3Qgam9pbiBlbXB0eSB2YWx1ZXMgd2l0aCBgLWBcbiAgcmV0dXJuIFtcbiAgICAndXBweScsXG4gICAgZmlsZS5uYW1lID8gZmlsZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15BLVowLTldL2lnLCAnJykgOiAnJyxcbiAgICBmaWxlLnR5cGUsXG4gICAgZmlsZS5kYXRhLnNpemUsXG4gICAgZmlsZS5kYXRhLmxhc3RNb2RpZmllZFxuICBdLmZpbHRlcih2YWwgPT4gdmFsKS5qb2luKCctJylcbn1cbiIsIi8qKlxuKiBUYWtlcyBhIGZ1bGwgZmlsZW5hbWUgc3RyaW5nIGFuZCByZXR1cm5zIGFuIG9iamVjdCB7bmFtZSwgZXh0ZW5zaW9ufVxuKlxuKiBAcGFyYW0ge3N0cmluZ30gZnVsbEZpbGVOYW1lXG4qIEByZXR1cm4ge29iamVjdH0ge25hbWUsIGV4dGVuc2lvbn1cbiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldEZpbGVOYW1lQW5kRXh0ZW5zaW9uIChmdWxsRmlsZU5hbWUpIHtcbiAgdmFyIHJlID0gLyg/OlxcLihbXi5dKykpPyQvXG4gIHZhciBmaWxlRXh0ID0gcmUuZXhlYyhmdWxsRmlsZU5hbWUpWzFdXG4gIHZhciBmaWxlTmFtZSA9IGZ1bGxGaWxlTmFtZS5yZXBsYWNlKCcuJyArIGZpbGVFeHQsICcnKVxuICByZXR1cm4ge1xuICAgIG5hbWU6IGZpbGVOYW1lLFxuICAgIGV4dGVuc2lvbjogZmlsZUV4dFxuICB9XG59XG4iLCJjb25zdCBnZXRGaWxlTmFtZUFuZEV4dGVuc2lvbiA9IHJlcXVpcmUoJy4vZ2V0RmlsZU5hbWVBbmRFeHRlbnNpb24nKVxuY29uc3QgbWltZVR5cGVzID0gcmVxdWlyZSgnLi9taW1lVHlwZXMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldEZpbGVUeXBlIChmaWxlKSB7XG4gIGxldCBmaWxlRXh0ZW5zaW9uID0gZmlsZS5uYW1lID8gZ2V0RmlsZU5hbWVBbmRFeHRlbnNpb24oZmlsZS5uYW1lKS5leHRlbnNpb24gOiBudWxsXG4gIGZpbGVFeHRlbnNpb24gPSBmaWxlRXh0ZW5zaW9uID8gZmlsZUV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpIDogbnVsbFxuXG4gIGlmIChmaWxlLmlzUmVtb3RlKSB7XG4gICAgLy8gc29tZSByZW1vdGUgcHJvdmlkZXJzIGRvIG5vdCBzdXBwb3J0IGZpbGUgdHlwZXNcbiAgICByZXR1cm4gZmlsZS50eXBlID8gZmlsZS50eXBlIDogbWltZVR5cGVzW2ZpbGVFeHRlbnNpb25dXG4gIH1cblxuICAvLyBjaGVjayBpZiBtaW1lIHR5cGUgaXMgc2V0IGluIHRoZSBmaWxlIG9iamVjdFxuICBpZiAoZmlsZS50eXBlKSB7XG4gICAgcmV0dXJuIGZpbGUudHlwZVxuICB9XG5cbiAgLy8gc2VlIGlmIHdlIGNhbiBtYXAgZXh0ZW5zaW9uIHRvIGEgbWltZSB0eXBlXG4gIGlmIChmaWxlRXh0ZW5zaW9uICYmIG1pbWVUeXBlc1tmaWxlRXh0ZW5zaW9uXSkge1xuICAgIHJldHVybiBtaW1lVHlwZXNbZmlsZUV4dGVuc2lvbl1cbiAgfVxuXG4gIC8vIGlmIGFsbCBmYWlscywgZmFsbCBiYWNrIHRvIGEgZ2VuZXJpYyBieXRlIHN0cmVhbSB0eXBlXG4gIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRTb2NrZXRIb3N0ICh1cmwpIHtcbiAgLy8gZ2V0IHRoZSBob3N0IGRvbWFpblxuICB2YXIgcmVnZXggPSAvXig/Omh0dHBzPzpcXC9cXC98XFwvXFwvKT8oPzpbXkBcXG5dK0ApPyg/Ond3d1xcLik/KFteXFxuXSspL2lcbiAgdmFyIGhvc3QgPSByZWdleC5leGVjKHVybClbMV1cbiAgdmFyIHNvY2tldFByb3RvY29sID0gL15odHRwOlxcL1xcLy9pLnRlc3QodXJsKSA/ICd3cycgOiAnd3NzJ1xuXG4gIHJldHVybiBgJHtzb2NrZXRQcm90b2NvbH06Ly8ke2hvc3R9YFxufVxuIiwiLyoqXG4gKiBSZXR1cm5zIGEgdGltZXN0YW1wIGluIHRoZSBmb3JtYXQgb2YgYGhvdXJzOm1pbnV0ZXM6c2Vjb25kc2BcbiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFRpbWVTdGFtcCAoKSB7XG4gIHZhciBkYXRlID0gbmV3IERhdGUoKVxuICB2YXIgaG91cnMgPSBwYWQoZGF0ZS5nZXRIb3VycygpLnRvU3RyaW5nKCkpXG4gIHZhciBtaW51dGVzID0gcGFkKGRhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCkpXG4gIHZhciBzZWNvbmRzID0gcGFkKGRhdGUuZ2V0U2Vjb25kcygpLnRvU3RyaW5nKCkpXG4gIHJldHVybiBob3VycyArICc6JyArIG1pbnV0ZXMgKyAnOicgKyBzZWNvbmRzXG59XG5cbi8qKlxuICogQWRkcyB6ZXJvIHRvIHN0cmluZ3Mgc2hvcnRlciB0aGFuIHR3byBjaGFyYWN0ZXJzXG4qL1xuZnVuY3Rpb24gcGFkIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5sZW5ndGggIT09IDIgPyAwICsgc3RyIDogc3RyXG59XG4iLCIvKipcbiAqIENoZWNrIGlmIGFuIG9iamVjdCBpcyBhIERPTSBlbGVtZW50LiBEdWNrLXR5cGluZyBiYXNlZCBvbiBgbm9kZVR5cGVgLlxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNET01FbGVtZW50IChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiBvYmoubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFXG59XG4iLCIvKipcbiAqIExpbWl0IHRoZSBhbW91bnQgb2Ygc2ltdWx0YW5lb3VzbHkgcGVuZGluZyBQcm9taXNlcy5cbiAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIHBhc3NlZCBhIGZ1bmN0aW9uIGBmbmAsXG4gKiB3aWxsIG1ha2Ugc3VyZSB0aGF0IGF0IG1vc3QgYGxpbWl0YCBjYWxscyB0byBgZm5gIGFyZSBwZW5kaW5nLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBsaW1pdFxuICogQHJldHVybiB7ZnVuY3Rpb24oKX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsaW1pdFByb21pc2VzIChsaW1pdCkge1xuICBsZXQgcGVuZGluZyA9IDBcbiAgY29uc3QgcXVldWUgPSBbXVxuICByZXR1cm4gKGZuKSA9PiB7XG4gICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICBjb25zdCBjYWxsID0gKCkgPT4ge1xuICAgICAgICBwZW5kaW5nKytcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGZuKC4uLmFyZ3MpXG4gICAgICAgIHByb21pc2UudGhlbihvbmZpbmlzaCwgb25maW5pc2gpXG4gICAgICAgIHJldHVybiBwcm9taXNlXG4gICAgICB9XG5cbiAgICAgIGlmIChwZW5kaW5nID49IGxpbWl0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgcXVldWUucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBjYWxsKCkudGhlbihyZXNvbHZlLCByZWplY3QpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYWxsKClcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gb25maW5pc2ggKCkge1xuICAgIHBlbmRpbmctLVxuICAgIGNvbnN0IG5leHQgPSBxdWV1ZS5zaGlmdCgpXG4gICAgaWYgKG5leHQpIG5leHQoKVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgJ21kJzogJ3RleHQvbWFya2Rvd24nLFxuICAnbWFya2Rvd24nOiAndGV4dC9tYXJrZG93bicsXG4gICdtcDQnOiAndmlkZW8vbXA0JyxcbiAgJ21wMyc6ICdhdWRpby9tcDMnLFxuICAnc3ZnJzogJ2ltYWdlL3N2Zyt4bWwnLFxuICAnanBnJzogJ2ltYWdlL2pwZWcnLFxuICAncG5nJzogJ2ltYWdlL3BuZycsXG4gICdnaWYnOiAnaW1hZ2UvZ2lmJyxcbiAgJ3lhbWwnOiAndGV4dC95YW1sJyxcbiAgJ3ltbCc6ICd0ZXh0L3lhbWwnLFxuICAnY3N2JzogJ3RleHQvY3N2JyxcbiAgJ2F2aSc6ICd2aWRlby94LW1zdmlkZW8nLFxuICAnbWtzJzogJ3ZpZGVvL3gtbWF0cm9za2EnLFxuICAnbWt2JzogJ3ZpZGVvL3gtbWF0cm9za2EnLFxuICAnbW92JzogJ3ZpZGVvL3F1aWNrdGltZScsXG4gICdkb2MnOiAnYXBwbGljYXRpb24vbXN3b3JkJyxcbiAgJ2RvY20nOiAnYXBwbGljYXRpb24vdm5kLm1zLXdvcmQuZG9jdW1lbnQubWFjcm9lbmFibGVkLjEyJyxcbiAgJ2RvY3gnOiAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQnLFxuICAnZG90JzogJ2FwcGxpY2F0aW9uL21zd29yZCcsXG4gICdkb3RtJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy13b3JkLnRlbXBsYXRlLm1hY3JvZW5hYmxlZC4xMicsXG4gICdkb3R4JzogJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLnRlbXBsYXRlJyxcbiAgJ3hsYSc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnLFxuICAneGxhbSc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuYWRkaW4ubWFjcm9lbmFibGVkLjEyJyxcbiAgJ3hsYyc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnLFxuICAneGxmJzogJ2FwcGxpY2F0aW9uL3gteGxpZmYreG1sJyxcbiAgJ3hsbSc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnLFxuICAneGxzJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCcsXG4gICd4bHNiJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbC5zaGVldC5iaW5hcnkubWFjcm9lbmFibGVkLjEyJyxcbiAgJ3hsc20nOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLnNoZWV0Lm1hY3JvZW5hYmxlZC4xMicsXG4gICd4bHN4JzogJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0JyxcbiAgJ3hsdCc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnLFxuICAneGx0bSc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwudGVtcGxhdGUubWFjcm9lbmFibGVkLjEyJyxcbiAgJ3hsdHgnOiAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwudGVtcGxhdGUnLFxuICAneGx3JzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCdcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2V0dGxlIChwcm9taXNlcykge1xuICBjb25zdCByZXNvbHV0aW9ucyA9IFtdXG4gIGNvbnN0IHJlamVjdGlvbnMgPSBbXVxuICBmdW5jdGlvbiByZXNvbHZlZCAodmFsdWUpIHtcbiAgICByZXNvbHV0aW9ucy5wdXNoKHZhbHVlKVxuICB9XG4gIGZ1bmN0aW9uIHJlamVjdGVkIChlcnJvcikge1xuICAgIHJlamVjdGlvbnMucHVzaChlcnJvcilcbiAgfVxuXG4gIGNvbnN0IHdhaXQgPSBQcm9taXNlLmFsbChcbiAgICBwcm9taXNlcy5tYXAoKHByb21pc2UpID0+IHByb21pc2UudGhlbihyZXNvbHZlZCwgcmVqZWN0ZWQpKVxuICApXG5cbiAgcmV0dXJuIHdhaXQudGhlbigoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3NmdWw6IHJlc29sdXRpb25zLFxuICAgICAgZmFpbGVkOiByZWplY3Rpb25zXG4gICAgfVxuICB9KVxufVxuIiwiLyoqXG4gKiBDb252ZXJ0cyBsaXN0IGludG8gYXJyYXlcbiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvQXJyYXkgKGxpc3QpIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGxpc3QgfHwgW10sIDApXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwicmVxdWlyZSgnZXM2LXByb21pc2UvYXV0bycpXG5yZXF1aXJlKCd3aGF0d2ctZmV0Y2gnKVxuY29uc3QgVXBweSA9IHJlcXVpcmUoJ0B1cHB5L2NvcmUnKVxuY29uc3QgRHJhZ0Ryb3AgPSByZXF1aXJlKCdAdXBweS9kcmFnLWRyb3AnKVxuY29uc3QgUHJvZ3Jlc3NCYXIgPSByZXF1aXJlKCdAdXBweS9wcm9ncmVzcy1iYXInKVxuY29uc3QgVHVzID0gcmVxdWlyZSgnQHVwcHkvdHVzJylcblxuY29uc3QgdXBweU9uZSA9IG5ldyBVcHB5KHtkZWJ1ZzogdHJ1ZSwgYXV0b1Byb2NlZWQ6IHRydWV9KVxudXBweU9uZVxuICAudXNlKERyYWdEcm9wLCB7dGFyZ2V0OiAnLlVwcHlEcmFnRHJvcC1PbmUnfSlcbiAgLnVzZShUdXMsIHtlbmRwb2ludDogJ2h0dHBzOi8vbWFzdGVyLnR1cy5pby9maWxlcy8nfSlcbiAgLnVzZShQcm9ncmVzc0Jhciwge3RhcmdldDogJy5VcHB5RHJhZ0Ryb3AtT25lLVByb2dyZXNzJywgaGlkZUFmdGVyRmluaXNoOiBmYWxzZX0pXG5cbmNvbnN0IHVwcHlUd28gPSBuZXcgVXBweSh7ZGVidWc6IHRydWUsIGF1dG9Qcm9jZWVkOiBmYWxzZX0pXG51cHB5VHdvXG4gIC51c2UoRHJhZ0Ryb3AsIHt0YXJnZXQ6ICcjVXBweURyYWdEcm9wLVR3byd9KVxuICAudXNlKFR1cywge2VuZHBvaW50OiAnaHR0cHM6Ly9tYXN0ZXIudHVzLmlvL2ZpbGVzLyd9KVxuICAudXNlKFByb2dyZXNzQmFyLCB7dGFyZ2V0OiAnLlVwcHlEcmFnRHJvcC1Ud28tUHJvZ3Jlc3MnLCBoaWRlQWZ0ZXJGaW5pc2g6IGZhbHNlfSlcblxudmFyIHVwbG9hZEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5VcHB5RHJhZ0Ryb3AtVHdvLVVwbG9hZCcpXG51cGxvYWRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gIHVwcHlUd28udXBsb2FkKClcbn0pXG4iXX0=
