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
    decay: 20,
    filterTypes: ['bandpass', 'bandpass', 'bandpass'],
    filterFreqs: [220, 400, 800],
    filterQs: [6.5, 7.5, 6.5],
    filterTopology: 'parallel',
    highPassFreq: 100,
    filterNodes: [],
    volume: 0.5,
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
    volume: 0.5,
    pitch: 1.0,
};
let Crash = {
    id: 'cr',
    name: 'Crash',
    sourceUrl: 'samples/crash.wav',
    decay: 2000,
    highPassFreq: 100,
    lowPassFreq: 20000,
    volume: 0.5,
    pitch: 1.0,
};
let instruments = [BassDrum, SnareDrum, LowTom, MedTom, HiTom];
let generators = [RimShot, HandClap];
let samplers = [HiHat, Ride, Crash];
let instruments_table = {};
