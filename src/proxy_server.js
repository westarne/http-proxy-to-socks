// inspired by https://github.com/asluchevskiy/http-to-socks-proxy
const util = require('util');
const http = require('http');
const net = require('net');
const Socks = require('socks');
const { logger } = require('./logger');

// object class definition

function ProxyServer(options) {
  // TODO: start point
  http.Server.call(this, () => { });

  this.proxyList = [];

  if(options.proxies) {
    // stand alone proxy loging
    this.proxyList = options.proxies.map(proxy => {
      let socksProxy = parseProxyLine(proxy.socks);
      let whitelist = proxy.whitelist ? proxy.whitelist.map(regex => new RegExp(regex)) : undefined;
      let blacklist = !whitelist && proxy.blacklist ? proxy.blacklist.map(regex => new RegExp(regex)) : undefined;

      return { socksProxy, whitelist, blacklist };
    });
  }

  this.addListener(
    'request',
    requestListener.bind(null, this.proxyList)
  );
  this.addListener(
    'connect',
    connectListener.bind(null, this.proxyList)
  );
}

util.inherits(ProxyServer, http.Server);

// listeners

/**
 * called on HTTP targets
 */
function requestListener(proxyList, request, response) {
  logger.info(`request: ${request.url}`);

  const target = new URL(request.url);
  const proxy = getProxyInfo(proxyList, target);

  if(proxy) {
    onSocksHttp(target, request, response, proxy);
  }
  else {
    onNoProxyHttp(target, request, response);
  }
}

/**
 * called on HTTPs targets
 */
function connectListener(proxyList, request, socketRequest, head) {
  logger.info(`connect: ${request.url}`);

  const target = new URL(`http://${request.url}`); // connect listeners don't have the protocol in the url
  const proxy = getProxyInfo(proxyList, target);

  if(proxy) {
    onSocksHttps(target, request, socketRequest, head, proxy);
  }
  else {
    onNoProxyHttps(target, request, socketRequest, head);
  }
}

// forwarding

function onSocksHttp(target, req, res, proxy) {
  const socksAgent = new Socks.Agent({
    proxy,
    target: { host: target.hostname, port: target.port },
  });
  logger.info(`forwarding SOCKS HTTP for ${target} to ${proxy.ipaddress}:${proxy.port}`);
  sendProxyRequest(target, req, res, socksAgent);
}

function onSocksHttps(target, request, socketRequest, head, proxy) {
  const options = {
    proxy,
    target: { host: target.hostname, port: target.port },
    command: 'connect',
  };

  logger.info(`forwarding SOCKS HTTPS for ${target} to ${proxy.ipaddress}:${proxy.port}`);

  let socket;

  socketRequest.on('error', (err) => {
    logger.error(`${err.message}`);
    if(socket) {
      socket.destroy(err);
    }
  });

  Socks.createConnection(options, (error, _socket) => {
    socket = _socket;

    if(error) {
      // error in SocksSocket creation
      logger.error(`${error.message} connection creating on ${proxy.ipaddress}:${proxy.port}`);
      socketRequest.write(`HTTP/${request.httpVersion} 500 Connection error\r\n\r\n`);
      return;
    }

    socket.on('error', (err) => {
      logger.error(`${err.message}`);
      socketRequest.destroy(err);
    });

    // tunneling to the host
    socket.pipe(socketRequest);
    socketRequest.pipe(socket);

    socket.write(head);
    socketRequest.write(`HTTP/${request.httpVersion} 200 Connection established\r\n\r\n`);
    socket.resume();
  });
}

function onNoProxyHttp(target, req, res) {
  logger.info(`forwarding HTTP for ${target} without tunneling`);
  sendProxyRequest(target, req, res);
}

function onNoProxyHttps(target, req, socket, head) {
  // Connect to an origin server
  logger.info(`forwarding HTTPS for ${target} without tunneling`);
  const serverSocket = net.connect(target.port || 80, target.hostname, () => {
    socket.write('HTTP/1.1 200 Connection Established\r\n' +
      'Proxy-agent: Node.js-Proxy\r\n' +
      '\r\n');
    serverSocket.write(head);
    serverSocket.pipe(socket);
    socket.pipe(serverSocket);
  });
}

function sendProxyRequest(uri, request, response, agent) {
  const options = {
    port: uri.port,
    hostname: uri.host,
    method: request.method,
    path: uri.path,
    headers: request.headers,
    agent,
  };

  const proxyRequest = http.request(options);

  request.on('error', (err) => {
    logger.error(`${err.message}`);
    proxyRequest.destroy(err);
  });

  proxyRequest.on('error', (error) => {
    logger.error(`${error.message} on connection to  ${uri.host}:${uri.port}`);
    response.writeHead(500);
    response.end('Connection error\n');
  });

  proxyRequest.on('response', (proxyResponse) => {
    proxyResponse.pipe(response);
    response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
  });

  request.pipe(proxyRequest);
}

// helpers

function getProxyInfo(proxyList, target) {
  let proxyEntry = proxyList
    .find(el =>
      (!el.whitelist || regexListMatchesString(el.whitelist, target.hostname)) &&
      (!el.blacklist || !regexListMatchesString(el.blacklist, target.hostname)));

  return proxyEntry ? proxyEntry.socksProxy : undefined;

}

function regexListMatchesString(list, string) {
  return !!list.find(regEx => regEx.test(string));
}

function getProxyObject(host, port, login, password) {
  return {
    ipaddress: host,
    port: parseInt(port, 10),
    type: 5,
    authentication: { username: login || '', password: password || '' },
  };
}

function parseProxyLine(line) {
  const proxyInfo = line.split(':');

  if(proxyInfo.length !== 4 && proxyInfo.length !== 2) {
    throw new Error(`Incorrect proxy line: ${line}`);
  }

  return getProxyObject.apply(this, proxyInfo);
}

// exports

module.exports = {
  createServer: options => new ProxyServer(options),
  requestListener,
  connectListener,
  getProxyObject,
  parseProxyLine,
  getProxyInfo,
};
