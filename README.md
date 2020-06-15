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
* `video_codec=codec`: Set preference to `codec` video codec. Options are `VP8`, `VP9` and `H264`
* `audio_codec=mime_type`: Set preference to `codec` audio codec. Options are `opus`, `ISAC`, `G722`, `PCMA` and `PCMU`.
* `video_max_bitrate=bitrate`: Set the maximum bitrate for video.
* `video_max_framerate=framerate`: Set the maximum framerate for video.
* `video_scaledown=scalefactor`: Set the resolutions scaling down. Must be a float higher than 1.0.
* `audio_max_bitrate=bitrate`: Set the maximum bitrate for audio.
* `audio_max_framerate=framerate`: Set the maximum framerate for audio.


