#!/bin/bash

# Default values
URL_PATH=""
DURATION=10000
PCAP="capture.pcap"
LOG='log.txt'


# Parse args
while getopts  "u:d:p:l:" flag
do
    case $flag in
        u) URL_PATH=$OPTARG;;
        d) DURATION=$OPTARG;;
        p) PCAP=$OPTARG;;
        l) LOG=$OPTARG;;
    esac
done

# Check containers pulled
docker pull sitespeedio/browsertime
docker pull nicolaka/netshoot

# Start the HTTP server
echo "Starting HTTP server"
python3 -m http.server >/dev/null 2>&1 &
http_pid=$!
trap "kill ${http_pid}" INT

# Run the docker
echo "Starting Browsertime"
name=browsertime_$RANDOM

# Distinguish between MAC and Linux for problems in localhost contacting
if [[ "$OSTYPE" == "darwin"* ]]; then
    docker run -d --name $name \
                sitespeedio/browsertime \
                -n 1 --pageCompleteCheckStartWait $DURATION \
                http://host.docker.internal:8000/index.html?$URL_PATH
else
    docker run  -d --name $name --network=host \
                sitespeedio/browsertime \
                -n 1 --pageCompleteCheckStartWait $DURATION \
                http://127.0.0.1:8000/index.html?$URL_PATH
fi

# Start capture
echo "Starting Capturing"
touch $PCAP
docker run --rm -d --net container:$name -v $(pwd)/$PCAP:/opt/capture.pcap:rw --name tcpdump_$name \
        nicolaka/netshoot tcpdump -i any -w /opt/capture.pcap
trap "docker stop tcpdump_${name}" INT


# Wait the container to stop
docker wait $name
docker logs $name > $name.log
docker rm $(docker ps -a -f status=exited -q)
# Kill it
echo "Stopping HTTP server and capture"
docker stop tcpdump_$name
kill $http_pid
