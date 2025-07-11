# -*- coding: utf-8 -*-

orjson = None
try:
    import orjson as orjson
except ImportError:
    pass

import json
from asyncio import sleep, ensure_future
from aiohttp import WSMsgType
from .functions import milliseconds, iso8601, is_json_encoded_object
from ccxt.async_support.base.ws.client import Client
from ccxt.async_support.base.ws.functions import gunzip, inflate
from ccxt import NetworkError, RequestTimeout, ExchangeClosedByUser


class AiohttpClient(Client):

    proxy = None

    def closed(self):
        return (self.connection is None) or self.connection.closed

    def receive(self):
        return self.connection.receive()

    # helper method for binary and text messages
    def handle_text_or_binary_message(self, data):
        if self.verbose:
            self.log(iso8601(milliseconds()), 'message', data)
        if isinstance(data, bytes):
            data = data.decode()
        # decoded = json.loads(data) if is_json_encoded_object(data) else data
        decode = None
        if is_json_encoded_object(data):
            if orjson is None:
                decode = json.loads(data)
            else:
                decode = orjson.loads(data)
        else:
            decode = data
        self.on_message_callback(self, decode)

    def handle_message(self, message):
        # self.log(iso8601(milliseconds()), message)
        if message.type == WSMsgType.TEXT:
            self.handle_text_or_binary_message(message.data)
        elif message.type == WSMsgType.BINARY:
            data = message.data
            if self.gunzip:
                data = gunzip(data)
            elif self.inflate:
                data = inflate(data)
            self.handle_text_or_binary_message(data)
        # autoping is responsible for automatically replying with pong
        # to a ping incoming from a server, we have to disable autoping
        # with aiohttp's websockets and respond with pong manually
        # otherwise aiohttp's websockets client won't trigger WSMsgType.PONG
        elif message.type == WSMsgType.PING:
            if self.verbose:
                self.log(iso8601(milliseconds()), 'ping', message)
            ensure_future(self.connection.pong(message.data), loop=self.asyncio_loop)
        elif message.type == WSMsgType.PONG:
            self.lastPong = milliseconds()
            if self.verbose:
                self.log(iso8601(milliseconds()), 'pong', message)
            pass
        elif message.type == WSMsgType.CLOSE:
            if self.verbose:
                self.log(iso8601(milliseconds()), 'close', self.closed(), message)
            self.on_close(message.data)
        elif message.type == WSMsgType.CLOSED:
            if self.verbose:
                self.log(iso8601(milliseconds()), 'closed', self.closed(), message)
            self.on_close(1000)
        elif message.type == WSMsgType.ERROR:
            if self.verbose:
                self.log(iso8601(milliseconds()), 'error', message)
            error = NetworkError(str(message))
            self.on_error(error)

    def create_connection(self, session):
        # autoping is responsible for automatically replying with pong
        # to a ping incoming from a server, we have to disable autoping
        # with aiohttp's websockets and respond with pong manually
        # otherwise aiohttp's websockets client won't trigger WSMsgType.PONG
        # call aenter here to simulate async with otherwise we get the error "await not called with future"
        # if connecting to a non-existent endpoint
        if (self.proxy):
            return session.ws_connect(self.url, autoping=False, autoclose=False, headers=self.options.get('headers'), proxy=self.proxy, max_msg_size=10485760).__aenter__()
        return session.ws_connect(self.url, autoping=False, autoclose=False, headers=self.options.get('headers'), max_msg_size=10485760).__aenter__()

    async def send(self, message):
        if self.verbose:
            self.log(iso8601(milliseconds()), 'sending', message)
        send_msg = None
        if isinstance(message, str):
            send_msg = message
        else:
            if orjson is None:
                send_msg = json.dumps(message, separators=(',', ':'))
            else:
                send_msg = orjson.dumps(message).decode('utf-8')
        return await self.connection.send_str(send_msg)

    async def close(self, code=1000):
        if self.verbose:
            self.log(iso8601(milliseconds()), 'closing', code)
        if not self.closed():
            await self.connection.close()
        # these will end automatically once self.closed() = True
        # so we don't need to cancel them
        if self.ping_looper:
            self.ping_looper.cancel()
        for key in self.futures:
            future = self.futures[key]
            if not future.done():
                if future.is_race_future:
                    future.cancel()  # this is an "internal" future so we want to cancel it silently
                else:
                    future.reject(ExchangeClosedByUser('Connection closed by the user'))


    async def ping_loop(self):
        if self.verbose:
            self.log(iso8601(milliseconds()), 'ping loop')
        while self.keepAlive and not self.closed():
            now = milliseconds()
            self.lastPong = now if self.lastPong is None else self.lastPong
            if (self.lastPong + self.keepAlive * self.maxPingPongMisses) < now:
                self.on_error(RequestTimeout('Connection to ' + self.url + ' timed out due to a ping-pong keepalive missing on time'))
            # the following ping-clause is not necessary with aiohttp's built-in ws
            # since it has a heartbeat option (see create_connection above)
            # however some exchanges require a text-type ping message
            # therefore we need this clause anyway
            else:
                if self.ping:
                    try:
                        await self.send(self.ping(self))
                    except Exception as e:
                        self.on_error(e)
                else:
                    await self.connection.ping()
            await sleep(self.keepAlive / 1000)
