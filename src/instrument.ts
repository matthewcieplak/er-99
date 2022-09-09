function playInstrument(instrument:Instrument, accent:Boolean){
    // instrument.osc.frequency.cancelAndHoldAtTime(audioContext.currentTime);
    instrument.osc.frequency.cancelScheduledValues(1.0);
    instrument.osc.frequency.setValueAtTime(instrument.frequency * instrument.env_amount, audioContext.currentTime);
    instrument.osc.frequency.exponentialRampToValueAtTime(instrument.frequency, audioContext.currentTime + instrument.env_duration / 1000.0)

    if (instrument.osc2) {
        
        // instrument.osc2.frequency.cancelAndHoldAtTime(audioContext.currentTime);
        instrument.osc.frequency.cancelScheduledValues(1.0);
        instrument.osc2.frequency.setValueAtTime((instrument.frequency + instrument.offset) * instrument.env_amount, audioContext.currentTime);
        instrument.osc2.frequency.exponentialRampToValueAtTime(instrument.frequency, audioContext.currentTime + instrument.env_duration / 1000.0)        
    }
    
    // instrument.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
    instrument.noiseInput.gain.cancelScheduledValues(1.0);
    instrument.noiseInput.gain.setValueAtTime(instrument.tone, audioContext.currentTime);
    instrument.noiseInput.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + instrument.tone_decay / 1000.0);
    
    instrument.output.gain.setValueAtTime(instrument.volume * (accent ? globalParams.globalAccent : 1.0), audioContext.currentTime);
    if (instrument.saturation) {
        instrument.saturationNode.gain.setValueAtTime(instrument.saturation, audioContext.currentTime);
    }

    instrument.input.gain.cancelScheduledValues(1.0);
    // instrument.input.gain.cancelAndHoldAtTime(audioContext.currentTime);
    instrument.input.gain.linearRampToValueAtTime(instrument.volume, audioContext.currentTime+0.005);
    instrument.input.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + instrument.decay / 1000.0);
    
    // setTimeout(() => instrument.output.gain.value = 0, instrument.decay);
}


function setupInstrument(instrument){        
    instrument.output = audioContext.createGain();
    instrument.output.gain.value = 0;

    if (instrument.filter_type) {
        instrument.filter = new BiquadFilterNode(audioContext,   { type: instrument.filter_type, frequency: instrument.filter_freq });
        instrument.output.connect(instrument.filter);
        instrument.filter.connect(compressor);
    } else {
        instrument.output.connect(compressor);
        
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
        instrument.osc2.frequency.value = instrument.frequency + instrument.offset
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
    } else {
        instrument.osc.connect(instrument.input);
        if (instrument.osc2) instrument.osc2.connect(instrument.noiseInput);
    }
    instrument.osc.start();
    if (instrument.osc2) instrument.osc2.start();
}

