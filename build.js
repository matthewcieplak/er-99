function playGenerator(generator, accent) {
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
        if (generator.bufferSource)
            generator.bufferSource.stop();
        generator.bufferSource = audioContext.createBufferSource();
        generator.bufferSource.buffer = generator.buffer;
        generator.bufferSource.connect(generator.noiseInput);
        generator.bufferSource.start();
        generator.noiseInput.gain.setValueAtTime(1.0, audioContext.currentTime);
        generator.noiseInput.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + generator.decay / 1000.0);
    }
    generator.output.gain.setValueAtTime(generator.volume * (accent ? globalParams.globalAccent : 1.0), audioContext.currentTime);
}
function setupGenerator(generator) {
    generator.output = audioContext.createGain();
    generator.output.gain.value = 0;
    generator.output.connect(compressor);
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
    // whiteNoise.connect(generator.noiseInput);
    if (generator.delayConst) {
        setupClap(generator);
    }
    else {
        setupRim(generator);
    }
    for (let x = 0; x < generator.filterFreqs.length; x++) {
        generator.filterNodes[x] = new BiquadFilterNode(audioContext, { frequency: generator.filterFreqs[x], Q: generator.filterQs[x], type: generator.filterTypes[x] });
        if (generator.filterTopology == 'serial') {
            if (x > 0) {
                generator.filterNodes[x - 1].connect(generator.filterNodes[x]);
            }
            else {
                // generator.noiseInput.connect(generator.filterNodes[0]);
                if (generator.delayOutput)
                    generator.delayOutput.connect(generator.filterNodes[0]);
            }
            if (x == generator.filterFreqs.length - 1) {
                generator.filterNodes[x].connect(generator.saturationNode);
            }
        }
        else {
            generator.filterNodes[x].connect(generator.saturationNode);
            if (x == 0) {
                generator.noiseInput.connect(generator.filterNodes[x]);
                if (generator.delayOutput)
                    generator.delayOutput.connect(generator.filterNodes[x]);
            }
        }
        if (generator.filterGains) {
            generator.filterNodes[x].gain.value = generator.filterGains[x];
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
    // whiteNoise.disconnect(generator.noiseInput);
    whiteNoise.connect(generator.toneFilter);
    // generator.toneFilter.connect (generator.toneFilter2);
    generator.toneFilter.connect(generator.noiseInput);
    generator.noiseInput.connect(generator.saturationNode);
    whiteNoise.connect(generator.delayInput);
}
function setupRim(generator) {
    generator.buffer = audioContext.createBuffer(1, 256, audioContext.sampleRate);
    // This gives us the actual ArrayBuffer that contains the data
    const nowBuffering = generator.buffer.getChannelData(0);
    for (let i = 0; i < 200; i++) {
        // Math.random() is in [0; 1.0]
        // audio needs to be in [-1.0; 1.0]
        // nowBuffering[i] = Math.random() * 2 - 1;
        nowBuffering[i] = rimNoise[i];
    }
}
//200 32-bit floats of white noise that sounds pretty good when bandpass filtered. 
//it's important that it repeats and isn't re-generated each hit
//analog filters would have better ringing and could use a simple impulse input but the digital ones need more excitement to induce resonance
const rimNoise = [
    -0.0938141867518425,
    0.7102846503257751,
    -0.685766339302063,
    0.4907262921333313,
    -0.3911896049976349,
    -0.3124760091304779,
    0.6563512682914734,
    0.928503155708313,
    -0.6719098091125488,
    0.946106493473053,
    0.702319860458374,
    0.3403726816177368,
    -0.7190880179405212,
    0.2917483150959015,
    -0.7644904851913452,
    0.9628100991249084,
    0.4206474721431732,
    -0.44558143615722656,
    -0.9672186374664307,
    0.6598025560379028,
    0.47643211483955383,
    0.5561770796775818,
    0.3712882697582245,
    -0.36183351278305054,
    -0.7939896583557129,
    0.39301514625549316,
    -0.9791231751441956,
    -0.7119218111038208,
    0.17154400050640106,
    0.49292445182800293,
    -0.044391319155693054,
    -0.5022702217102051,
    0.42775845527648926,
    -0.7908858060836792,
    0.15842849016189575,
    -0.3464527428150177,
    -0.06815345585346222,
    -0.6528737545013428,
    -0.8457662463188171,
    0.2706998884677887,
    -0.4698350429534912,
    0.6159835457801819,
    0.579700767993927,
    -0.08275951445102692,
    -0.5312353372573853,
    0.6295946836471558,
    -0.7151079773902893,
    -0.4602707028388977,
    0.3251723647117615,
    0.5111592411994934,
    0.8249071836471558,
    0.33816373348236084,
    0.16297145187854767,
    0.20368638634681702,
    -0.6493934988975525,
    -0.7581902146339417,
    0.7735790610313416,
    0.47196561098098755,
    -0.10748262703418732,
    0.7939162850379944,
    0.1509392261505127,
    0.5842358469963074,
    -0.05638119578361511,
    0.8583419919013977,
    0.6294043660163879,
    0.22440209984779358,
    -0.8036736845970154,
    0.4246376156806946,
    0.6533545255661011,
    -0.6216084361076355,
    0.1065131276845932,
    0.7721655964851379,
    -0.8856338262557983,
    -0.9257946014404297,
    -0.22200027108192444,
    0.000844220572616905,
    0.099571093916893,
    0.6854760050773621,
    -0.7621583342552185,
    -0.38532841205596924,
    -0.6560276746749878,
    -0.11282013356685638,
    0.3745887279510498,
    -0.8450918793678284,
    -0.6507189869880676,
    0.7628042101860046,
    -0.28953537344932556,
    -0.3797481060028076,
    0.8847131729125977,
    0.7058473825454712,
    0.47311416268348694,
    -0.10166404396295547,
    0.6752808094024658,
    0.8873506188392639,
    0.6834714412689209,
    0.8259801268577576,
    0.7404413223266602,
    0.6065666675567627,
    0.48070207238197327,
    0.3736712634563446,
    -0.253595769405365,
    -0.9127187728881836,
    0.8663365244865417,
    0.882439374923706,
    -0.09889926016330719,
    0.9645036458969116,
    -0.8030155897140503,
    0.7513594627380371,
    -0.19000419974327087,
    0.6537664532661438,
    0.9187515377998352,
    0.6098461151123047,
    -0.800383985042572,
    0.5615882873535156,
    -0.07559498399496078,
    0.14509990811347961,
    0.6961334347724915,
    -0.32785388827323914,
    0.36420372128486633,
    -0.057758450508117676,
    0.48798951506614685,
    -0.031131094321608543,
    -0.08771521598100662,
    -0.8598763942718506,
    0.4171707332134247,
    0.1086604967713356,
    0.03149956092238426,
    0.641241729259491,
    -0.6776508092880249,
    0.8478045463562012,
    0.515723705291748,
    -0.3923241198062897,
    -0.9096614122390747,
    0.07917828857898712,
    -0.2778809368610382,
    -0.8534830212593079,
    -0.0927843526005745,
    -0.1977241039276123,
    0.16568148136138916,
    -0.9512038230895996,
    0.03670766204595566,
    0.9108136892318726,
    0.1477319896221161,
    0.30539363622665405,
    -0.7050888538360596,
    0.9099668264389038,
    -0.49326977133750916,
    0.6052023768424988,
    0.004538396373391151,
    -0.7342783212661743,
    0.047306571155786514,
    0.3396494388580322,
    -0.24110381305217743,
    -0.6909115314483643,
    -0.15850205719470978,
    0.6355003118515015,
    0.1780438870191574,
    0.7516891360282898,
    -0.7339579463005066,
    0.7635491490364075,
    -0.08038980513811111,
    0.7032962441444397,
    -0.270632266998291,
    -0.47390109300613403,
    0.6037904620170593,
    0.07386089116334915,
    0.19045040011405945,
    0.24417270720005035,
    -0.6874961256980896,
    -0.1794464886188507,
    0.5320767164230347,
    -0.0663330927491188,
    -0.06958585232496262,
    -0.9505257606506348,
    0.8732248544692993,
    -0.9755458831787109,
    -0.9906177520751953,
    -0.7038559317588806,
    -0.8764607310295105,
    -0.5446853637695312,
    -0.25804081559181213,
    -0.846868634223938,
    -0.19499368965625763,
    -0.593953549861908,
    0.9608613848686218,
    -0.20571835339069366,
    -0.7908936738967896,
    -0.6336819529533386,
    -0.3839634656906128,
    0.9093872308731079,
    0.8396366238594055,
    -0.7636103630065918,
    0.6916990876197815,
    0.315847247838974,
    0.8680893182754517,
    0.12821145355701447,
    0.30398818850517273,
    0.9621102213859558,
    0.9373974204063416,
    -0.71066778898239
];
let audioContext;
let oscList = [];
let mainGainNode = null;
let running = false;
let volumeControl;
let whiteNoise;
let compressor;
let makeup;
let globalParams = {
    globalAccent: 2.0,
    volume: 0.5,
    tempo: 120,
    swing: 0
};
function playNote(instrument_id, accent) {
    if (!running)
        setupAudio();
    document.querySelector('#' + instrument_id + '_led').className = 'led active';
    var played_id = instrument_id;
    var closedState = false;
    if (instrument_id == 'chh') {
        instrument_id = 'ohh';
        closedState = true;
    }
    var instrument = instruments_table[instrument_id];
    if (instruments.indexOf(instrument) > -1) {
        playInstrument(instrument, accent);
    }
    else if (generators.indexOf(instrument) > -1) {
        playGenerator(instrument, accent);
    }
    else if (samplers.indexOf(instrument) > -1) {
        playSampler(instrument, accent, closedState);
    }
    var timeout_length = Math.max(instrument.decay + (instrument.delayConst ? instrument.delayConst * 4 + instrument.decay : 0), (instrument.tone_decay ? instrument.tone_decay : 0));
    if (instrument_id == 'ohh') {
        document.querySelector('#' + (played_id == 'chh' ? 'ohh' : 'chh') + '_led').className = 'led';
        if (played_id == 'chh') {
            timeout_length = instrument.decay_closed;
        }
        else {
            timeout_length = instrument.decay / 4;
        }
    }
    clearTimeout(instrument.muteTimeout);
    instrument.muteTimeout = setTimeout(function () {
        instrument.output.gain.value = 0;
        document.querySelector('#' + played_id + '_led').className = 'led';
    }, timeout_length);
}
function makeDistortionCurve(amount = 20) {
    let n_samples = 256, curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        let x = i * 2 / n_samples - 1;
        curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}
function setupAudio() {
    if (running)
        return;
    running = true;
    audioContext = new (window.AudioContext); // || window.webkitAudioContext)();
    mainGainNode = audioContext.createGain();
    mainGainNode.connect(audioContext.destination);
    mainGainNode.gain.value = globalParams.volume;
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(0, audioContext.currentTime);
    compressor.knee.setValueAtTime(10, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);
    makeup = audioContext.createGain();
    makeup.gain.value = 1.0;
    compressor.connect(makeup);
    makeup.connect(mainGainNode);
    whiteNoise = audioContext.createWhiteNoise();
    for (let instrument of instruments) {
        instruments_table[instrument.id] = instrument;
        setupInstrument(instrument);
        initSequence(instrument.id);
        // sequencer[instrument.id][Math.floor(Math.random() * 16)] = 1;        
    }
    for (let generator of generators) {
        instruments_table[generator.id] = generator;
        setupGenerator(generator);
        initSequence(generator.id);
        sequencer[generator.id][Math.floor(Math.random() * 16)] = 1;
    }
    for (let sampler of samplers) {
        instruments_table[sampler.id] = sampler;
        initSequence(sampler.id);
        if (sampler.id == 'ohh')
            initSequence('chh');
        // sequencer[sampler.id][Math.floor(Math.random() * 16)] = 1; //randomize (todo delete and add presets)
        setupSampler(sampler);
    }
    document.removeEventListener("keydown", setupAudio);
    document.removeEventListener("mousedown", setupAudio);
}
;
window.onload = setup;
function playInstrument(instrument, accent) {
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
    instrument.output.gain.setValueAtTime(instrument.volume * (accent ? globalParams.globalAccent : 1.0), audioContext.currentTime);
    if (instrument.saturation) {
        instrument.saturationNode.gain.setValueAtTime(instrument.saturation, audioContext.currentTime);
    }
    instrument.input.gain.cancelAndHoldAtTime(audioContext.currentTime);
    instrument.input.gain.linearRampToValueAtTime(instrument.volume, audioContext.currentTime + 0.005);
    instrument.input.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + instrument.decay / 1000.0);
    // setTimeout(() => instrument.output.gain.value = 0, instrument.decay);
}
function setupInstrument(instrument) {
    instrument.output = audioContext.createGain();
    instrument.output.gain.value = 0;
    if (instrument.filter_type) {
        instrument.filter = new BiquadFilterNode(audioContext, { type: instrument.filter_type, frequency: instrument.filter_freq });
        instrument.output.connect(instrument.filter);
        instrument.filter.connect(compressor);
    }
    else {
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
let BassDrum = {
    id: 'bd',
    name: 'Bass Drum',
    frequency: 80,
    decay: 300,
    tone: 0.5,
    tone_decay: 20,
    volume: 0.5,
    env_amount: 2.5,
    env_duration: 50,
    filter_type: 'lowpass',
    filter_freq: 3000,
    saturation: 0.5,
};
let SnareDrum = {
    id: 'sd',
    name: 'Snare Drum',
    frequency: 220,
    decay: 100,
    tone: 0.25,
    tone_decay: 250,
    volume: 0.5,
    env_amount: 4.0,
    env_duration: 10,
    filter_type: 'notch',
    filter_freq: 1000
};
let LowTom = {
    id: 'lt',
    name: 'Low Tom',
    frequency: 100,
    offset: 100,
    decay: 200,
    tone: 0.05,
    tone_decay: 100,
    volume: 0.5,
    env_amount: 2.0,
    env_duration: 100
};
let MedTom = {
    id: 'mt',
    name: 'Med Tom',
    frequency: 200,
    offset: -50,
    decay: 200,
    tone: 0.05,
    tone_decay: 100,
    volume: 0.5,
    env_amount: 2.0,
    env_duration: 100
};
let HiTom = {
    id: 'ht',
    name: 'Hi Tom',
    frequency: 300,
    offset: -80,
    decay: 200,
    tone: 0.05,
    tone_decay: 100,
    volume: 0.5,
    env_amount: 2.0,
    env_duration: 100
};
let RimShot = {
    id: 'rs',
    name: 'Rim Shot',
    decay: 30,
    filterTypes: ['bandpass', 'bandpass', 'bandpass'],
    filterFreqs: [220, 500, 950],
    filterQs: [10.5, 10.5, 10.5],
    filterGains: [20, 20, 20],
    filterTopology: 'parallel',
    highPassFreq: 100,
    filterNodes: [],
    volume: 1.0,
    saturation: 2.0
};
let HandClap = {
    id: 'hc',
    name: 'Hand Clap',
    decay: 80,
    delayConst: 10,
    filterTypes: ['lowpass', 'highpass', 'peaking'],
    filterFreqs: [5000, 900, 1200],
    filterQs: [0.5, 1.2, 9.5],
    filterTopology: 'serial',
    highPassFreq: 80,
    filterNodes: [],
    volume: 0.2,
    tune: 1000,
    tone: 2200,
    tone_decay: 250
};
let HiHat = {
    id: 'ohh',
    name: 'Hi Hat',
    sourceUrl: 'samples/hh.wav',
    decay: 2000,
    decay_closed: 300,
    highPassFreq: 100,
    lowPassFreq: 20000,
    volume: 0.5,
    pitch: 1.0,
};
let Ride = {
    id: 'rc',
    name: 'Ride Cymbal',
    sourceUrl: 'samples/ride.wav',
    decay: 2000,
    highPassFreq: 100,
    lowPassFreq: 20000,
    volume: 0.2,
    pitch: 1.0,
};
let Crash = {
    id: 'cr',
    name: 'Crash',
    sourceUrl: 'samples/crash.wav',
    decay: 2000,
    highPassFreq: 100,
    lowPassFreq: 20000,
    volume: 0.3,
    pitch: 1.0,
};
let instruments = [BassDrum, SnareDrum, LowTom, MedTom, HiTom];
let generators = [RimShot, HandClap];
let samplers = [HiHat, Ride, Crash];
let instruments_table = {};
let midi = null; // global MIDIAccess object
function onMIDISuccess(midiAccess) {
    console.log("MIDI ready!");
    midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
}
function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
}
function onMIDIMessage(event) {
    let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
    for (const character of event.data) {
        str += `0x${character.toString(16)} `;
    }
    console.log(str);
}
function onMidiInputChange(event) {
    console.log('midi input ' + event.currentTarget.value);
}
function startLoggingMIDIInput(midiAccess, indexOfPort) {
    var input_list = document.getElementById('midi_inputs');
    input_list.childNodes.forEach((node) => node.remove());
    input_list.addEventListener('change', onMidiInputChange);
    midi.inputs.forEach((entry) => {
        let node = document.createElement('OPTION');
        node.value = entry.name;
        node.innerText = entry.name;
        input_list.appendChild(node);
        // entry.onmidimessage = onMIDIMessage;
    });
}
function midiSetup() {
    var midi_button = document.getElementById('midi_button');
    midi_button.addEventListener('click', (event) => {
        document.getElementById('midi_led').className = 'led active';
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    });
}
function savePreset() {
    let preset = {};
    let knobs = document.getElementsByClassName('knob');
    for (let i = 0; i < knobs.length; i++) {
        if (knobs[i].getAttribute('name') != null) {
            preset[knobs[i].getAttribute('name')] = parseFloat(knobs[i].getAttribute('value')).toFixed(2);
        }
    }
    let presetText = document.getElementById('preset_text');
    presetText.value = JSON.stringify(preset);
    createPreset(preset, 0, 'user');
}
function loadPreset(preset) {
    // let presetText = document.getElementById('preset_text') as HTMLTextAreaElement;
    // let preset = JSON.parse(presetText.value);
    let knobs = document.getElementsByClassName('knob');
    for (let i = 0; i < knobs.length; i++) {
        for (let ii in preset) {
            if (knobs[i].getAttribute('name') == ii) {
                knobs[i].setAttribute('value', preset[ii]);
                break;
            }
        }
    }
    initializeKnobPositions();
}
function loadUserPreset(preset_id) {
    // var preset = user_presets[id];
    // todo get from local storage
}
;
function loadFactoryPreset(preset_id) {
    // var preset = presets[i];
    loadPreset(presets[preset_id]);
}
;
function clickPreset(event) {
    if (event.currentTarget.className == 'preset_delete') {
        // deletePreset(event.currentTarget)
    }
    else {
        let preset_id = parseInt(event.target.getAttribute('data-preset-id'));
        if (event.target.getAttribute('data-preset-type') == "user") {
            loadUserPreset(preset_id);
        }
        else {
            loadFactoryPreset(preset_id);
        }
    }
}
var presets = [];
var presetList;
function createPreset(preset, id, typename) {
    var presetLi = document.createElement("LI");
    presetLi.setAttribute('data-preset-type', typename);
    presetLi.setAttribute('data-preset-id', id.toString());
    presetLi.innerHTML = preset.name + ' <span class="preset_delete">Delete</span>';
    presetList.appendChild(presetLi);
}
function initializePresets() {
    var request = new XMLHttpRequest();
    request.open("GET", "presets.json", true);
    request.responseType = "json";
    presetList = document.getElementById('preset_list');
    request.onload = function () {
        presets = request.response;
        for (var i = 0; i < presets.length; i++) {
            createPreset(presets[i], i, 'factory');
        }
    };
    request.send();
    presetList.addEventListener('click', clickPreset);
}
function playSampler(sampler, accent, closedState) {
    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    if (sampler.sourceNode)
        sampler.sourceNode.stop();
    sampler.output.gain.cancelAndHoldAtTime(audioContext.currentTime);
    sampler.output.gain.setValueAtTime(sampler.volume * (accent ? globalParams.globalAccent : 1.0), audioContext.currentTime);
    sampler.output.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + (closedState ? sampler.decay_closed : sampler.decay) / 1000.0);
    sampler.sourceNode = audioContext.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    sampler.sourceNode.playbackRate.value = sampler.pitch;
    sampler.sourceNode.buffer = sampler.buffer;
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    sampler.sourceNode.connect(sampler.output);
    // start the source playing
    sampler.sourceNode.start();
}
function setupSampler(sampler) {
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
    request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        audioContext.decodeAudioData(request.response, function (buffer) {
            if (!buffer) {
                console.error('error decoding file data: ' + sampler.url);
                return;
            }
            sampler.buffer = buffer;
        }, function (error) {
            console.error('decodeAudioData error', error);
        });
    };
    request.onerror = function () {
        alert('BufferLoader: XHR error');
    };
    request.send();
}
//SEQUENCER STUFF
let sequencer = {};
let playing = false;
let tempo = 120;
let tempoInMs = 60 * 1000 / (4 * tempo);
let current_step = 10;
let sequencerTimeout;
let active_instrument_id = 'bd';
let start_button;
let clear_button;
let jumble_button;
const SEQUENCE_LENGTH = 16;
function initSequence(id) {
    sequencer[id] = preset_sequences[0][id]; //[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}
function toggleSequence() {
    if (playing) {
        clearTimeout(sequencerTimeout);
        playing = false;
        start_button.className = 'big_button';
        updateSequenceDisplay();
    }
    else {
        playing = true;
        playNextStep();
        start_button.className = 'big_button active';
    }
    screenDiv.innerText = playing ? 'STA' : 'STP';
}
function selectInstrument() {
}
function clearTrack() {
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
        sequencer[active_instrument_id][i] = 0;
    }
    screenDiv.innerText = 'CLR';
    updateSequenceDisplay();
}
function jumbleTrack() {
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
        var rand = Math.random();
        sequencer[active_instrument_id][i] = rand > 0.6;
        if (rand > 0.85) {
            sequencer[active_instrument_id][i] = 2;
        }
    }
    screenDiv.innerText = 'JMB';
    updateSequenceDisplay();
}
function playNextStep() {
    current_step++;
    if (current_step > SEQUENCE_LENGTH - 1)
        current_step = 0;
    for (let inst_key in sequencer) {
        if (sequencer[inst_key][current_step]) {
            playNote(inst_key, sequencer[inst_key][current_step] == 2 ? true : false);
        }
    }
    var nextStepInMs = tempoInMs;
    if (globalParams.swing > 0) {
        var swing_offset = tempoInMs * (1 - 16.0 / (16.0 + globalParams.swing));
        if (current_step % 2 == 1) {
            nextStepInMs = tempoInMs - swing_offset;
        }
        else {
            nextStepInMs = tempoInMs + swing_offset;
        }
    }
    if (playing) sequencerTimeout = setTimeout(playNextStep, nextStepInMs);
    updateSequenceDisplay();
}
function updateSequenceDisplay() {
    var step_value = 0;
    document.querySelectorAll('.sequencer_button').forEach(function (button, idx) {
        step_value = sequencer[active_instrument_id][idx];
        if ((idx == current_step && playing)) {
            button.className = 'sequencer_button' + (step_value == 0 ? ' playing' : '');
        }
        else if (sequencer[active_instrument_id][idx] > 0) {
            button.className = 'sequencer_button ' + (step_value == 1 ? 'active' : 'playing');
        }
        else {
            button.className = 'sequencer_button';
        }
    });
}
function onSequencerButtonClick(event) {
    var target = event.target;
    if (event.target.className == 'squareled') {
        target = event.target.parent;
    }
    if (target.getAttribute('data-step')) {
        var step = parseInt(event.target.getAttribute('data-step')) - 1;
        sequencer[active_instrument_id][step] += 1;
        if (sequencer[active_instrument_id][step] > 2)
            sequencer[active_instrument_id][step] = 0;
        updateSequenceDisplay();
        // console.log(step);
    }
}
function sequencerSetup() {
    document.querySelector('#sequencer').addEventListener('click', onSequencerButtonClick);
    start_button = document.querySelector('#start_button');
    start_button.addEventListener('click', toggleSequence);
    clear_button = document.querySelector('#clear_button');
    clear_button.addEventListener('click', clearTrack);
    jumble_button = document.querySelector('#jumble_button');
    jumble_button.addEventListener('click', jumbleTrack);
}
var preset_sequences = [
    {
        'bd': [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
        'sd': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        'lt': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'mt': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'ht': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'rs': [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 2],
        'hc': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        'chh': [0, 0, 2, 1, 0, 0, 1, 0, 0, 0, 2, 1, 0, 0, 0, 0],
        'ohh': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        'rc': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'cr': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
];
var screenDiv;
let clicking = false;
let clickedTarget;
let clickedInstrument;
let clickedParam;
let clickedMaster = false;
var keymap = {
    49: 'bd',
    50: 'sd',
    51: 'lt',
    52: 'mt',
    53: 'ht',
    54: 'rs',
    55: 'hc',
    56: 'chh',
    57: 'ohh',
    48: 'rc',
    192: 'cr',
    96: 'bd',
    97: 'sd',
    100: 'lt',
    101: 'mt',
    102: 'ht',
    99: 'rs',
    98: 'hc',
    104: 'chh',
    105: 'ohh',
    103: 'rc',
    110: 'cr' // ` numpad .
};
function notePlayed(instrument_id) {
    playNote(instrument_id, false);
    active_instrument_id = instrument_id;
    screenDiv.innerText = instrument_id.padStart(3, ' ');
    selectInstrument();
    updateSequenceDisplay();
}
function notePressed(event) {
    var instrument_id = event.currentTarget.getAttribute('data-id');
    notePlayed(instrument_id);
}
function keyPressed(event) {
    if (!running)
        setupAudio();
    if (keymap[event.which]) {
        notePlayed(keymap[event.which]);
    }
    else if (event.which == 32) {
        toggleSequence();
        event.stopPropagation();
    }
    return false;
}
function clickKnob(event) {
    if (!running)
        setupAudio();
    clickedInstrument = instruments_table[event.currentTarget.getAttribute('data-instrument')];
    clickedMaster = event.target.getAttribute('data-control') == 'master';
    if (clickedInstrument || clickedMaster) {
        clickedParam = event.currentTarget.getAttribute('data-param');
    }
    clickedTarget = event.currentTarget;
    clicking = true;
}
function onMouseUp(event) {
    clicking = false;
    clickedTarget = null;
}
function onMouseMove(event) {
    if (clicking && clickedTarget) {
        var increment_value = event.movementY - event.movementX;
        var newValue = moveControl(increment_value, clickedTarget);
        if (clickedInstrument) {
            setInstrumentParameter(clickedInstrument, clickedParam, newValue);
            //clickedInstrument[clickedParam] = newValue * scalar;
        }
        else if (clickedMaster) {
            switch (clickedParam) {
                case 'volume':
                    mainGainNode.gain.value = newValue;
                    break;
                case 'tempo':
                    tempo = newValue;
                    tempoInMs = 60 * 1000 / (4 * tempo);
                    break;
                case 'compression':
                    compressor.threshold.value = newValue * -1;
                    makeup.gain.value = 1.0 + (newValue / 40);
                    break; // console.log(makeup.gain.value); break;
            }
        }
        return newValue;
    }
}
function moveControl(increment_value, target) {
    var min = parseFloat(target.getAttribute('data-range-min') || '0') || 0.0;
    var max = parseFloat(target.getAttribute('data-range-max') || '100') || 100.0;
    var increment = (max - min) / 100.0;
    var newValue = Math.min(max, Math.max(min, parseFloat(target.value) + (increment * (-1 * increment_value))));
    var rotation = 0;
    rotation = (newValue - min) / max * 280.0 - 140;
    target.style.transform = 'rotate(' + rotation.toString() + 'deg)';
    target.value = newValue.toString();
    var scalar = 1.0;
    if (target.getAttribute('data-scaling') == 'exp') {
        scalar = (newValue / max - min);
    }
    var max = parseFloat(target.getAttribute('data-range-max') || '100') || 100.0;
    if (target.getAttribute('data-show-actual-value') == 'yes') {
        var display_value = newValue;
    }
    else {
        var display_value = 100.0 * (newValue / max);
    }
    var s = Math.floor(display_value).toString();
    var display_string = s.padStart(3, '0');
    screenDiv.innerText = display_string;
    return newValue; // * scalar;
}
function setInstrumentParameter(instrument, parameter, value) {
    instrument[parameter] = value;
}
function initializeKnobPositions() {
    var controls = document.getElementsByClassName("knob");
    let value = 0;
    for (let i = 0; i < controls.length; i++) {
        value = moveControl(0, controls[i]);
        var instrument = instruments_table[controls[i].getAttribute('data-instrument')];
        var param = controls[i].getAttribute('data-param');
        if (instrument && param) {
            setInstrumentParameter(instrument, param, value);
            console.log(instrument.id, param, value);
        }
    }
}
function setup() {
    document.addEventListener("mousedown", setupAudio);
    document.addEventListener("keydown", setupAudio);
    document.addEventListener("keydown", keyPressed);
    // document.addEventListener("keyup", keyUp, false);
    var controls = document.querySelectorAll("button.knob");
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener("mousedown", clickKnob);
    }
    var instruments = document.querySelectorAll(".instrument_name");
    for (let i = 0; i < instruments.length; i++) {
        instruments[i].addEventListener("mousedown", notePressed);
    }
    screenDiv = document.querySelector('#screen');
    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp);
    document.getElementById('save_preset').addEventListener('click', savePreset);
    // document.getElementById('load_preset').addEventListener('click', loadPreset);
    // volumeControl = document.querySelector("input[name='volume']");
    // volumeControl.addEventListener("change", changeVolume, false);
    initializePresets();
    sequencerSetup();
    // initializeKnobPositions();
    active_instrument_id = 'bd';
    selectInstrument();
}