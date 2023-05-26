# @jalik/fetch-client

![GitHub package.json version](https://img.shields.io/github/package-json/v/jalik/js-fetch-client.svg)
![Build Status](https://github.com/jalik/js-fetch-client/actions/workflows/node.js.yml/badge.svg)
![Last commit](https://img.shields.io/github/last-commit/jalik/js-fetch-client.svg)
[![GitHub issues](https://img.shields.io/github/issues/jalik/js-fetch-client.svg)](https://github.com/jalik/js-fetch-client/issues)
![GitHub](https://img.shields.io/github/license/jalik/js-fetch-client.svg)
![npm](https://img.shields.io/npm/dt/@jalik/fetch-client.svg)

Wrapper for Fetch with error handling and other DX improvements.

## Features

* Shortcut methods for DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
* Base URL declaration for all requests
* Default headers for all requests
* Default Fetch options for all requests
* Convert response body using defined response type (avoid calling resp.json())
* Transform request options and headers before sending
* Transform response body before returning

**Requires Fetch support in Browser or Node (>=18), use a polyfill to support other environments.**

## Sandbox

Play with the lib here:
https://codesandbox.io/s/jalik-fetch-client-demo-8rolt2?file=/src/index.js

## Creating a client

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()
```

## Executing a request

The method `.fetch(url, options)` is a generic method to execute a request.  
It's like calling `fetch()` directly, but with all the benefits of using `FetchClient` (error handling, body transformations...).  
Usually, you would prefer to use a shortcut method (described after) like `.get()` or `.post()` instead of `.fetch()`.

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.fetch('https://jsonplaceholder.typicode.com/todos/1', {
  method: 'GET',
  responseType: 'json'
})
  .then((resp) => {
    console.log(resp.body)
  })
```

### Request options

The request options are the same as Fetch options with extra options.

```ts
type FetchOptions = RequestInit & {
  /**
   * The type of response to expect.
   * Pass undefined to ignore response body.
   */
  responseType?: ResponseType
}
```

### Response object

The response object returned by all request methods follows the declaration below.

```ts
type FetchClientResponse<T = any> = {
  /**
   * Response body.
   */
  body: T
  /**
   * Response headers.
   */
  headers: Record<string, string>
  /**
   * The original Fetch Response.
   */
  original: Response
  /**
   * Tells if the request has been redirected.
   */
  redirected: boolean
  /**
   * Response status code (ex: 200).
   */
  status: number
  /**
   * Response status text (ex: "OK").
   */
  statusText: string
  /**
   * Contains the response type.
   */
  type: globalThis.ResponseType
}
```

### Executing a DELETE request

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.delete('https://jsonplaceholder.typicode.com/posts/1')
```

### Executing a GET request

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.get('https://jsonplaceholder.typicode.com/todos/1', {
  // Convert response body to JSON.
  // It can be done per request, or for all requests when passed to FetchClient options.
  responseType: 'json',
})
  .then((resp) => {
    console.log(resp.body)
  })
```

### Executing a HEAD request

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.head('https://jsonplaceholder.typicode.com/todos/1')
  .then((resp) => {
    // Access response headers
    console.log(resp.headers)
  })
```

### Executing an OPTIONS request

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.options('https://jsonplaceholder.typicode.com/todos')
  .then((resp) => {
    // Access response headers
    console.log(resp.headers)
  })
```

### Executing a PATCH request

When `body` is an object and `Content-Type` is not defined in headers:

* `body` is serialized to JSON
* `Content-Type: application/json` is added to headers

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.patch(
  'https://jsonplaceholder.typicode.com/todos/1',
  { completed: true },
  { responseType: 'json' }
)
  .then((resp) => {
    console.log(resp.body)
  })
```

### Executing a POST request

When `body` is an object and `Content-Type` is not defined in headers:

* `body` is serialized to JSON
* `Content-Type: application/json` is added to headers

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.post(
  'https://jsonplaceholder.typicode.com/todos',
  { title: 'test' },
  { responseType: 'json' }
)
  .then((resp) => {
    console.log(resp.body)
  })
```

### Executing a PUT request

When `body` is an object and `Content-Type` is not defined in headers:

* `body` is serialized to JSON
* `Content-Type: application/json` is added to headers

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

client.put(
  'https://jsonplaceholder.typicode.com/todos/1',
  { title: 'test' },
  { responseType: 'json' }
)
  .then((resp) => {
    console.log(resp.body)
  })
```

## Handling errors

When the server returns an error code (4xx, 5xx...), the client throws an error.  
If the server returned a body (containing error details), it can be found in `error.response.body`.  
However the body is available only when `responseType` is defined in `FetchClient` options or in request options.

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient()

const invalidObject = {}

client.post('https://jsonplaceholder.typicode.com/todos', invalidObject, {
  // Setting the responseType is important to convert error response body.
  responseType: 'json',
})
  .catch((error) => {
    console.error(
      // the status error
      error.message,
      // the server response
      error.response.body
    )
  })
```

## Configuring the client

```js
import { FetchClient } from '@jalik/fetch-client'

const client = new FetchClient({
  // Prefix all relative URL with the base URL (does nothing on absolute URL).
  baseUrl: 'http://localhost',
  // Set default headers for all requests (empty by default).
  headers: {
    'authorization': '...',
    'x-xsrf-token': '...',
  },
  // Set default Fetch options for all requests.
  options: {
    mode: 'cors',
  },
  // Enable conversion of body response.
  // It can be one of "arrayBuffer", "blob", "formData", "json", "stream", "text"
  // Use undefined to ignore response body.
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
    (body, response) => ({
      ...body,
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
