let audioContext;
let oscList = [];
let mainGainNode = null;
let running = false;
let volumeControl;
let volume = 0.5;
let clicking = false;
let clickedTarget;
let clickedInstrument;
let clickedParam;
let whiteNoise;
function playInstrument(instrument) {
    instrument.osc.frequency.cancelAndHoldAtTime(audioContext.currentTime);
    instrument.osc.frequency.setValueAtTime(instrument.frequency * instrument.env_amount, audioContext.currentTime);
    instrument.osc.frequency.exponentialRampToValueAtTime(instrument.frequency, audioContext.currentTime + instrument.env_duration / 1000.0);
    if (instrument.osc2) {
        instrument.osc2.frequency.cancelAndHoldAtTime(audioContext.currentTime);
        instrument.osc2.frequency.setValueAtTime((instrument.frequency + instrument.offset) * instrument.env_amount, audioContext.currentTime);
        instrument.osc2.frequency.exponentialRampToValueAtTime(instrument.frequency, audioContext.currentTime + instrument.env_duration / 1000.0);
    }
    instrument.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
    instrument.noiseInput.gain.setValueAtTime(instrument.tone, audioContext.currentTime);
    instrument.noiseInput.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + instrument.tone_decay / 1000.0);
    instrument.output.gain.setValueAtTime(instrument.volume, audioContext.currentTime);
    if (instrument.saturation) {
        instrument.saturationNode.gain.setValueAtTime(instrument.saturation, audioContext.currentTime);
    }
    instrument.input.gain.cancelAndHoldAtTime(audioContext.currentTime);
    instrument.input.gain.linearRampToValueAtTime(instrument.volume, audioContext.currentTime + 0.005);
    instrument.input.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + instrument.decay / 1000.0);
    // setTimeout(() => instrument.output.gain.value = 0, instrument.decay);
}
function playGenerator(generator) {
    // generator.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
    if (generator.delayConst) { //clap
        generator.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
        generator.noiseInput.gain.setValueAtTime(0.5, audioContext.currentTime);
        generator.noiseInput.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + (generator.tone_decay / 1000.0));
        // generator.delayInput.gain.cancelScheduledValues(1.0);
        var dc = generator.delayConst / 1000.0;
        generator.delayOutput.gain.setValueAtTime(0.2, audioContext.currentTime); //0.001);
        generator.delayOutput.gain.setTargetAtTime(0.0001, audioContext.currentTime, dc);
        generator.delayOutput.gain.setValueAtTime(0.8, audioContext.currentTime + dc); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.00001, audioContext.currentTime + dc, dc);
        generator.delayOutput.gain.setValueAtTime(0.6, audioContext.currentTime + dc * 2); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime + dc * 2, dc);
        generator.delayOutput.gain.setValueAtTime(0.5, audioContext.currentTime + dc * 3); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime + dc * 3, dc + (generator.decay / 2500));
    }
    else {
        generator.noiseInput.gain.setValueAtTime(1.0, audioContext.currentTime);
        generator.noiseInput.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + generator.decay / 1000.0);
    }
    generator.output.gain.setValueAtTime(generator.volume, audioContext.currentTime);
}
function playNote(instrument_id) {
    if (!running)
        setupAudio();
    var instrument = instruments_table[instrument_id];
    if (instruments.indexOf(instrument) > -1) {
        playInstrument(instrument);
    }
    else if (generators.indexOf(instrument) > -1) {
        playGenerator(instrument);
    }
    //console.log("Playing "+instrument.name);
    document.querySelector('#' + instrument_id + '_led').className = 'led active';
    clearTimeout(instrument.muteTimeout);
    instrument.muteTimeout = setTimeout(function () {
        instrument.output.gain.value = 0;
        document.querySelector('#' + instrument.id + '_led').className = 'led';
    }, 10 + Math.max(instrument.decay + (instrument.delayConst ? instrument.delayConst * 4 + instrument.decay : 0), (instrument.tone_decay ? instrument.tone_decay : 0)));
}
function makeDistortionCurve(amount = 20) {
    let n_samples = 256, curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        let x = i * 2 / n_samples - 1;
        curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}
