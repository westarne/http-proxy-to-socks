# http-proxy-to-socks

[![build](https://api.travis-ci.org/oyyd/http-proxy-to-socks.svg?branch=master)](https://travis-ci.org/oyyd/http-proxy-to-socks)

[简介](https://github.com/oyyd/http-proxy-to-socks/blob/master/READMECN.md)

hpts(http-proxy-to-socks) is a nodejs tool to convert SOCKS proxy into http proxy.

Many clients support setting up http proxy to speed up network requests and for sometimes only SOCKS proxy is available to you. SOCKS proxy supports TCP so that it's possible to convert those requests from http proxy into SOCKS protocol. In this way, you can still keep the goodness provided by your SOCKS proxy(e.g. encryption).

## Setup

```
npm install -g http-proxy-to-socks
```

Make sure your nodejs version is greater than `4`.

## Usage

```
hpts -s 127.0.0.1:1080 -p 8080
```

This will start a process listening on `8080` as a http proxy. It will convert http requests into socks requests and send them to port `1080`. Please make sure your socks service is available at the corresponding port.

Other options:

```
Options:

  -h, --help                  output usage information
  -V, --version               output the version number
  -s, --socks [socks]         specify your socks proxy host (only one possible through cli), default: 127.0.0.1:1080
  -l, --host [host]           specify the listening host of http proxy server, default: 127.0.0.1
  -p, --port [port]           specify the listening port of http proxy server, default: 8080
  -c, --config [config]       read configs from file in json format
  --level [level]             log level, vals: info, error
```

The cli commands do not support white-/blacklists. This is only possible using the `json` config file with `-c`:

```json
{
  "host": "127.0.0.1",
  "port": 8080,
  "level": "info",
  "proxies": [
    {
      "socks": "127.0.0.1:1080",
      "whitelist": [ "google\\.com", "\\.org$" ]
    },
    {
      "socks": "127.0.0.1:1081",
      "blacklist": [ "^github\\.com$" ]
    }
  ]
}
```

### White- and Blacklists

White- and blacklists can be used to determine hosts that either should or should not be proxied. These are regular expressions being matched against the **hostname** of the target. The protocol/host/path are not part of this matching.
Make sure to use correct RegExp syntax für JavaScript. You can only have either a white- or a blacklist. Since a whitelist is usually more limiting, if both are specified only the whitelist will be used.

Hosts defined in a whitelist will be proxied, all other hosts will be accessed without going through the socks proxy defined. Blacklisted vice versa.

## CONTRIBUTE

Please add more tests for corresponding features when you send a PR:

```
npm run test
```

## License

MIT
