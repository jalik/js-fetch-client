export interface FetchClientResponse<T = any> {
  data: T
  headers: Record<string, string>
  status: number
  statusText: string
}

export class FetchResponseError extends Error {
  public response?: FetchClientResponse

  constructor (message: string, response?: FetchClientResponse) {
    super(message)
    this.response = response
  }
}

export type FetchOptions = RequestInit & {
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text'
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
   * The type of response to expect,
   * it will call resp.arrayBuffer(), resp.blob(), resp.json() or resp.text()
   */
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text'
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
  transformResponse?: Array<(response: any) => any>
}

export class FetchClient {
  private readonly config: FetchClientConfig & {
    headers: Record<string, string>,
    options: RequestInit,
    responseType: 'arraybuffer' | 'blob' | 'json' | 'text' | undefined
    transformRequest: Array<(url: string, options: RequestInit) => RequestInit>
    transformResponse: Array<(response: any) => any>
  }

  constructor (config?: FetchClientConfig) {
    this.config = {
      responseType: 'json',
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
  fetch (url: string, options?: FetchOptions): Promise<FetchClientResponse> {
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
    return fetch(targetUrl, opts)
      .then(async (response: Response): Promise<FetchClientResponse> => {
        let data: unknown
        const contentType = response.headers.get('content-type')
        const responseType = typeof opts.responseType !== 'undefined'
          ? opts.responseType
          : this.config.responseType

        if (!responseType) {
          data = response
        } else if (responseType && contentType &&
          opts.method !== 'OPTIONS' &&
          opts.method !== 'HEAD') {
          // Convert data.
          if (responseType === 'json') {
            data = await response.json()
          } else if (responseType === 'text') {
            data = await response.text()
          } else if (responseType === 'blob') {
            data = await response.blob()
          } else if (responseType === 'arraybuffer') {
            data = await response.arrayBuffer()
          }
        }

        // Transform response.
        if (response.ok && this.config.transformResponse.length) {
          this.config.transformResponse.forEach((transform) => {
            data = transform(data)
          })
        }

        // Collect response headers.
        const respHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          respHeaders[key] = value
        })

        const result = {
          data,
          headers: respHeaders,
          status: response.status,
          statusText: response.statusText
        }

        // Handle response error.
        if (!response.ok) {
          throw new FetchResponseError(response.statusText, result)
        }
        return result
      })
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
