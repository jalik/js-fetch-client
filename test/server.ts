// Prepare server API

import { fastify } from 'fastify'
import { fastifyMultipart } from '@fastify/multipart'
import http from 'http'

export type RequestInfo = {
  headers: http.IncomingHttpHeaders
  method?: string
  data?: unknown
}

const server = fastify()

// Add support for file uploading.
server.register(fastifyMultipart)

export const paths = {
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
  const { query } = req
  rep.status(400)
    // @ts-ignore
    .send({ error: query.error || 'Bad Request' })
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

server.get(paths.headers, (req): RequestInfo => {
  return { headers: req.headers }
})

server.options(paths.resource, (req, rep) => {
  rep.status(200)
    .header('Allow', 'GET, PATCH, POST, PUT, DELETE, HEAD, OPTIONS')
    .send()
})

server.delete(paths.resource, (req): RequestInfo => {
  return {
    headers: req.headers,
    method: req.method
  }
})

server.get(paths.resource, (req): RequestInfo => {
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

server.patch(paths.resource, (req): RequestInfo => {
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

server.put(paths.resource, (req): RequestInfo => {
  const { body } = req
  return {
    headers: req.headers,
    method: req.method,
    data: body
  }
})

export default server
