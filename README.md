# WebRTC demo using STOMP for signaling

This is another WebRTC demo. In a neverending stream of WebRTC demos, why should
you care about yet another one? Because this demo uses a standard protocol,
STOMP, as the transport for the signaling channel.

## What is WebRTC

WebRTC is a standard for peer-to-peer real-time communication between two or
more web browsers. For more information, you can look here:
	[WebRTC](http://docs.webplatform.org/wiki/concepts/internet_and_web/webrtc)

## Signaling

The WebRTC standard deliberately leaves signaling unspecified. A web
application is free to use any means possible for signaling.

In reality, in the year 2013 any means of a client-side JavaScript application
to communicate with the world can use two and only two transport mechanisms:
	* HTTP - This includes HTTPS as HTTP over TLS; any of techniques
	  commonly known as Ajax, such as Comet, long polling use HTTP.
	* WebSocket - This is a newer technology and not yet as widely used, but
	  was created to make real-time communication on the web as natural and
	  easy to use as possible.

I think it is a safe bet to predict that the latter will prevail: WebSocket
is a natural fit for real-time communication on the web, while Ajax was
always a kludge that has become so widespread because at the time there was
nothing better available.

However, at the moment, Ajax is far more popular and the development on the
server side is much easier using Ajax than WebSocket.

For this demo I use WebSocket, but WebSocket is just a transport and on top of it we need an application protocol (in the parlance of WebSocket this is
known as "subprotocol"). People invent their own little mini-protocols,
because this is very early stage of WebRTC and you want your demo to work,
rather than spending time on designing a protocol.

The problem with this is that you have to implement the server side as well.
Then we end up with a bunch of demos that consist of custom implementations
of client and server side of a mini protocol that is used in the particular
demo and nowhere else.

Rather than take this route, I decided to use STOMP, a protocol that is already standard and has a few server-side implementations. You can read about
it here:
	[STOMP](http://stomp.github.io)

On the client side, I use Jeff Mesnil's JavaScript library stomp.js. You can
learn more here:
	[STOMP Over WebSocket](http://jmesnil.net/stomp-websocket/doc/)
and the code is on GitHub:
	[stomp-websocket](https://github.com/jmesnil/stomp-websocket/)

On the server side, you can use any STOMP server that supports WebSocket; I
used Apache ActiveMQ.

## Protocol

OK, so now you must be thinking, "Wait a minute, didn't you just say that
you use a standard protocol so you don't have to invent and implement your
own?" The truth of the matter is that you still have to use some convention to
get the two peers to talk to each other. You can call that a protocol, or you
can say it is just a detail of how you use the STOMP protocol.

The details are really easy: each peer reads messages from a queue named
/queue/<name>, where the <name> is the peer's name. For example, if the peers
are alice and bob, they communicate via two queues: /queue/alice and
/queue/bob. alice sends messages by writing them to /queue/bob and bob sends
messages by writing them to /queue/alice.

And that's it. In order to use the demo, you need to have a running ActiveMQ
server with WebSocket enabled and two browsers open on two computers, each
supporting WebRTC. At the time of writing, the latest version of Chrome is
26.0.1410.43. Firefox Nightly supports WebRTC. I am not sure about the level
of support in Firefox 20, because at the time being I have only tried the
demo with Chrome and Chrome for Android (which also supports WebRTC as of
recently).

On the web page, enter the host and port of your STOMP server in the input
box labeled "STOMP host." If that is ActiveMQ and if you are running it on
the same box as the browser, it will be something like
	ws://localhost:61614/stomp

Last but not least, I took a lot of WebRTC code from the sample that you can
find at
	[WebRTC demo](http://www.webrtc.org/demo)
The code from that demo you can find in two files:
	* adapter.js - polyfill to make Chrome and Firefox Nightly talk to each
	  other
	* webshmoozer.js - (pardon the ugly name; I should really think of a
	  better name for this file) all the code that make the two clients
	  perform the two negotiations: ICE for negotiating the connection and
	  SDP for negotiating the audio and video codecs

## What next

STOMP protocol is convenient as a proof of concept, but not for a real use
of WebRTC. For that, I want to try XMPP, which was made for real-time
peer-to-peer communication anyway. Watch this space...

