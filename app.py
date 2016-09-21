import asyncio
from aiohttp import web
from aiohttp.web import WebSocketResponse, MsgType, Response

wsk = {}
wst = {}

# WebSocket for screen
@asyncio.coroutine
def wso(request):
    global wsk
    global wst
    wsk0 = WebSocketResponse()
    wsk0.start(request)
    unauth = True
    while True:
        msg = yield from wsk0.receive()
        if msg.tp == MsgType.text:
            print("Screen")
            print(msg.data)
            if unauth:
                wsk0.auth = msg.data
                wsk[wsk0.auth] = wsk0
                unauth = False
                continue
            if msg.data == 'close':
                yield from wsk0.close()
                wsk.pop(wsk0.auth, None)
                break
            else:
                wst[wsk0.auth].send_str(msg.data)
        elif msg.tp == MsgType.close:
            break
        elif msg.tp == MsgType.error:
            break
    wsk.pop(wsk0.auth, None)
    return wsk0


# Websocket for mobile device
@asyncio.coroutine
def wsi(request):
    global wst
    global wsk
    wst0 = WebSocketResponse()
    wst0.start(request)
    unauth = True
    while True:
        msg = yield from wst0.receive()
        if msg.tp == MsgType.text:
            print("Mobile")
            print(msg.data)
            if unauth:
                wst0.auth = msg.data
                wst[wst0.auth] = wst0
                unauth = False
                continue            
            if msg.data == 'close':
                yield from wst0.close()
                wst.pop(wst0.auth, None)
                break
            else:
                wsk[wst0.auth].send_str(msg.data)
        elif msg.tp == MsgType.close:
            break
        elif msg.tp == MsgType.error:
            break
    wst.pop(wst0.auth, None)
    return wst0


@asyncio.coroutine
def verify_token(request):
    global wst
    token = request.match_info.get('token')
    if token in wst:
        return Response(status=200)
    return Response(status=500)


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

loop = asyncio.get_event_loop()
app = web.Application()
app.router.add_route('GET', '/ws', wso)
app.router.add_route('GET', '/is', wsi)
app.router.add_route('GET', '/verify/{token}', verify_token)
# app.router.add_route('GET', '/{req}', get_file)
app.router.add_static('/', '.')
srv = loop.create_server(app.make_handler(), '0.0.0.0', 8080)
loop.run_until_complete(srv)

try:
    loop.run_forever()
except KeyboardInterrupt:
    pass
