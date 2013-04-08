(function(window) {

	var StompChannel = {};
	var sc = StompChannel;
	
	sc.Channel = function(url, username, password, other) {
		/*
			This channel's receiving queue: /queue/username
			This channel's sending queue:   /queue/other
		*/
		this.client = Stomp.client(url);
		this.username = username;
		this.password = password;
		this.other = other;
		this.url = url;
	};
	
	sc.Channel._onerror = function (frame) {
		console.log("in StompChannel._onerror");
		if (this.handler != null) {
			this.handler.onerror();
		}
	}
	
	sc.Channel.prototype._onopen = function () {
		if (this.handler != null) {
			this.handler.onopen();
		}
	}

	sc.Channel.prototype.setHandler = function(handler) {
		this.handler = handler;
	}

	sc.Channel.prototype.open = function(handler) {
		var This = this;
		this.handler = handler;
		
		_onopen = function () {
			This._onopen();
		}
		
		_onmessage = function (frame) {
			This.handler.onmessage(frame.body);
		}

		_onconnect = function (frame) {
			console.log("in StompChannel._onconnect");
			This.client.subscribe("/queue/" + This.username, _onmessage);
			This._onopen()
		}
		
		_onclose = function (msg) {
			This.handler.onclose();
		}
		
		_onerror = function (frame) {
			This._onerror(frame);
		}

		this.client.connect(this.username, this.password, _onconnect, _onclose, this.url);
		/*
			'onopen': onChannelOpened,
			'onmessage': onChannelMessage,
			'onerror': onChannelError,
			'onclose': onChannelClosed
		*/
		this.client.onopen = _onopen;
		this.client.onerror = _onerror;
	}

	sc.Channel.prototype.send = function(message) {
		this.client.send(this.other, {}, message);
	};

	window.StompChannel = sc;

})(window);

