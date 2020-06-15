README
======


### Prerequisites

Chrome: start it with: --allow-file-access-from-files

### Usage

Simply load the URL.


### Arguments:

Parameters of the tester are URL-encoded.
Supported are:

* `video=path`: path to the video to load.
* `video_mime=mime_type`: Set preference to `mime_type` video codec. Options are `video/VP8`, `video/VP9`, `video/H264`
* `audio_mime=mime_type`: Set preference to `mime_type` audio codec. Options are `audio/opus`, `audio/ISAC`, `audio/G722` and others.
* `video_max_bitrate=bitrate`: Set the maximum bitrate for video.
* `video_max_framerate=framerate`: Set the maximum framerate for video.
* `video_scaledown=scalefactor`: Set the resolutions scaling down. Must be a float higher than 1.0.
* `audio_max_bitrate=bitrate`: Set the maximum bitrate for audio.
* `audio_max_framerate=framerate`: Set the maximum framerate for audio.


