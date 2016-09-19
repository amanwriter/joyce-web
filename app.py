import asyncio
from aiohttp import web
from aiohttp.web import WebSocketResponse, MsgType, Response

wsk = None
wst = None
vib = False

class EchoServerProtocol:
    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        global wsk
        message = data.decode()
        wsk.send_str(message)
        # print(message)
        # print('Received %r from %s' % (message, addr))
        # self.transport.sendto("msg".encode(), addr)
        # print("sent message")
        # print('Send %r to %s' % (message, addr))
        # self.transport.sendto(data, addr)

loop = asyncio.get_event_loop()
print("Starting UDP server on port 9999")
# One protocol instance will be created to serve all client requests
listen = loop.create_datagram_endpoint(
    EchoServerProtocol, local_addr=('0.0.0.0', 9999))
transport, protocol = loop.run_until_complete(listen)


# WebSocket for screen
@asyncio.coroutine
def wso(request):
    global wsk
    global wst
    wsk = WebSocketResponse()
    wsk.start(request)
    while True:
        msg = yield from wsk.receive()
        if msg.tp == MsgType.text:
            if msg.data == 'close':
                yield from wsk.close()
                break
            elif msg.data == 'v':
                wst.send_str('v')
        elif msg.tp == MsgType.close:
            break
        elif msg.tp == MsgType.error:
            break
    return wsk


# Websocket for mobile device
@asyncio.coroutine
def wsi(request):
    global wst
    wst = WebSocketResponse()
    wst.start(request)
    while True:
        msg = yield from wst.receive()
        if msg.tp == MsgType.text:
            if msg.data == 'close':
                yield from wst.close()
                break
        elif msg.tp == MsgType.close:
            break
        elif msg.tp == MsgType.error:
            break
    return wst


@asyncio.coroutine
def get_file(request):
    req = request.match_info.get('req')
    try:
        f = open(req, 'r')
        resp = f.read()
        f.close()
    except:
        resp = ''
    return Response(status=200, body=resp.encode())


app = web.Application()
app.router.add_route('GET', '/ws', wso)
app.router.add_route('GET', '/is', wsi)
app.router.add_route('GET', '/{req}', get_file)

srv = loop.create_server(app.make_handler(), '0.0.0.0', 8080)
loop.run_until_complete(srv)

try:
    loop.run_forever()
except KeyboardInterrupt:
    pass

# aiohttp.web.run_app(app)