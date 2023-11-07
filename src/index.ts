export type FetchClientResponse<T = any> = {
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

export class FetchResponseError extends Error {
  public response?: FetchClientResponse

  constructor (message: string, response?: FetchClientResponse) {
    super(message)
    this.response = response
  }
}

export type ResponseType =
  'arrayBuffer'
  | 'blob'
  | 'formData'
  | 'json'
  | 'stream'
  | 'text'
  | undefined

export type FetchOptions = RequestInit & {
  /**
   * The type of response to expect.
   * Pass undefined to ignore response body.
   */
  responseType?: ResponseType
}

export interface FetchClientConfig {
  /**
   * The base URL to use when executing a relative request.
   */
  baseUrl?: string
  /**
   * Client headers.
   */
  headers?: Record<string, string>
  /**
   * Fetch options.
   */
  options?: RequestInit
  /**
   * The type of response to expect.
   * Pass undefined to ignore response body.
   */
  responseType?: ResponseType
  /**
   * Allow transforming a request.
   * @param url
   * @param options
   */
  transformRequest?: Array<(url: string, options: RequestInit) => RequestInit>
  /**
   * Allow transforming a response.
   * @param response
   */
  transformResponse?: Array<(body: any, response: Response) => any>
}

export class FetchClient {
  private readonly config: FetchClientConfig & {
    headers: Record<string, string>,
    options: RequestInit,
    responseType: ResponseType
    transformRequest: Array<(url: string, options: RequestInit) => RequestInit>
    transformResponse: Array<(body: any, response: Response) => any>
  }

  constructor (config?: FetchClientConfig) {
    this.config = {
      responseType: undefined,
      transformRequest: [],
      transformResponse: [],
      ...config,
      headers: {
        ...config?.headers
      },
      options: {
        ...config?.options
      }
    }
  }

  /**
   * Executes a DELETE request.
   * @param url
   * @param options
   */
  delete (url: string, options?: FetchOptions): Promise<FetchClientResponse> {
    return this.fetch(url, {
      ...options,
      method: 'DELETE'
    })
  }

  /**
   * Executes an HTTP request.
   * @param url
   * @param options
   */
  async fetch (url: string, options?: FetchOptions): Promise<FetchClientResponse> {
    // Merge headers.
    const headers = new Headers({
      ...this.config.options.headers,
      ...this.config.headers,
      ...options?.headers
    })

    // Merge options.
    let opts: FetchOptions = {
      ...this.config.options,
      ...options,
      headers
    }

    if (opts.body && typeof opts.body !== 'string') {
      // Serialize object to JSON if no content-type defined.
      if (!headers.has('content-type') &&
        !(opts.body instanceof ArrayBuffer) &&
        !(opts.body instanceof Blob) &&
        !(opts.body instanceof FormData) &&
        !(opts.body instanceof ReadableStream)) {
        opts.body = JSON.stringify(opts.body)
        headers.set('content-type', 'application/json')
        opts.headers = headers
      }
    }

    // Prepend base URL to URL.
    let targetUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://') && this.config.baseUrl) {
      targetUrl = url.startsWith('/')
        ? `${this.config.baseUrl}${url}`
        : `${this.config.baseUrl}/${url}`
    }

    // Transform request.
    if (this.config.transformRequest.length) {
      this.config.transformRequest.forEach((transform) => {
        opts = { ...opts, ...transform(targetUrl, opts) }
      })
    }

    const response = await fetch(targetUrl, opts)
    let body: unknown
    const contentLength = response.headers.get('content-length')
    const contentType = response.headers.get('content-type')
    const responseType = typeof opts.responseType !== 'undefined'
      ? opts.responseType
      : this.config.responseType

    if (responseType && (contentType || (contentLength && contentLength !== '0')) &&
      opts.method && !['HEAD', 'OPTIONS'].includes(opts.method)) {
      // Convert body.
      if (responseType === 'json') {
        body = await response.json()
      } else if (responseType === 'text') {
        body = await response.text()
      } else if (responseType === 'blob') {
        body = await response.blob()
      } else if (responseType === 'arrayBuffer') {
        body = await response.arrayBuffer()
      } else if (responseType === 'formData') {
        body = await response.formData()
      } else if (responseType === 'stream') {
        body = response.body
      }
    }

    // Transform response.
    if (response.ok && this.config.transformResponse.length) {
      this.config.transformResponse.forEach((transform) => {
        body = transform(body, response)
      })
    }

    // Collect response headers.
    const respHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      respHeaders[key] = value
    })

    const resp = {
      body,
      headers: respHeaders,
      original: response,
      redirected: response.redirected,
      status: response.status,
      statusText: response.statusText,
      type: response.type
    }

    // Handle response error.
    if (!response.ok) {
      throw new FetchResponseError(response.statusText, resp)
    }

    return resp
  }

  /**
   * Executes a GET request.
   * @param url
   * @param options
   */
  get (url: string, options?: FetchOptions): Promise<FetchClientResponse> {
    return this.fetch(url, {
      ...options,
      method: 'GET'
    })
  }

  /**
   * Executes a HEAD request.
   * @param url
   * @param options
   */
  head (url: string, options?: FetchOptions): Promise<FetchClientResponse> {
    return this.fetch(url, {
      ...options,
      method: 'HEAD'
    })
  }

  /**
   * Executes an OPTIONS request.
   * @param url
   * @param options
   */
  options (url: string, options?: FetchOptions): Promise<FetchClientResponse> {
    return this.fetch(url, {
      ...options,
      method: 'OPTIONS'
    })
  }

  /**
   * Executes a PATCH request.
   * @param url
   * @param body
   * @param options
   */
  patch (url: string, body?: any, options?: FetchOptions): Promise<FetchClientResponse> {
    return this.fetch(url, {
      ...options,
      body,
      method: 'PATCH'
    })
  }

  /**
   * Executes a POST request.
   * @param url
   * @param body
   * @param options
   */
  post (url: string, body?: any, options?: FetchOptions): Promise<FetchClientResponse> {
    return this.fetch(url, {
      ...options,
      body,
      method: 'POST'
    })
  }

  /**
   * Executes a PUT request.
   * @param url
   * @param body
   * @param options
   */
  put (url: string, body?: any, options?: FetchOptions): Promise<FetchClientResponse> {
    return this.fetch(url, {
      ...options,
      body,
      method: 'PUT'
    })
  }

  /**
   * Sets a default header.
   * @param name
   * @param value
   */
  setHeader (name: string, value?: string): void {
    if (value == null) {
      delete this.config.headers[name]
    } else {
      this.config.headers[name] = value
    }
  }

  /**
   * Sets default headers.
   * @param headers
   */
  setHeaders (headers: Record<string, string>): void {
    this.config.headers = { ...headers }
  }

  /**
   * Sets a default option.
   * @param name
   * @param value
   */
  setOption (name: keyof FetchOptions, value: any): void {
    this.config.options = {
      ...this.config.options,
      [name]: value
    }
  }

  /**
   * Sets default options.
   * @param options
   */
  setOptions (options: FetchOptions): void {
    this.config.options = { ...options }
  }
}
