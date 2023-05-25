# @jalik/fetch-client

![GitHub package.json version](https://img.shields.io/github/package-json/v/jalik/js-fetch-client.svg)
![Build Status](https://github.com/jalik/js-fetch-client/actions/workflows/node.js.yml/badge.svg)
![Last commit](https://img.shields.io/github/last-commit/jalik/js-fetch-client.svg)
[![GitHub issues](https://img.shields.io/github/issues/jalik/js-fetch-client.svg)](https://github.com/jalik/js-fetch-client/issues)
![GitHub](https://img.shields.io/github/license/jalik/js-fetch-client.svg)
![npm](https://img.shields.io/npm/dt/@jalik/js-fetch-client.svg)

Wrapper for Fetch with error handling and other DX improvements.

## Features

* Shortcut methods for DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
* Base URL declaration for all requests
* Default headers for all requests
* Default Fetch options for all requests
* Convert response body using defined response type (avoid calling resp.json())
* Transform request options and headers before sending
* Transform response data before returning

**Requires Fetch support in Browser or Node (>=18), no polyfill provided.**

## Sandbox

Play with the lib here:
https://codesandbox.io/s/jalik-fetch-client-demo-8rolt2?file=/src/index.js

## Creating a client

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()
```

## Executing a request

### `.delete(url, options?)`

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.delete('https://jsonplaceholder.typicode.com/posts/1')
```

### `.get(url, options?)`

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.get('https://jsonplaceholder.typicode.com/todos/1')
  .then((resp) => {
    console.log(resp.data)
  })
```

### `.head(url, options?)`

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.head('https://jsonplaceholder.typicode.com/todos/1')
  .then((resp) => {
    // Access response headers
    console.log(resp.headers)
  })
```

### `.options(url, options?)`

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.options('https://jsonplaceholder.typicode.com/todos')
  .then((resp) => {
    // Access response headers
    console.log(resp.headers)
  })
```

### `.patch(url, body, options?)`

When `body` is an object and `Content-Type` is not defined in headers:
* `body` is serialized to JSON
* `Content-Type: application/json` is added to headers

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.patch('https://jsonplaceholder.typicode.com/todos/1', { completed: true })
  .then((resp) => {
    console.log(resp.data)
  })
```

### `.post(url, body, options?)`

When `body` is an object and `Content-Type` is not defined in headers:
* `body` is serialized to JSON
* `Content-Type: application/json` is added to headers

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.post('https://jsonplaceholder.typicode.com/todos', { title: 'test' })
  .then((resp) => {
    console.log(resp.data)
  })
```

### `.put(url, body, options?)`

When `body` is an object and `Content-Type` is not defined in headers:
* `body` is serialized to JSON
* `Content-Type: application/json` is added to headers

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.put('https://jsonplaceholder.typicode.com/todos/1', { title: 'test' })
  .then((resp) => {
    console.log(resp.data)
  })
```

### `fetch(url, options?)`

This is the "low-level" method called by other methods to execute a request.

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.fetch('https://jsonplaceholder.typicode.com/todos/1', {
  method: 'GET',
})
  .then((resp) => {
    console.log(resp.data)
  })
```

## Handling errors

When the server returns an error code (4xx, 5xx...), the client throws an error.  
You can access the server's response with `error.response`.

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.post('https://jsonplaceholder.typicode.com/todos', {})
  .catch((error) => {
    console.error(
      // the status error
      error.message,
      // the server response
      error.response
    )
  })
```

## Configuring the client 

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient({
  // Prefix all relative URL with the base URL.
  baseUrl: 'http://localhost',
  // Set default headers for all requests.
  // By default, headers are empty.
  headers: {
    'authorization': '...',
    'x-xsrf-token': '...',
  },
  // Set default Fetch options for all requests.
  // By default, options are empty.
  options: {
    mode: 'cors',
  },
  // Enable conversion of Body response.
  // It can be one of "arraybuffer", "blob", "json", "text" or undefined to ignore response body.
  responseType: 'json',
  // Transform request options and headers before sending.
  // Several functions can be passed (all executed sequentially).
  transformRequest: [
    (url, options) => ({
      ...options,
      headers: {
        ...options.headers,
        // Add request date to each request
        'x-request-date': Date.now().toString(),
      },
    }),
  ],
  // Transform response Body before returning.
  // Several functions can be passed (all executed sequentially).
  transformResponse: [
    (data, response) => ({
      ...data,
      // Add response date to each response
      receivedAt: Date.now(),
    }),
  ],
})
```

## Changelog

History of releases is in the [changelog](./CHANGELOG.md) on GitHub.

## License

The code is released under the [MIT License](http://www.opensource.org/licenses/MIT).
