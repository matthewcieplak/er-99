
function playSampler(sampler:Sampler, accent:Boolean, closedState:Boolean) {
    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    if (sampler.sourceNode) sampler.sourceNode.stop();

    // sampler.output.gain.cancelAndHoldAtTime(audioContext.currentTime);
    sampler.output.gain.cancelScheduledValues(1.0);
    sampler.output.gain.setValueAtTime(sampler.volume * (accent ? globalParams.globalAccent : 1.0), audioContext.currentTime);
    sampler.output.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + (closedState ? sampler.decay_closed : sampler.decay) / 1000.0);


    sampler.sourceNode = audioContext.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    sampler.sourceNode.playbackRate.value = sampler.pitch;
    sampler.sourceNode.buffer  = sampler.buffer;


    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    sampler.sourceNode.connect(sampler.output);
    // start the source playing
    sampler.sourceNode.start();
    
}


function setupSampler(sampler){
    // Create an empty three-second stereo buffer at the sample rate of the AudioContext
    // sampler.buffer = audioContext.createBuffer(2, audioContext.sampleRate * sampler.duration / 1000, audioContext.sampleRate);

    // Load buffer asynchronously
    sampler.output = audioContext.createGain();
    sampler.output.value = 0;
    sampler.output.connect(compressor);

    var request = new XMLHttpRequest();
    request.open("GET", sampler.sourceUrl, true);
    request.responseType = "arraybuffer";

    // var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        audioContext.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    console.error('error decoding file data: ' + sampler.url);
                    return;
                }
                sampler.buffer = buffer;
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    }

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}
