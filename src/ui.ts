var screenDiv:HTMLDivElement;
let clicking:Boolean = false;
let clickedTarget:HTMLButtonElement;
let clickedInstrument:Instrument;
let clickedParam:string;
let clickedMaster:boolean = false;
let touchX:number = 0;
let touchY:number = 0;

var keymap = {
    49 : 'bd',  //   1
    50 : 'sd',  //   2
    51 : 'lt',  //   3
    52 : 'mt',  //   4
    53 : 'ht',  //   5
    54 : 'rs',  //   6
    55 : 'hc',  //   7
    56 : 'chh', //   9
    57 : 'ohh', //   0
    48 : 'rc',  //   0
    192 : 'cr',  // ` backtick
    
    96  : 'bd',  //   numpad 0
    97  : 'sd',  //   numpad 1
    100  : 'lt',  //   numpad 4
    101 : 'mt',  //   numpad 5
    102 : 'ht',  //   numpad 6
    99  : 'rs',  //   numpad 3
    98  : 'hc',  //   numpad 2
    104 : 'chh', //   numpad 8
    105 : 'ohh', //   numpad 9
    103 : 'rc',  //   numpad 7
    110 : 'cr'  // ` numpad .
}

function notePlayed(instrument_id){
    playNote(instrument_id, false)
    active_instrument_id = instrument_id;
    screenDiv.innerText  = instrument_id.padStart(3, ' ');
    selectInstrument();
    updateSequenceDisplay();
}

function notePressed(event){
    var instrument_id = event.currentTarget.getAttribute('data-id');
    notePlayed(instrument_id);
}

function keyPressed(event){
    if (!running) setupAudio();

    if (document.activeElement.nodeName == 'INPUT') {
        return true;
    }

    if (keymap[event.which]) {
        notePlayed(keymap[event.which]);

    } else if (event.which == 32) {
        toggleSequence();
        event.preventDefault();
        event.stopPropagation();
    }
    return false;
}

function clickKnob(event) {
    if (clicking == true) return true;

    if (event.type == 'mousedown' || event.type == 'touchstart') {
        if (!running) setupAudio();
        clicking = true;
    }
    
    // console.log(event.currentTarget);

    clickedInstrument = instruments_table[event.currentTarget.getAttribute('data-instrument')];
    clickedMaster = event.target.getAttribute('data-control') == 'master';
    if (clickedInstrument || clickedMaster) {
        clickedParam = event.currentTarget.getAttribute('data-param');
    } 
    clickedTarget = event.currentTarget;
   
    if (event.touches) { 
        touchX = event.touches[0].pageX;
        touchY = event.touches[0].pageY;
    }
}

function onMouseUp(event) {
    clicking = false;
    clickedTarget = null;
}

function onMouseMove(event) {
    if (clickedTarget && (clicking || event.type == 'wheel')) {
        var increment_value:number = event.movementY - event.movementX;
        if (event.touches) {
            //debugger;
            increment_value = touchX - event.touches[0].pageX + event.touches[0].pageY - touchY;
            touchX = event.touches[0].pageX;
            touchY = event.touches[0].pageY;
        
        } else if (event.deltaY) {
            // debugger;
            increment_value = event.deltaY > 0 ? 5 : -5;
        }
        var newValue = moveControl(increment_value, clickedTarget)
        
        if (clickedInstrument) {
            setInstrumentParameter(clickedInstrument, clickedParam, newValue);
            //clickedInstrument[clickedParam] = newValue * scalar;
        } else if (clickedMaster) {
            switch (clickedParam) {
                case 'volume' : mainGainNode.gain.value = newValue; break;
                case 'tempo'  : tempo = newValue; tempoInMs = 60 * 1000 / (4 * tempo); break;
                case 'swing'  : globalParams.swing = newValue; break;
                case 'globalAccent'  : globalParams.globalAccent = newValue; break;
                case 'compression' : compressor.threshold.value = newValue * -1; makeup.gain.value = 1.0 + (newValue / 40); break; // console.log(makeup.gain.value); break;
            }
        }
    
        event.preventDefault();
        event.stopPropagation();
        return false; //newValue;
    }
}


function moveControl(increment_value:number, target:any) {
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
    } else {
        var display_value = 100.0 * (newValue / max);
    }
    var s = Math.floor(display_value).toString();
    var display_string = s.padStart(3, '0');
    screenDiv.innerText = display_string; 

    return newValue; // * scalar;
}    

function setInstrumentParameter(instrument:Instrument, parameter:string, value:Number, ){
    instrument[parameter] = value;
}

function initializeKnobPositions(){
    var controls = document.getElementsByClassName("knob");
    let value:Number = 0;
    for (let i = 0; i < controls.length; i++) {
        value = moveControl(0, controls[i]);
        let param:string = controls[i].getAttribute('data-param');

        if (controls[i].getAttribute('data-control') == 'master') {
            // set master param;
            globalParams[param] = value;
        } else {
            let instrument:Instrument = instruments_table[controls[i].getAttribute('data-instrument')];
            if (instrument && param) {
                setInstrumentParameter(instrument, param, value);
                // console.log(instrument.id, param, value);
            }
        }
        
    }
}

function loadPresetCallback(preset){
    let knobs = document.getElementsByClassName('knob');
    for (let i = 0; i < knobs.length; i++){
        for (let ii in preset) {
            if (knobs[i].getAttribute('name') == ii) {
                knobs[i].setAttribute('value', preset[ii]);
                break;
            }
        }
    }
    
    initializeKnobPositions();
}

function savePresetCallback(){
    let preset = {};
    let knobs = document.getElementsByClassName('knob');
    for (let i = 0; i < knobs.length; i++){
        if (knobs[i].getAttribute('name') != null) {
            preset[knobs[i].getAttribute('name')] = parseFloat(knobs[i].getAttribute('value')).toFixed(2);
        }
    }
    return preset;
}

function setup(){
    document.addEventListener("mousedown", setupAudio);
    document.addEventListener("touchstart", setupAudio);
    document.addEventListener("keydown", setupAudio);
    document.addEventListener("keydown", keyPressed);

    var controls = document.querySelectorAll("button.knob");
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener("mousedown", clickKnob);
        controls[i].addEventListener("touchstart", clickKnob);
        controls[i].addEventListener("mouseenter", clickKnob);
        controls[i].addEventListener("wheel", onMouseMove);
    }

    var instruments = document.querySelectorAll(".instrument_name");
    for (let i = 0; i < instruments.length; i++) {
        instruments[i].addEventListener("mousedown", notePressed);
        instruments[i].addEventListener("touchstart", notePressed);
    }

    screenDiv = document.querySelector('#screen');

    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp);
    document.body.addEventListener('touchmove', onMouseMove, { passive: false });
    document.body.addEventListener('touchend', onMouseUp);
    // document.addEventListener("scroll", onScroll);

    presetList = new PresetList(document.getElementById('preset_list'), document.getElementById('save_preset'), 'preset', loadPresetCallback, savePresetCallback);
    sequenceList = new PresetList(document.getElementById('sequence_list'), document.getElementById('save_sequence'), 'sequence', loadSequenceCallback, saveSequenceCallback);
    sequencerSetup();
    midiSetup();


    active_instrument_id = 'bd';
    selectInstrument();
}

var presetList;
var sequenceList;