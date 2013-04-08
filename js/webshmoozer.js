(function(window) {

	var WebShmoozer = {};
	var ws = WebShmoozer;
	
	ws.CreateShmoozer = function (channel, settings) {
		var sh = new Shmoozer(channel, settings);
		return sh;
	};
	
	var Shmoozer = function(settings) {
		this.channel = settings.channel;
		this.setStatus = settings.setStatus;
		this.localVideo = settings.localVideo;
		this.remoteVideo = settings.remoteVideo;
		this.channelReady = false;
		var This = this;
		this.started = false;
		this.localStream = null;
		this.channelReady = false;
		this.pc = null;
		this.sdpConstraints = {'mandatory': {
				              'OfferToReceiveAudio':true, 
				              'OfferToReceiveVideo':true }};
		
		var localOnOpen = function () {
			This._onOpen();
		}

		var localOnMessage = function (msg) {
			This._onMessage(msg);
		}
		
		var localOnError = function (frame) {
			This._onError(frame);
		}
		
		var localOnClose = function () {
			This._onClose();
		}
		
		var handler = {
			'onopen': localOnOpen,
			'onmessage': localOnMessage,
			'onerror': localOnError,
			'onclose': localOnClose
		};
		
		channel.open(handler);

		this._getUserMedia();
	}
	
	Shmoozer.prototype._onUserMediaSuccess = function (stream) {
		console.log("User has granted access to local media.");
		// Call the polyfill wrapper to attach the media stream to this element.
		attachMediaStream(this.localVideo, stream);
		this.localVideo.style.opacity = 1;
		this.localStream = stream;
		this._setup();
	}
	
	Shmoozer.prototype._onOpen = function () {
		console.log('Channel opened.');
		this.setStatus('Connected');
		this.channelReady = true;
		this._setup();
	}
	
	Shmoozer.prototype._sendMessage = function (msg) {
		var msg_str = JSON.stringify(msg);
		this.channel.send(msg_str);
	}

	Shmoozer.prototype._onMessage = function (msg) {
		console.log('S->C: ' + msg);
		this._processSignalingMessage(msg);
	}
	
	Shmoozer.prototype._onError = function (frame) {
	
	}
	
	Shmoozer.prototype._onClose = function () {
		this.setStatus('Disconnected');
	}
	
	Shmoozer.prototype._processSignalingMessage = function (message) {
		console.log('proccessing message ' + message);
		var msg = JSON.parse(message);
		
		var This = this;
		var localDoAnswer = function () {
			This._doAnswer();
		}

		if (msg.type === 'offer') {
			this.pc.setRemoteDescription(new RTCSessionDescription(msg),
				localDoAnswer);
		} else if (msg.type === 'answer' && this.started) {
			this.pc.setRemoteDescription(new RTCSessionDescription(msg));
		} else if (msg.type === 'candidate' && this.started) {
			var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
						                       candidate:msg.candidate});
			this.pc.addIceCandidate(candidate);
		} else if (msg.type === 'bye' && started) {
			this._onRemoteHangup();
		}
	}

	Shmoozer.prototype._doAnswer = function () {
		console.log("Sending answer to peer.");
		var This = this;
		var localSetLocalAndSendMessage = function (sessionDescription) {
			This._setLocalAndSendMessage(sessionDescription);
		}
		var localFailureCallback = function (errorInformation) {
			console.log('failure callback: ' + errorInformation.toString());
		}
		this.pc.createAnswer(localSetLocalAndSendMessage, localFailureCallback, this.sdpConstraints);
	}
	
	Shmoozer.prototype._onIceCandidate = function (event) {
		if (event.candidate) {
		  this._sendMessage({type: 'candidate',
		               label: event.candidate.sdpMLineIndex,
		               id: event.candidate.sdpMid,
		               candidate: event.candidate.candidate});
		} else {
		  console.log("End of candidates.");
		}
	}

	Shmoozer.prototype._onRemoteStreamAdded = function (event) {
		console.log("Remote stream added now."); 
		attachMediaStream(this.remoteVideo, event.stream);
		this.remoteStream = event.stream;
		this.setStatus('In call');
	}
  

	Shmoozer.prototype._onRemoteStreamRemoved = function (event) {
		console.log("Remote stream removed.");
	}
	
	Shmoozer.prototype.createPeerConnection = function () {
		var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
		var pc_constraints = {"optional": [{"DtlsSrtpKeyAgreement": true}]};
		var This = this;
		// Force the use of a number IP STUN server for Firefox.
		if (webrtcDetectedBrowser == "firefox") {
		  pc_config = {"iceServers":[{"url":"stun:23.21.150.121"}]};
		}    
		try {
			// Create an RTCPeerConnection via the polyfill (adapter.js).
			this.pc = new RTCPeerConnection(pc_config, pc_constraints);

			var localOnIceCandidate = function (event) {
			This._onIceCandidate(event);
			}
			this.pc.onicecandidate = localOnIceCandidate;
			console.log("Created RTCPeerConnnection with:\n" + 
		                "  config: \"" + JSON.stringify(pc_config) + "\";\n" + 
		                "  constraints: \"" + JSON.stringify(pc_constraints) + "\".");
		} catch (e) {
			console.log("Failed to create PeerConnection, exception: " + e.message);
			alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.");
			return;
		}
		
		var localOnRemoteStreamAdded = function (event) {
			This._onRemoteStreamAdded(event);
		}
		
		var localOnRemoteStreamRemoved = function (event) {
			This._onRemoteStreamRemoved(event);
		}

		this.pc.onaddstream = localOnRemoteStreamAdded;
		this.pc.onremovestream = localOnRemoteStreamRemoved;
	}
	
	Shmoozer.prototype._setup = function () {
		if (!this.started && this.localStream && this.channelReady) {
			this.setStatus("Connecting...");
			console.log("Creating PeerConnection.");
			this.createPeerConnection();
			console.log("Adding local stream.");
			this.pc.addStream(this.localStream);
			this.started = true;
		}
	}

	Shmoozer.prototype.call = function () {
		console.log('Shmoozer making call');
		this._doCall();
	}

	Shmoozer.prototype._doCall = function () {
		var constraints = {"optional": [], "mandatory": {"MozDontOfferDataChannel": true}};
		var This = this;
		// temporary measure to remove Moz* constraints in Chrome
		if (webrtcDetectedBrowser === "chrome") {
			for (prop in constraints.mandatory) {
				if (prop.indexOf("Moz") != -1) {
				  delete constraints.mandatory[prop];
				}
			}
		}   
		constraints = this._mergeConstraints(constraints,
			this.sdpConstraints);
		console.log("Sending offer to peer, with constraints: \n" +
				"  \"" + JSON.stringify(constraints) + "\".")
		
		var localSetLocalAndSendMessage = function (sessionDescription) {
			This._setLocalAndSendMessage(sessionDescription);
		}
		
		this.pc.createOffer(localSetLocalAndSendMessage, null, constraints);
	}
	
	Shmoozer.prototype._setLocalAndSendMessage = function (sessionDescription) {
		// Set Opus as the preferred codec in SDP if Opus is present.
		sessionDescription.sdp = this._preferOpus(sessionDescription.sdp);
		this.pc.setLocalDescription(sessionDescription);
		this._sendMessage(sessionDescription);
	}
	
	  // Set Opus as the default audio codec if it's present.
	Shmoozer.prototype._preferOpus = function (sdp) {
		var sdpLines = sdp.split('\r\n');

		// Search for m line.
		for (var i = 0; i < sdpLines.length; i++) {
			if (sdpLines[i].search('m=audio') !== -1) {
				var mLineIndex = i;
				break;
			} 
		}
		if (mLineIndex === null)
			return sdp;

		// If Opus is available, set it as the default in m line.
		for (var i = 0; i < sdpLines.length; i++) {
			if (sdpLines[i].search('opus/48000') !== -1) {        
				var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
				if (opusPayload)
					sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
				break;
			}
		}

		// Remove CN in m line and sdp.
		sdpLines = removeCN(sdpLines, mLineIndex);

		sdp = sdpLines.join('\r\n');
		return sdp;
	}

	function extractSdp(sdpLine, pattern) {
		var result = sdpLine.match(pattern);
		return (result && result.length == 2)? result[1]: null;
	}

	// Set the selected codec to the first in m line.
	function setDefaultCodec(mLine, payload) {
		var elements = mLine.split(' ');
		var newLine = new Array();
		var index = 0;
		for (var i = 0; i < elements.length; i++) {
			if (index === 3) // Format of media starts from the fourth.
				newLine[index++] = payload; // Put target payload to the first.
			if (elements[i] !== payload)
				newLine[index++] = elements[i];
		}
		return newLine.join(' ');
	}

	// Strip CN from sdp before CN constraints is ready.
	function removeCN(sdpLines, mLineIndex) {
		var mLineElements = sdpLines[mLineIndex].split(' ');
		// Scan from end for the convenience of removing an item.
		for (var i = sdpLines.length-1; i >= 0; i--) {
			var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
			if (payload) {
				var cnPos = mLineElements.indexOf(payload);
				if (cnPos !== -1) {
					// Remove CN payload from m line.
					mLineElements.splice(cnPos, 1);
				}
				// Remove CN line in sdp
				sdpLines.splice(i, 1);
			}
		}

		sdpLines[mLineIndex] = mLineElements.join(' ');
		return sdpLines;
	}

	
	Shmoozer.prototype._mergeConstraints = function (cons1, cons2) {
		var merged = cons1;
		for (var name in cons2.mandatory) {
			merged.mandatory[name] = cons2.mandatory[name];
		}
		merged.optional.concat(cons2.optional);
		return merged;
	}

	Shmoozer.prototype._getUserMedia = function () {
		// Call into getUserMedia via the polyfill (adapter.js).
		var constraints = {"mandatory": {}, "optional": []};
		var This = this;
		
		var localOnUserMediaSuccess = function (stream) {
			console.log("User has granted access to local media.");
			// Call the polyfill wrapper to attach the media stream to this element.
			// attachMediaStream(localVideo, stream);
			// localVideo.style.opacity = 1;
			This.localStream = stream;
			This._onUserMediaSuccess(stream)
		}

		var localOnUserMediaError = function (error) {
			console.log("Failed to get access to local media. Error code was " + error.code);
			alert("Failed to get access to local media. Error code was " + error.code + ".");
		}

		try {
		  getUserMedia({'audio':true, 'video':constraints}, localOnUserMediaSuccess,
					   localOnUserMediaError);
		  console.log("Requested access to local media with mediaConstraints:\n" +
					  "  \"" + JSON.stringify(constraints) + "\"");
		} catch (e) {
			alert("getUserMedia() failed. Is this a WebRTC capable browser?");
			console.log("getUserMedia failed with exception: " + e.message);
		}
	}

	
	window.WebShmoozer = ws;

})(window);

