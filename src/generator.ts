function playGenerator(generator:any, accent:Boolean) {
    // generator.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
    if (generator.delayConst) { //clap

        generator.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
        generator.noiseInput.gain.setValueAtTime(0.5, audioContext.currentTime);
        generator.noiseInput.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + (generator.tone_decay / 1000.0));

        // generator.delayInput.gain.cancelScheduledValues(1.0);

        var dc = generator.delayConst/1000.0;
        generator.delayOutput.gain.setValueAtTime(0.2, audioContext.currentTime); //0.001);
        generator.delayOutput.gain.setTargetAtTime(0.0001, audioContext.currentTime, dc);

        generator.delayOutput.gain.setValueAtTime(0.8, audioContext.currentTime+dc); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.00001, audioContext.currentTime+dc, dc);
        
        generator.delayOutput.gain.setValueAtTime(0.6, audioContext.currentTime+dc*2); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime+dc*2, dc);

        generator.delayOutput.gain.setValueAtTime(0.5, audioContext.currentTime+dc*3); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime+dc*3, dc + (generator.decay / 2500) );
    } else {
        generator.noiseInput.gain.setValueAtTime(1.0, audioContext.currentTime);
        generator.noiseInput.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + generator.decay / 1000.0);
    }

    generator.output.gain.setValueAtTime(generator.volume * (accent ? globalParams.globalAccent : 1.0), audioContext.currentTime);
    
}

function setupGenerator(generator){
    generator.output = audioContext.createGain();
    generator.output.gain.value = 0;
    generator.output.connect(compressor);

    generator.hiPass = new BiquadFilterNode(audioContext, { frequency : generator.hiPassFreq, type : "highpass"});
    generator.hiPass.connect(generator.output);

    generator.saturationNode = audioContext.createGain();
    generator.saturationNode.gain.value = generator.saturation || 1.0;
    

    if (generator.saturation) {
        generator.waveShaper = audioContext.createWaveShaper();
        generator.waveShaper.curve = makeDistortionCurve(20);
        generator.waveShaper.oversample = '2x';
        generator.saturationNode.connect(generator.waveShaper);
        generator.waveShaper.connect(generator.hiPass);
    } else {
        generator.saturationNode.connect(generator.hiPass);
    }

    generator.noiseInput = audioContext.createGain();
    generator.noiseInput.gain.value = 0;
    whiteNoise.connect(generator.noiseInput);
    
    if (generator.delayConst) {
        setupClap(generator);
    }


    for (let x = 0; x < generator.filterFreqs.length; x++) {
        generator.filterNodes[x] = new BiquadFilterNode(audioContext, { frequency : generator.filterFreqs[x], Q: generator.filterQs[x], type : generator.filterTypes[x]});
        if (generator.filterTopology == 'serial') { 
            if (x > 0) {
                generator.filterNodes[x-1].connect(generator.filterNodes[x]);
            } else {
                generator.noiseInput.connect(generator.filterNodes[0]);
                if (generator.delayOutput) generator.delayOutput.connect(generator.filterNodes[0]);
            }
            if (x == generator.filterFreqs.length - 1) {
                generator.filterNodes[x].connect(generator.saturationNode);
            }
        } else {
            generator.filterNodes[x].connect(generator.saturationNode);
            if (x == 0) {
                generator.noiseInput.connect(generator.filterNodes[x]);
                if (generator.delayOutput) generator.delayOutput.connect(generator.filterNodes[x]);
            }
        }
    }
}

function setupClap(generator){
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

    generator.toneFilter  = new BiquadFilterNode(audioContext, { frequency : generator.tone, Q: 2.0, type : 'bandpass'});
    // generator.toneFilter2 = new BiquadFilterNode(audioContext, { frequency : 1000, Q: 5.5, type : 'peaking'});
    whiteNoise.disconnect(generator.noiseInput);
    whiteNoise.connect(generator.toneFilter);
    // generator.toneFilter.connect (generator.toneFilter2);
    generator.toneFilter.connect(generator.noiseInput);

    whiteNoise.connect(generator.delayInput);
}