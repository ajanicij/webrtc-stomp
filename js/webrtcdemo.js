var username;
var password;
var peer;
var host;
var footer;
var localVideo;
var remoteVideo;

var channel;
var sh; // Shmoozer object

$(function() {
	footer = $('#footer')[0];
	localVideo = $('#localVideo')[0];
	remoteVideo = $('#remoteVideo')[0];

	$('#btn_connect').click(function() {
		username = $('#username').val();
		password = $('#password').val();
		peer = $('#peer').val();
		host = $('#host').val();
		openChannel();
		setStatus('Disconnected');
	});
	
	$('#btn_call').click(function() {
		sh.call();
	});
});

function openChannel() {
	console.log("Opening channel.");

	channel = new StompChannel.Channel(host, username, password,
		peer, '');
	var settings = {};
	settings.channel = channel;
	settings.setStatus = setStatus;
	settings.localVideo = localVideo;
	settings.remoteVideo = remoteVideo;
	sh = WebShmoozer.CreateShmoozer(settings);
}

function resetStatus() {
	setStatus("Waiting for a call");
}

function setStatus(state) {
	$('#status').text(state);
}

