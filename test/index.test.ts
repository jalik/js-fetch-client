import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { FetchClient, FetchClientResponse, FetchResponseError } from '../src'
import server, { paths, RequestInfo } from './server'

const port = 8888
const serverUrl = `http://localhost:${port}`

// Handle server lifecycle

beforeAll(async () => {
  await server.listen({
    port,
    host: 'localhost'
  })
})

afterAll(async () => {
  await server.close()
})

describe('new FetchClient(options)', () => {
  describe('without options', () => {
    const client = new FetchClient()

    it('should not throw an error', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new FetchClient()
      }).not.toThrow()
    })

    describe('fetch(url, options)', () => {
      it('should return a promise', async () => {
        const promise = client.fetch(serverUrl + paths.resource)
        expect(promise).toBeDefined()
        expect(promise.constructor.name).toBe('Promise')
      })

      it('should return a promise with a response', async () => {
        const resp = await client.fetch(serverUrl + paths.resource)
        // expect(resp.body).toBeDefined()
        expect(resp.headers).toBeDefined()
        expect(resp.original).toBeInstanceOf(Response)
        expect(typeof resp.redirected).toBe('boolean')
        expect(typeof resp.status).toBe('number')
        expect(typeof resp.statusText).toBe('string')
        expect(typeof resp.type).toBe('string')
      })
    })

    describe('delete(url, options)', () => {
      it('should use the DELETE method', async () => {
        const resp = await client.delete(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.headers).toBeDefined()
      })

      describe('with options.responseType', () => {
        it('should return body in response.body', async () => {
          const resp = await client.delete(serverUrl + paths.resource, { responseType: 'json' })
          expect(resp.body).toBeDefined()
        })
      })
    })

    describe('get(url, options)', () => {
      it('should use the GET method', async () => {
        const resp = await client.get(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.headers).toBeDefined()
      })

      describe('with options.responseType', () => {
        it('should return body in response.body', async () => {
          const resp = await client.get(serverUrl + paths.resource, { responseType: 'json' })
          expect(resp.body).toBeDefined()
        })
      })
    })

    describe('head(url, options)', () => {
      it('should use the HEAD method', async () => {
        const resp = await client.head(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.headers).toBeDefined()
      })

      it('should return response.body = undefined', async () => {
        const resp = await client.head(serverUrl + paths.resource)
        expect(resp.body).toBeUndefined()
      })
    })

    describe('options(url, options)', () => {
      it('should use the OPTIONS method', async () => {
        const resp = await client.options(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.headers).toBeDefined()
      })

      it('should return "allow" in response.headers', async () => {
        const resp = await client.options(serverUrl + paths.resource)
        expect(resp.headers.allow).toBeDefined()
      })

      it('should return response.body = undefined', async () => {
        const resp = await client.options(serverUrl + paths.resource)
        expect(resp.body).toBeUndefined()
      })
    })

    describe('patch(url, body, options)', () => {
      const data = { test: true }

      it('should use the PATCH method', async () => {
        const resp = await client.patch(serverUrl + paths.resource, data)
        expect(resp.status).toBe(200)
        expect(resp.headers).toBeDefined()
      })

      describe('with options.responseType', () => {
        it('should return body in response.body', async () => {
          const resp = await client.patch(serverUrl + paths.resource, data, { responseType: 'json' })
          expect(resp.body).toBeDefined()
        })
      })
    })

    describe('post(url, body, options)', () => {
      const data = { test: true }

      it('should use the POST method', async () => {
        const resp = await client.post(serverUrl + paths.resources, data)
        expect(resp.status).toBe(201)
        expect(resp.headers).toBeDefined()
      })

      describe('with options.responseType', () => {
        it('should return body in response.body', async () => {
          const resp = await client.post(serverUrl + paths.resources, data, { responseType: 'json' })
          expect(resp.body).toBeDefined()
        })

        describe('with string as body', () => {
          it('should not serialize body or change Content-Type', async () => {
            const resp = await client.post<RequestInfo>(serverUrl + paths.resources, JSON.stringify(data), {
              responseType: 'json',
              headers: { 'Content-Type': 'application/json' }
            })
            expect(resp.status).toBe(201)
            expect(resp.headers).toBeDefined()
            expect(resp.body.method).toBe('POST')
            expect(resp.body.data).toEqual(data)
            expect(resp.body.headers['content-type']).toEqual('application/json')
          })
        })
      })
    })

    describe('put(url, body, options)', () => {
      const data = { test: true }

      it('should use the PUT method', async () => {
        const resp = await client.put(serverUrl + paths.resource, data)
        expect(resp.status).toBe(200)
        expect(resp.headers).toBeDefined()
      })

      describe('with options.responseType', () => {
        it('should return body in response.body', async () => {
          const resp = await client.put(serverUrl + paths.resource, data, { responseType: 'json' })
          expect(resp.body).toBeDefined()
        })
      })
    })

    describe('setHeader(name, value)', () => {
      it('should set the header', async () => {
        const apiKey = 'secret'
        client.setHeader('api-key', apiKey)

        const resp = await client.get<RequestInfo>(serverUrl + paths.headers, { responseType: 'json' })
        expect(resp.status).toBe(200)
        expect(resp.body.headers).toBeDefined()
        expect(resp.body.headers['api-key']).toEqual(apiKey)
      })

      describe('with null or undefined value', () => {
        it('should remove the header', async () => {
          const apiKey = 'secret'
          client.setHeader('api-key', apiKey)
          client.setHeader('api-key', undefined)

          const resp = await client.get<RequestInfo>(serverUrl + paths.headers, { responseType: 'json' })
          expect(resp.status).toBe(200)
          expect(resp.body.headers).toBeDefined()
          expect(resp.body.headers['api-key']).toBeUndefined()
        })
      })
    })

    describe('setHeaders(headers)', () => {
      it('should set headers', async () => {
        const headers = { test: 'true' }
        client.setHeaders(headers)

        const resp = await client.get<RequestInfo>(serverUrl + paths.headers, { responseType: 'json' })
        expect(resp.status).toBe(200)
        expect(resp.body.headers).toBeDefined()
        expect(resp.body.headers.test).toEqual(headers.test)
      })
    })

    describe('setOption(name, value)', () => {
      it('should set option', async () => {
        const options: RequestInit = {
          mode: 'same-origin'
        }
        client.setOption('mode', options.mode)

        const resp = await client.get<RequestInfo>(serverUrl + paths.headers, { responseType: 'json' })
        expect(resp.status).toBe(200)
        expect(resp.body.headers).toBeDefined()
        expect(resp.body.headers['sec-fetch-mode']).toBe(options.mode)
      })
    })

    describe('setOptions(options)', () => {
      it('should set options', async () => {
        const options: RequestInit = {
          mode: 'same-origin'
        }
        client.setOptions(options)

        const resp = await client.get<RequestInfo>(serverUrl + paths.headers, { responseType: 'json' })
        expect(resp.status).toBe(200)
        expect(resp.body.headers).toBeDefined()
        expect(resp.body.headers['sec-fetch-mode']).toBe(options.mode)
      })
    })
  })

  describe('options.baseUrl', () => {
    const client = new FetchClient({
      baseUrl: serverUrl
    })

    it('should prepend baseUrl to relative URL', async () => {
      const resp = await client.get(paths.resource)
      expect(resp.status).toBe(200)

      const resp2 = await client.get(paths.resource.substring(1))
      expect(resp2.status).toBe(200)
    })

    it('should not prepend baseUrl to absolute URL', async () => {
      const resp = await client.get(serverUrl + paths.resource)
      expect(resp.status).toBe(200)
    })
  })

  describe('options.responseType', () => {
    describe('with invalid responseType', () => {
      const client = new FetchClient({
        // @ts-ignore
        responseType: 'invalid'
      })

      it('should return response.body = undefined', async () => {
        const resp = await client.get(serverUrl + paths.blob)
        expect(resp.status).toBe(200)
        expect(resp.body).not.toBeDefined()
      })
    })

    describe('with default responseType', () => {
      const client = new FetchClient()

      it('should return response.body = undefined', async () => {
        const resp = await client.get(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeUndefined()
      })
    })

    describe('with responseType = undefined', () => {
      const client = new FetchClient({ responseType: undefined })

      it('should return response.body = undefined', async () => {
        const resp = await client.get(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeUndefined()
      })
    })

    describe('with responseType = "arrayBuffer"', () => {
      const client = new FetchClient({
        responseType: 'arrayBuffer'
      })

      it('should return body as ArrayBuffer', async () => {
        const resp = await client.get(serverUrl + paths.blob)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeDefined()
        expect(resp.body instanceof ArrayBuffer).toBe(true)
      })
    })

    describe('with responseType = "blob"', () => {
      const client = new FetchClient({
        responseType: 'blob'
      })

      it('should return body as Blob', async () => {
        const resp = await client.get(serverUrl + paths.blob)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeDefined()
        expect(resp.body instanceof Blob).toBe(true)
      })
    })

    describe('with responseType = "formData"', () => {
      const client = new FetchClient({
        responseType: 'formData'
      })

      it('should return body as FormData', async () => {
        const resp = await client.get<FormData>(serverUrl + paths.formData)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeDefined()
        expect(resp.body).toBeInstanceOf(FormData)
        expect(resp.body.get('date')).toBeDefined()
      })
    })

    describe('with responseType = "json"', () => {
      const client = new FetchClient({
        responseType: 'json'
      })

      it('should return body as JSON', async () => {
        const resp = await client.get(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeDefined()
        expect(typeof resp.body).toBe('object')
      })
    })

    describe('with responseType = "stream"', () => {
      const client = new FetchClient({
        responseType: 'stream'
      })

      it('should return body as ReadableStream', async () => {
        const resp = await client.get(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeDefined()
        expect(resp.body).toBeInstanceOf(ReadableStream)
      })
    })

    describe('with responseType = "text"', () => {
      const client = new FetchClient({
        responseType: 'text'
      })

      it('should return body as string', async () => {
        const resp = await client.get(serverUrl + paths.resource)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeDefined()
        expect(typeof resp.body).toBe('string')
      })
    })

    describe('with empty body in response', () => {
      const client = new FetchClient({ responseType: 'json' })

      it('should not use responseType', async () => {
        const resp = await client.delete(serverUrl + paths.noBody)
        expect(resp.status).toBe(204)
        expect(resp.body).toBeUndefined()
      })
    })

    describe('with "content-type" and "content-length" not defined in response', () => {
      const client = new FetchClient({ responseType: 'json' })

      it('should ignore body', async () => {
        const resp = await client.get(serverUrl + paths.resourceWithoutContentType)
        expect(resp.status).toBe(200)
        expect(resp.body).toBeUndefined()
      })
    })
  })

  describe('options.beforeEach', () => {
    const client = new FetchClient({
      responseType: 'json',
      beforeEach: async (url, options) => ({
        ...options,
        headers: { 'original-url': url }
      })
    })

    it('should be called before each request', async () => {
      const resp = await client.get<RequestInfo>(serverUrl + paths.headers)
      expect(resp.status).toBe(200)
      expect(resp.body.headers).toBeDefined()
      expect(resp.body.headers['original-url']).toBe(serverUrl + paths.headers)
    })
  })

  describe('options.afterEach', () => {
    const client = new FetchClient({
      responseType: 'json',
      afterEach: async (url, resp) => ({
        ...resp,
        headers: { 'original-url': url }
      })
    })

    it('should be called after each request', async () => {
      const resp = await client.get(serverUrl + paths.resource)
      expect(resp.status).toBe(200)
      expect(resp.headers).toBeDefined()
      expect(resp.headers['original-url']).toBe(serverUrl + paths.resource)
    })
  })

  describe('options.transformError', () => {
    const callback = vi.fn((error: FetchResponseError, response: FetchClientResponse) => {
      if (error.response.body?.error) {
        return new FetchResponseError(error.response.body.error, response)
      }
      return error
    })
    const client = new FetchClient({
      responseType: 'json',
      transformError: callback
    })

    it('should transform response error', async () => {
      let error: FetchResponseError | undefined
      const message = 'Custom Error'
      try {
        await client.get(serverUrl + paths.error + `?error=${message}`)
      } catch (e) {
        if (e instanceof FetchResponseError) {
          error = e
        }
      }
      expect(callback).toHaveBeenCalled()
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(FetchResponseError)
      expect(error?.response).toBeDefined()
      expect(error?.message).toBe(error?.response.body.error)
    })
  })

  describe('options.transformRequest', () => {
    const client = new FetchClient({
      responseType: 'json',
      transformRequest: [
        (url, options) => ({
          ...options,
          headers: {
            test: 'true'
          }
        })
      ]
    })

    it('should transform request options', async () => {
      const resp = await client.get<RequestInfo>(serverUrl + paths.headers)
      expect(resp.status).toBe(200)
      expect(resp.body.headers).toBeDefined()
      expect(resp.body.headers.test).toBe('true')
    })
  })

  describe('options.transformResponse', () => {
    const update = { a: true }
    let r: Response

    const client = new FetchClient({
      responseType: 'json',
      transformResponse: [
        (body, response) => ({
          ...body,
          response
        }),
        (body, response) => {
          r = response
          return {
            ...body,
            ...update
          }
        }
      ]
    })

    it('should transform response', async () => {
      const resp = await client.get<RequestInfo & typeof update>(serverUrl + paths.headers)
      expect(resp.status).toBe(200)
      expect(resp.body.a).toBe(update.a)
    })

    it('should pass Response as second argument to callbacks', async () => {
      await client.get(serverUrl + paths.headers)
      expect(r).toBeInstanceOf(Response)
    })
  })

  describe('with request responseType different than options.responseType', () => {
    const client = new FetchClient({ responseType: 'json' })

    it('should use request responseType', async () => {
      const resp = await client.get(serverUrl + paths.resource, { responseType: 'text' })
      expect(resp.status).toBe(200)
      expect(typeof resp.body).toBe('string')
    })
  })

  describe('with server error', () => {
    const client = new FetchClient({ responseType: 'json' })

    it('should throw an error', async () => {
      let error: FetchResponseError | undefined
      try {
        await client.get(serverUrl + paths.error)
      } catch (e) {
        if (e instanceof FetchResponseError) {
          error = e
        }
      }
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(FetchResponseError)
      expect(error?.response).toBeDefined()
      expect(error?.response.body).toBeDefined()
      expect(error?.response.headers).toBeDefined()
      expect(error?.response.status).toBeDefined()
      expect(error?.response.statusText).toBeDefined()
    })
  })
})