function setupInstrument(instrument) {
    instrument.output = audioContext.createGain();
    instrument.output.gain.value = 0;
    if (instrument.filter_type) {
        instrument.filter = new BiquadFilterNode(audioContext, { type: instrument.filter_type, frequency: instrument.filter_freq });
        instrument.output.connect(instrument.filter);
        instrument.filter.connect(mainGainNode);
    }
    else {
        instrument.output.connect(mainGainNode);
    }
    instrument.input = audioContext.createGain();
    instrument.input.gain.value = 0;
    instrument.input.connect(instrument.output);
    instrument.noiseInput = audioContext.createGain();
    instrument.noiseInput.gain.value = 0;
    whiteNoise.connect(instrument.noiseInput);
    instrument.noiseInput.connect(instrument.output);
    instrument.osc = audioContext.createOscillator();
    instrument.osc.type = 'triangle';
    instrument.osc.frequency.value = instrument.frequency;
    if (instrument.offset > 0) {
        instrument.osc2 = audioContext.createOscillator();
        instrument.osc2.type = 'triangle',
            instrument.osc2.frequency.value = instrument.frequency + instrument.offset;
    }
    if (instrument.saturation) {
        instrument.waveShaper = audioContext.createWaveShaper();
        instrument.waveShaper.curve = makeDistortionCurve(2);
        instrument.waveShaper.oversample = '2x';
        instrument.saturationNode = audioContext.createGain();
        instrument.saturationNode.gain.value = instrument.saturation;
        instrument.osc.connect(instrument.saturationNode);
        if (instrument.osc2)
            instrument.osc2.connect(instrument.noiseInput);
        instrument.saturationNode.connect(instrument.waveShaper);
        instrument.waveShaper.connect(instrument.input);
    }
    else {
        instrument.osc.connect(instrument.input);
        if (instrument.osc2)
            instrument.osc2.connect(instrument.noiseInput);
    }
    instrument.osc.start();
    if (instrument.osc2)
        instrument.osc2.start();
}
function setupGenerator(generator) {
    generator.output = audioContext.createGain();
    generator.output.gain.value = 0;
    generator.output.connect(mainGainNode);
    generator.hiPass = new BiquadFilterNode(audioContext, { frequency: generator.hiPassFreq, type: "highpass" });
    generator.hiPass.connect(generator.output);
    generator.saturationNode = audioContext.createGain();
    generator.saturationNode.gain.value = generator.saturation || 1.0;
    if (generator.saturation) {
        generator.waveShaper = audioContext.createWaveShaper();
        generator.waveShaper.curve = makeDistortionCurve(20);
        generator.waveShaper.oversample = '2x';
        generator.saturationNode.connect(generator.waveShaper);
        generator.waveShaper.connect(generator.hiPass);
    }
    else {
        generator.saturationNode.connect(generator.hiPass);
    }
    generator.noiseInput = audioContext.createGain();
    generator.noiseInput.gain.value = 0;
    whiteNoise.connect(generator.noiseInput);
    if (generator.delayConst) {
        setupClap(generator);
    }
    for (let x = 0; x < generator.filterFreqs.length; x++) {
        generator.filterNodes[x] = new BiquadFilterNode(audioContext, { frequency: generator.filterFreqs[x], Q: generator.filterQs[x], type: generator.filterTypes[x] });
        if (generator.filterTopology == 'serial') {
            if (x > 0) {
                generator.filterNodes[x - 1].connect(generator.filterNodes[x]);
            }
            else {
                generator.noiseInput.connect(generator.filterNodes[0]);
                if (generator.delayOutput)
                    generator.delayOutput.connect(generator.filterNodes[0]);
            }
            if (x == generator.filterFreqs.length - 1) {
                generator.filterNodes[x].connect(generator.saturationNode);
            }
        }
        else {
            generator.filterNodes[x].connect(generator.saturationNode);
            generator.noiseInput.connect(generator.filterNodes[x]);
            if (generator.delayOutput)
                generator.delayOutput.connect(generator.filterNodes[x]);
        }
    }
}
function setupClap(generator) {
    generator.delayInput = audioContext.createGain();
    generator.delayOutput = audioContext.createGain();
    generator.modulatorLevel = audioContext.createGain();
    generator.modulatorLevel.gain.value = 0.4;
    generator.delayInput.gain.value = 1.0;
    generator.delayOutput.gain.value = 0;
    generator.delayInput.connect(generator.delayOutput);
    generator.modulator = audioContext.createOscillator();
    generator.modulator.frequency = 40;
    generator.modulator.type = 'sawtooth';
    generator.modulator.connect(generator.modulatorLevel);
    generator.modulatorLevel.connect(generator.delayInput.gain);
    generator.modulator.start();
    generator.toneFilter = new BiquadFilterNode(audioContext, { frequency: generator.tone, Q: 2.0, type: 'bandpass' });
    // generator.toneFilter2 = new BiquadFilterNode(audioContext, { frequency : 1000, Q: 5.5, type : 'peaking'});
    whiteNoise.disconnect(generator.noiseInput);
    whiteNoise.connect(generator.toneFilter);
    // generator.toneFilter.connect (generator.toneFilter2);
    generator.toneFilter.connect(generator.noiseInput);
    whiteNoise.connect(generator.delayInput);
}
function setupSampler(sampler) {
    return sampler;
}
function setupAudio() {
    running = true;
    audioContext = new (window.AudioContext); // || window.webkitAudioContext)();
    mainGainNode = audioContext.createGain();
    mainGainNode.connect(audioContext.destination);
    mainGainNode.gain.value = volume;
    whiteNoise = audioContext.createWhiteNoise();
    for (let instrument of instruments) {
        instruments_table[instrument.id] = instrument;
        setupInstrument(instrument);
        initSequence(instrument.id);
        sequencer[instrument.id][Math.floor(Math.random() * 16)] = 1;
    }
    for (let generator of generators) {
        instruments_table[generator.id] = generator;
        setupGenerator(generator);
        initSequence(generator.id);
        sequencer[generator.id][Math.floor(Math.random() * 16)] = 1;
    }
    sequencerSetup();
    // for (let sampler of samplers) {
    //     instruments_table[sampler.id] = sampler;
    //     setupSampler(sampler);
    //     initSequence(sampler.id);
    // }
}
;
window.onload = setup;
