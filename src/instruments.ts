interface Instrument {
    id : string,
    name: String;
    frequency?: number; //frequency in hZ
    offset?: number,
    decay: number; //decay time in milliseconds
    tone: number; //amount of white noise (0-1.0)
    tone_decay?: number //white noise decay time in milliseconds
    volume: number; //gain (0-1.0)
    env_amount?: number; //pitch envelope amount (scalar multiplier of frequency, 1-10 typically)
    env_duration?: number //pitch envelope duration in milliseconds
    saturation?: number //gain constant 1.0-4.0
    filter_type?: BiquadFilterType,
    filter_freq?: number,
    filter?: BiquadFilterNode,
    osc?: OscillatorNode,
    osc2?: OscillatorNode,
    input?: GainNode,
    noiseInput?: GainNode,
    output?: GainNode,
    muteTimeout?: number,
    waveShaper?: WaveShaperNode,
    saturationNode?: GainNode
}

type topology = 'serial' | 'parallel';

// rim
interface soundGenerator {
    id: string,
    name: String,
    decay: number,
    filterTypes: BiquadFilterType[],
    filterFreqs: number[],
    filterQs: number[],
    filterNodes: BiquadFilterNode[],
    filterTopology?: topology,
    filterGains?: number[],
    highPassFreq : number,
    volume: number,
    saturation?: number,
    waveShaper?: WaveShaperNode,
    saturationNode?: GainNode,
    muteTimeout?: number
}

//clap
interface ClapGenerator extends soundGenerator {
    delayConst: number, //"spread"
    delayInput?: GainNode,
    tone_decay: number //level of non-delayed noise
    tone: number, //lowpass filter on non-delayed noise
    tune: number, //peak freq
}

//hi hat/cym
interface Sampler {
    id: string,
    sourceUrl: string,
    name: String,
    decay: number,
    decay_closed?: number,
    pitch?: number,
    highPassFreq : number,
    lowPassFreq : number
    volume: number,
    muteTimeout?: number
    buffer?: AudioBuffer,
    output?: GainNode,
    sourceNode? : AudioBufferSourceNode
}


let BassDrum: Instrument = {
    id : 'bd',
    name: 'Bass Drum',
    frequency: 80,
    decay: 300,
    tone : 0.5,
    tone_decay: 20,
    volume: 0.5,
    env_amount: 2.5,
    env_duration: 50,
    filter_type: 'lowpass',
    filter_freq: 3000,
    saturation: 0.5,
};

let SnareDrum: Instrument = {
    id : 'sd',
    name: 'Snare Drum',
    frequency: 220,
    decay: 100,
    tone : 0.25,
    tone_decay: 250,
    volume: 0.5,
    env_amount: 4.0,
    env_duration: 10,
    filter_type: 'notch',
    filter_freq: 1000
};

let LowTom: Instrument = {
    id : 'lt',
    name: 'Low Tom',
    frequency: 100,
    offset: 100,
    decay: 200,
    tone : 0.05,
    tone_decay: 100,
    volume: 0.5,
    env_amount: 2.0, 
    env_duration: 100
};

let MedTom: Instrument = {
    id : 'mt',
    name: 'Med Tom',
    frequency: 200,
    offset: -50,
    decay: 200,
    tone : 0.05,
    tone_decay: 100,
    volume: 0.5,
    env_amount: 2.0, 
    env_duration: 100
};

let HiTom: Instrument = {
    id : 'ht',
    name: 'Hi Tom',
    frequency: 300,
    offset: -80,
    decay: 200,
    tone : 0.05,
    tone_decay: 100,
    volume: 0.5,
    env_amount: 2.0, 
    env_duration: 100
};


let RimShot: soundGenerator = {
    id: 'rs',
    name: 'Rim Shot',
    decay: 30,
    filterTypes: ['bandpass', 'bandpass', 'bandpass'],
    filterFreqs: [220, 500, 950],
    filterQs:    [10.5, 10.5, 10.5],
    filterGains: [10, 20, 30],
    filterTopology: 'parallel',
    highPassFreq : 100,
    filterNodes: [],
    volume : 3.0,
    saturation: 3.0
};


let HandClap: ClapGenerator = {
    id: 'hc',
    name: 'Hand Clap',
    decay: 80,
    delayConst: 10,
    filterTypes: ['highpass', 'bandpass'], // 'bandpass'],
    filterFreqs: [900, 1200],
    filterQs:    [1.2, 0.7], //9.5],
    filterGains: [0, 0, 5],
    filterTopology: 'serial',
    highPassFreq : 80,
    filterNodes: [],
    volume : 1.5,
    tune: 1000,
    tone: 2200,
    tone_decay: 250
};

let HiHat: Sampler = {
    id: 'ohh',
    name : 'Hi Hat',
    sourceUrl : 'samples/hh.wav',
    decay: 2000,
    decay_closed: 300,
    highPassFreq: 100,
    lowPassFreq: 20000,
    volume: 0.5,
    pitch: 1.0,
};

let Ride: Sampler = {
    id: 'rc',
    name : 'Ride Cymbal',
    sourceUrl : 'samples/ride.wav',
    decay: 2000,
    highPassFreq: 100,
    lowPassFreq: 20000,
    volume: 0.2,
    pitch: 1.0,
};


let Crash: Sampler = {
    id: 'cr',
    name : 'Crash',
    sourceUrl : 'samples/crash.wav',
    decay: 2000,
    highPassFreq: 100,
    lowPassFreq: 20000,
    volume: 0.3,
    pitch: 1.0,
};


let instruments: Instrument[] = [BassDrum, SnareDrum, LowTom, MedTom, HiTom ];
let generators: soundGenerator[] = [RimShot, HandClap];
let samplers: Sampler[] = [HiHat, Ride, Crash];
let instruments_table = {};