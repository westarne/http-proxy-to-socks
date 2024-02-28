# http-proxy-to-socks

Fork of https://github.com/oyyd/http-proxy-to-socks.

hpts(http-proxy-to-socks) is a nodejs tool to convert SOCKS proxy into http proxy.

Many clients support setting up http proxy to speed up network requests and for sometimes only SOCKS proxy is available to you. SOCKS proxy supports TCP so that it's possible to convert those requests from http proxy into SOCKS protocol. In this way, you can still keep the goodness provided by your SOCKS proxy(e.g. encryption).

This fork additionally provides the functionality to proxy only selected hosts and also define different socks proxies chosen by the target hostname of your request.

## Setup

This fork was not released on npm, so you have to install it manually.

1. if you have hpts from official npm installed run `npm uninstall -g http-proxy-to-socks`, to uninstall it. Run `hpts` to test whether it was removed correctly.
2. clone or download this repository
3. open a terminal in the downloaded directory
4. run `npm i && npm link` (will install dependencies and link the hpts command)
5. run the module using `hpts [parameters]` (from anywhere on your machine)

Make sure your nodejs version is greater/equal to `14`.

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
  -c, --config [config]       path to a json config file or the json config as string
  --level [level]             log level, vals: info, error, default: error
```

### Configuration File

The cli parameters do not support white-/blacklists. This is only possible using the `json` config file with `-c`:

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

### Proxy Authentication

Use the basic auth syntax to add proxy credentials. E.g. `someuser:password@myproxy:1080`.

## CONTRIBUTE

Please add more tests for corresponding features when you send a PR:

```
npm run test
```

## License

MIT
