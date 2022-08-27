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
        var newValue = incrementControl(increment_value, clickedTarget);
        var max = parseFloat(clickedTarget.getAttribute('data-range-max') || '100') || 100.0;
        if (clickedTarget.getAttribute('data-show-actual-value') == 'yes') {
            var display_value = newValue;
        }
        else {
            var display_value = 100.0 * (newValue / max);
        }
        var s = Math.floor(display_value).toString();
        var display_string = s.padStart(3, '0');
        screenDiv.innerText = display_string;
    }
}
function incrementControl(increment_value, target) {
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
    if (clickedInstrument) {
        clickedInstrument[clickedParam] = newValue * scalar;
    }
    else if (clickedMaster) {
        globalParams[clickedParam] = newValue * scalar;
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
                console.log(makeup.gain.value);
                break;
        }
    }
    return newValue;
}
function initializeKnobPositions() {
    var controls = document.querySelectorAll("button.knob");
    for (let i = 0; i < controls.length; i++) {
        incrementControl(0, controls[i]);
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
    // volumeControl = document.querySelector("input[name='volume']");
    // volumeControl.addEventListener("change", changeVolume, false);
    sequencerSetup();
    // initializeKnobPositions();
    active_instrument_id = 'bd';
    selectInstrument();
}
