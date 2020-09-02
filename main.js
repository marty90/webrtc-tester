/*
*  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

const leftVideo = document.getElementById('leftVideo');
const rightVideo = document.getElementById('rightVideo');

let stream;

let pc1;
let pc2;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

let startTime;
let queryDict = {} ;

function parseArgs(){

  location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]}) ;

  if ("video" in queryDict) {
    var video = queryDict["video"] ;
    console.log("[PARAMS] Setting video to:", video);
    var sources = leftVideo.getElementsByTagName('source');
    sources[0].src = video;
    leftVideo.load();
  }
}

parseArgs();

function maybeCreateStream() {
  if (stream) {
    return;
  }
  if (leftVideo.captureStream) {
    stream = leftVideo.captureStream();
    console.log('Captured stream from leftVideo with captureStream',
        stream);
    call();
  } else if (leftVideo.mozCaptureStream) {
    stream = leftVideo.mozCaptureStream();
    console.log('Captured stream from leftVideo with mozCaptureStream()',
        stream);
    call();
  } else {
    console.log('captureStream() not supported');
  }
  // se usi solo getConnestionStats senza 2 ottieni report completo
  window.setInterval(getConnectionStats2, 1000, pc1, ".stats-box1")
  window.setInterval(getConnectionStats2, 1000, pc2, ".stats-box2")

}

function getConnectionStats2(pc, query) {
  pc.getStats(null).then(stats => {
    let statsOutput = "";
    // contiene parte del report inbound/outbound
    let dict_type = {};
    //contiene parte del report track
    let dict_track = {};
    //contiene parte del report candidate-locate
    let dict_candidate_loc = {};
    //contiene parte del report remote-candidate
    let dict_candidate_rem = {};
    //contiene parte del report remote-rtp-inbound
    let dict_remote_in = {};
    //salvo i dict tenendo conto che nel report inbound/outbound ho tutte le chiavi trackId, mediaId, transportId, Codec etc.
    //gli altri report hanno solo una di queste chiavi, quindi i dict vanno poi incrociati tra loro usando i campi di dict_type
    //come chiave di ricerca negli altri
    let statsOutput_json = {};
    stats.forEach(report => {
        if (report.type == "local-candidate") {
            dict_candidate_loc[report.transportId] = {"port" : report.port, "protocol" : report.protocol,
        "ip":report.ip, "candidate" : "local"}
        }
        if (report.type == "remote-candidate") {
            dict_candidate_rem[report.transportId] = {"port" : report.port, "protocol" : report.protocol,
        "ip":report.ip, "candidate" : "remote"}
        }
        if (report.type == "track" && report.kind == "video") {
            dict_track[report.id] = {"width": report.frameWidth, "height": report.frameHeight}// questo id sarebbe mediaSourceId in outbound report
        }
        if (report.type == "outbound-rtp") {
            dict_type[report.id] = {"transportId":report.transportId, "ssrc":report.ssrc, "mediaSourceId" : report.mediaSourceId, "codecId":report.codecId,
        "side":"outbound", "kind" : report.kind, "framsesSent":report.framesSent, "totalPacketSendDelay":report.totalPacketSendDelay, "fps": report.framesPerSecond,
        "trackId":report.trackId}
        }
        if (report.type == "inbound-rtp") {
            dict_type[report.id] = {"transportId":report.transportId, "ssrc":report.ssrc, "mediaSourceId" : report.mediaSourceId, "codecId":report.codecId,
        "side":"inbound", "trackId":report.trackId, "kind":report.kind}
        }
        if (report.type == "remote-inbound-rtp") {
            dict_remote_in[report.codecId] = {"jitter":report.jitter, "packetsLost":report.packetsLost, "ssrc":report.ssrc, "kind":report.kind, "roundTripTime":report.roundTripTime,
        "transportId":report.transportId}
        }
    });

    for (let key in dict_type) {
      let report = dict_type[key]
      statsOutput_json = {};
      if (report.kind == "audio"){
          statsOutput += `<h2>Audio: ${report.side}</h2><strong>SSRC: </strong>${report.ssrc}<br>\n
          <strong>CodecId: </strong>${report.codecId}<br>\n`;
          statsOutput_json["type"] = "Audio";
          statsOutput_json["ssrc"] = report.ssrc;
          statsOutput_json["codecId"] = report.codecId;
      }
      if (report.kind == "video") {
          statsOutput += `<h2>Video: ${report.side}</h2>\n<strong>SSRC: </strong>${report.ssrc}<br>\n
          <strong>CodecId: </strong>${report.codecId}<br>\n`;
          statsOutput += `<strong>width: </strong>${dict_track[report.trackId]["width"]}<br>\n
          <strong>heigth: </strong>${dict_track[report.trackId]["height"]}<br>\n
          <strong>fps: </strong>${report["fps"]}<br>\n`;
          statsOutput_json["type"] = "Video";
          statsOutput_json["side"] = report.side;
          statsOutput_json["ssrc"] = report.ssrc;
          statsOutput_json["codecId"] = report.codecId;
          statsOutput_json["height"] = dict_track[report.trackId]["height"];
          statsOutput_json["width"] = dict_track[report.trackId]["width"];
          statsOutput_json["fps"] = report["fps"];

      }
      if (report.side == "outbound"){
          statsOutput += `<strong>jitter: </strong>${dict_remote_in[report.codecId]["jitter"]}<br>\n
          <strong>packetsLosts: </strong>${dict_remote_in[report.codecId]["packetsLost"]}<br>\n
          <strong>roundTripTime: </strong>${dict_remote_in[report.codecId]["roundTripTime"]}<br>\n`;
          statsOutput_json["outbound"] = "y";
          statsOutput_json["jitter"] = dict_remote_in[report.codecId]["jitter"];
          statsOutput_json["packetsLosts"] = dict_remote_in[report.codecId]["packetsLost"];
          statsOutput_json["roundTripTime"] = dict_remote_in[report.codecId]["roundTripTime"];
      }
      statsOutput += `<strong>Port dst: </strong>${dict_candidate_rem[report.transportId]["port"]}<br>\n
      <strong>Protocol dst: </strong>${dict_candidate_rem[report.transportId]["protocol"]}<br>\n
      <strong>IP dst: </strong>${dict_candidate_rem[report.transportId]["ip"]}<br>\n`;

      statsOutput_json["port_dst"] = dict_candidate_rem[report.transportId]["port"];
      statsOutput_json["protocol_dst"] = dict_candidate_rem[report.transportId]["protocol"];
      statsOutput_json["ip_dst"] = dict_candidate_rem[report.transportId]["ip"];

      statsOutput += `<strong>Port src: </strong>${dict_candidate_loc[report.transportId]["port"]}<br>\n
      <strong>Protocol src: </strong>${dict_candidate_loc[report.transportId]["protocol"]}<br>\n
      <strong>IP src: </strong>${dict_candidate_loc[report.transportId]["ip"]}<br>\n`;

      statsOutput_json["port_src"] = dict_candidate_loc[report.transportId]["port"];
      statsOutput_json["protocol_src"] = dict_candidate_loc[report.transportId]["protocol"];
      statsOutput_json["ip_src"] = dict_candidate_loc[report.transportId]["ip"];
  }
  statsOutput_json["log"] = "statsOutput_json";
  document.querySelector(query).innerHTML = statsOutput;
  console.log(JSON.stringify(statsOutput_json));

});}


function getConnectionStats(pc, query) {
  pc.getStats(null).then(stats => {
    console.log(stats)
    let statsOutput = "";

    stats.forEach(report => {
      //console.log(report)
      if (report.type != "codec" && report.type != "certificate") {
          statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                         `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;

          // Now the statistics for this report; we intentially drop the ones we
          // sorted to the top above
          Object.keys(report).forEach(statName => {
          if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
              statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
          }
      });
  }});

    document.querySelector(query).innerHTML = statsOutput;
    console.log(statsOutput)
  });
};

// Video tag capture must be set up after video tracks are enumerated.
leftVideo.oncanplay = maybeCreateStream;
if (leftVideo.readyState >= 3) { // HAVE_FUTURE_DATA
  // Video is already ready to play, call maybeCreateStream in case oncanplay
  // fired before we registered the event handler.
  maybeCreateStream();
}

leftVideo.play();


rightVideo.onloadedmetadata = () => {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
};

rightVideo.onresize = () => {
  console.log(`Remote video size changed to ${rightVideo.videoWidth}x${rightVideo.videoHeight}`);
  // We'll use the first onresize callback as an indication that
  // video has started playing out.
  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
};

function preferCodec(codecs, mimeType) {
  let otherCodecs = [];
  let sortedCodecs = [];
  let count = codecs.length;

  console.log("[PARAMS] Forcing ", mimeType)
  codecs.forEach(codec => {
    if (codec.mimeType === mimeType) {
      sortedCodecs.push(codec);
    } else {
      otherCodecs.push(codec);
    }
  });

  return sortedCodecs.concat(otherCodecs);
}

function setCodecPrefs(peerConnection){
  const transceivers = peerConnection.getTransceivers();

  transceivers.forEach(transceiver => {
    const kind = transceiver.sender.track.kind;

    let sendCodecs = RTCRtpSender.getCapabilities(kind).codecs;
    let recvCodecs = RTCRtpReceiver.getCapabilities(kind).codecs;

    if (kind === "video" && "video_codec" in queryDict) {
      sendCodecs = preferCodec(sendCodecs, "video/" + queryDict["video_codec"]);
      recvCodecs = preferCodec(recvCodecs, "video/" + queryDict["video_codec"]);
      transceiver.setCodecPreferences([...sendCodecs, ...recvCodecs]);
    }

    if (kind === "audio" && "audio_codec" in queryDict) {
      sendCodecs = preferCodec(sendCodecs, "audio/" + queryDict["audio_codec"]);
      recvCodecs = preferCodec(recvCodecs, "audio/" + queryDict["audio_codec"]);
      transceiver.setCodecPreferences([...sendCodecs, ...recvCodecs]);
    }


  });

}

function call() {
  console.log('Starting call');
  startTime = window.performance.now();
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();
  console.log(videoTracks)
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  const servers = null;
  pc1 = new RTCPeerConnection(servers);
  function onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }
  console.log('Created local peer connection object pc1');
  pc1.onicecandidate = e => onIceCandidate(pc1, e);
  pc2 = new RTCPeerConnection(servers);
  console.log('Created remote peer connection object pc2');
  pc2.onicecandidate = e => onIceCandidate(pc2, e);
  pc1.oniceconnectionstatechange = e => onIceStateChange(pc1, e);
  pc2.oniceconnectionstatechange = e => onIceStateChange(pc2, e);
  pc2.ontrack = gotRemoteStream;

  stream.getTracks().forEach(track => pc1.addTrack(track, stream));
  console.log('Added local stream to pc1');

  setCodecPrefs(pc1);

  console.log('pc1 createOffer start');
  pc1.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
  return [pc1, pc2, videoTracks, audioTracks]
}




function onCreateOfferSuccess(desc) {
  console.log(`Offer from pc1 ${desc.sdp}`);
  console.log('pc1 setLocalDescription start');
  pc1.setLocalDescription(desc, () => onSetLocalSuccess(pc1), onSetSessionDescriptionError);
  console.log('pc2 setRemoteDescription start');
  pc2.setRemoteDescription(desc, () => onSetRemoteSuccess(pc2), onSetSessionDescriptionError);
  console.log('pc2 createAnswer start');
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc2.createAnswer(onCreateAnswerSuccess, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

function onSetLocalSuccess(pc) {
  console.log(`${getName(pc)} setLocalDescription complete`);
}

function onSetRemoteSuccess(pc) {
  console.log(`${getName(pc)} setRemoteDescription complete`);
}

function onSetSessionDescriptionError(error) {
  console.log(`Failed to set session description: ${error.toString()}`);
}

function gotRemoteStream(event) {
  if (rightVideo.srcObject !== event.streams[0]) {
    rightVideo.srcObject = event.streams[0];
    console.log('pc2 received remote stream', event);
  }
}

function setCodecParams(peerConnection){
  const transceivers = peerConnection.getTransceivers();

  transceivers.forEach(transceiver => {
    const kind = transceiver.sender.track.kind;

    if (kind === "video") {
      var sender = transceiver.sender;
      var params = sender.getParameters();
      console.log(params);
      if (!params.encodings) {
        params.encodings = [{}];
      }

      if ("video_max_bitrate" in queryDict)
        params.encodings[0].maxBitrate = queryDict["video_max_bitrate"];

      if ("video_max_framerate" in queryDict)
        params.encodings[0].maxFramerate = queryDict["video_max_framerate"];

      if ("video_scaledown" in queryDict)
        params.encodings[0].scaleResolutionDownBy = queryDict["video_scaledown"];

      sender.setParameters(params);

    }

    if (kind === "audio") {
      var sender = transceiver.sender;
      var params = sender.getParameters();
      console.log(params);
      if (!params.encodings) {
        params.encodings = [{}];
      }

      if ("audio_max_bitrate" in queryDict)
        params.encodings[0].maxBitrate = queryDict["audio_max_bitrate"];

      if ("audio_max_framerate" in queryDict)
        params.encodings[0].maxFramerate = queryDict["audio_max_framerate"];

      // NOT YET SUPPORTED
      //if ("audio_confort_noise" in queryDict)
      //  params.encodings[0].dtx = queryDict["audio_confort_noise"];
      //if ("audio_ptime" in queryDict)
      //  params.encodings[0].ptime = queryDict["audio_ptime"];

      sender.setParameters(params);

    }

  });

}

function onCreateAnswerSuccess(desc) {
  // console.log(`Answer from pc2: ${desc.sdp}`);

  console.log('pc2 setLocalDescription start');
  pc2.setLocalDescription(desc, () => onSetLocalSuccess(pc2), onSetSessionDescriptionError);
  console.log('pc1 setRemoteDescription start');
  pc1.setRemoteDescription(desc, () => onSetRemoteSuccess(pc1), onSetSessionDescriptionError);

  setCodecParams(pc1);

}

function onIceCandidate(pc, event) {
  getOtherPc(pc).addIceCandidate(event.candidate)
      .then(
          () => onAddIceCandidateSuccess(pc),
          err => onAddIceCandidateError(pc, err)
      );
  console.log(`${getName(pc)} ICE candidate:
${event.candidate ?
    event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess(pc) {
  console.log(`${getName(pc)} addIceCandidate success`);
}

function onAddIceCandidateError(pc, error) {
  console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
}

function onIceStateChange(pc, event) {
  if (pc) {
    console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }
}

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}
