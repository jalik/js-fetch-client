# Changelog

## v2.0.0 (2023-05-25)

- **[BREAKING CHANGE]** Changed default value of `responseType` to `undefined`
- **[BREAKING CHANGE]** Renamed `response.data` to `response.body`
- **[BREAKING CHANGE]** Renamed value `arraybuffer` to `arrayBuffer` in `responseType` option
- **[BREAKING CHANGE]** Do not return Response in `response.body` when `responseType` is `undefined`
- Added value `formData` to `responseType` option
- Added value `stream` to `responseType` option
- Added response as the second argument of `transformResponse` callbacks
- Added `redirected` to response
- Added `type` to response
- Added `original` (containing the original Response) to response

## v1.0.4 (2023-05-24)

- Fixed response data not being defined when `content-type` is missing in response headers

## v1.0.3 (2023-05-18)

- Allow passing `responseType` on each request options

## v1.0.2 (2023-05-18)

- Fixed handling of response with no Body (ex: code 204) by checking `content-type` header instead
  of `content-length`

## v1.0.1 (2023-05-16)

- Fixed handling of response with no Body (ex: code 204) using option `responseType: undefined` or
  by checking `content-length` header

## v1.0.0 (2023-05-03)

- First public release
