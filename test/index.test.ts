import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { fastify } from 'fastify'
import { FetchClient, FetchResponseError } from '../src'
import { fastifyMultipart } from '@fastify/multipart'

// Prepare server API

const port = 8888
const serverUrl = `http://localhost:${port}`
const server = fastify()
server.register(fastifyMultipart)

const paths = {
  blob: '/blob',
  error: '/error',
  formData: '/formData',
  headers: '/headers',
  noBody: '/no-body',
  resources: '/resources',
  resource: '/resources/1',
  resourceWithoutContentType: '/resourceWithoutContentType'
}

server.all(paths.error, (req, rep) => {
  rep.status(400)
    .send({ error: 'Bad Request' })
})

server.all(paths.noBody, (req, rep) => {
  rep.status(204).send()
})

server.get(paths.blob, () => {
  return Buffer.from('secret')
})

server.get(paths.formData, (req, rep) => {
  rep.status(200)
  rep.header('content-type', 'application/x-www-form-urlencoded')
  rep.send(`date=${Date.now()}`)
})

server.get(paths.headers, (req) => {
  return { headers: req.headers }
})

server.options(paths.resource, (req, rep) => {
  rep.status(200)
    .header('Allow', 'GET, PATCH, POST, PUT, DELETE, HEAD, OPTIONS')
    .send()
})

server.delete(paths.resource, (req) => {
  return {
    headers: req.headers,
    method: req.method
  }
})

server.get(paths.resource, (req) => {
  return {
    headers: req.headers,
    method: req.method,
    data: { id: 1 }
  }
})

server.get(paths.resourceWithoutContentType, (req, rep) => {
  rep.raw.write(JSON.stringify({
    headers: req.headers,
    method: req.method,
    data: { id: 1 }
  }))
  rep.raw.end()
})

server.patch(paths.resource, (req) => {
  const { body } = req
  return {
    headers: req.headers,
    method: req.method,
    data: body
  }
})

server.post(paths.resources, (req, rep) => {
  const { body } = req
  rep.status(201).send({
    headers: req.headers,
    method: req.method,
    data: body
  })
})

server.put(paths.resource, (req) => {
  const { body } = req
  return {
    headers: req.headers,
    method: req.method,
    data: body
  }
})

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
            const resp = await client.post(serverUrl + paths.resources, JSON.stringify(data), {
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

        const resp = await client.get(serverUrl + paths.headers, { responseType: 'json' })
        expect(resp.status).toBe(200)
        expect(resp.body.headers).toBeDefined()
        expect(resp.body.headers['api-key']).toEqual(apiKey)
      })

      describe('with null or undefined value', () => {
        it('should remove the header', async () => {
          const apiKey = 'secret'
          client.setHeader('api-key', apiKey)
          client.setHeader('api-key', undefined)

          const resp = await client.get(serverUrl + paths.headers, { responseType: 'json' })
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

        const resp = await client.get(serverUrl + paths.headers, { responseType: 'json' })
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

        const resp = await client.get(serverUrl + paths.headers, { responseType: 'json' })
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

        const resp = await client.get(serverUrl + paths.headers, { responseType: 'json' })
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
        const resp = await client.get(serverUrl + paths.formData)
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
      const resp = await client.get(serverUrl + paths.headers)
      expect(resp.status).toBe(200)
      expect(resp.body.headers).toBeDefined()
      expect(resp.body.headers.test).toBe('true')
    })
  })

  describe('options.transformResponse', () => {
    const update = { a: true }

    const client = new FetchClient({
      responseType: 'json',
      transformResponse: [
        (body, response) => ({
          ...body,
          response
        }),
        (body) => ({
          ...body,
          ...update
        })
      ]
    })

    it('should transform response', async () => {
      const resp = await client.get(serverUrl + paths.headers)
      expect(resp.status).toBe(200)
      expect(resp.body.a).toBe(update.a)
    })

    it('should pass Response as second argument to callbacks', async () => {
      const resp = await client.get(serverUrl + paths.headers)
      expect(resp.body.response).toBeInstanceOf(Response)
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
    const client = new FetchClient()

    it('should throw an error', async () => {
      let error
      try {
        await client.get(serverUrl + paths.error, { responseType: 'json' })
      } catch (e) {
        error = e
      }
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(FetchResponseError)
      expect(error.response).toBeDefined()
      expect(error.response.body).toBeDefined()
      expect(error.response.headers).toBeDefined()
      expect(error.response.status).toBeDefined()
      expect(error.response.statusText).toBeDefined()
    })
  })
})
