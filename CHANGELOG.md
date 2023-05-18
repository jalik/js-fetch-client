# Changelog

## v1.0.2 (2023-05-18)

- Fixed handling of response with no Body (ex: code 204) by checking `content-type` header instead of `content-length`

## v1.0.1 (2023-05-16)

- Fixed handling of response with no Body (ex: code 204) using option `responseType: undefined` or by checking `content-length` header

## v1.0.0 (2023-05-03)

- First public release
