README
======

This scripts automate the process of streaming a video provided by the user using WebRTC on a browser.
This is useful to make in-vitro experiments of RTC network traffic.
Using the URL-encoded parameters of the main URL, you can vary the employed codec, the bitrate, the framerate and other parameters. If you change the input video, you can vary the streaming resolution.

### Prerequisites

You must use Chrome, as other browsers may not support some of the WebRTC features used to control codecs and other parameters.

Note: the webpage works even if open as a file (without a web server).
In this case, you must start Chrome with: `--allow-file-access-from-files` command line argument.

### Usage

Simply load the URL.


### Arguments:

Parameters of the tester are URL-encoded.
Supported are:

* `video=path`: path to the video to load.
* `video_codec=codec`: Set preference to `codec` video codec. Options are `VP8`, `VP9` and `H264`
* `audio_codec=codec`: Set preference to `codec` audio codec. Options are `opus`, `ISAC`, `G722`, `PCMA` and `PCMU`.
* `video_max_bitrate=bitrate`: Set the maximum bitrate for video.
* `video_max_framerate=framerate`: Set the maximum framerate for video.
* `video_scaledown=scalefactor`: Set the resolutions scaling down. Must be a float higher than 1.0.
* `audio_max_bitrate=bitrate`: Set the maximum bitrate for audio.
* `audio_max_framerate=framerate`: Set the maximum framerate for audio.

### Automated Docker tests

You can use the `make_test.sh` script to make automated tests using the BrowserTime image.
You need Docker and Python3 to run it.

The syntax of the command is:
```
./make_test.sh -u URL_PARAMETERS -p PCAP_FILE -d DURATION_MS
```

Where:
* `URL_PARAMETERS`: are the parameters of the webpage as above, e.g., `video_codec=H264\&video_max_bitrate=500000`.  Note: you need to escape the `&` character with `\&` otherwise it is interpreted as a detach command.
* `PCAP_FILE`: the output PCAP file. Must be relative path. Default is `capture.pcap`.
* `DURATION_MS`: Duration of the test in milliseconds. Default is `10000`.

Note: if you want to provide a custom video file, it must be reachable from the current directory using a relative path, as the script starts a simple HTTP server in your current path.

Example: to run a test with H264 and G722, run:
```
./make_test.sh -u video_codec=H264\&audio_codec=G722 -p capture_h264_g722.pcap
```

