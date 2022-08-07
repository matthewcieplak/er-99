function notePressed(event) {
    var instrument_id = event.currentTarget.getAttribute('data-instrument');
    playNote(instrument_id);
    active_instrument_id = instrument_id;
    selectInstrument();
}
var keymap = {
    49: 'bd',
    50: 'sd',
    51: 'lt',
    52: 'mt',
    53: 'ht',
    54: 'rs',
    55: 'hc'
};
function keyPressed(event) {
    if (keymap[event.which]) {
        playNote(keymap[event.which]);
        active_instrument_id = keymap[event.which];
        updateSequenceDisplay();
        // document.querySelector('#'+keymap[event.which]+'_key').className="highlight active";
    }
    else if (event.which == 32) {
        toggleSequence();
    }
}
// function keyUp(event){
//     if (keymap[event.which]) {
//         // document.querySelector('#'+keymap[event.which]+'_key').className="highlight";
//     }
// }
function changeVolume(event) {
    if (mainGainNode.gain) {
        mainGainNode.gain.value = volumeControl.value;
    }
    else {
        volume = parseInt(volumeControl.value);
    }
}
function clickKnob(event) {
    clickedInstrument = instruments_table[event.currentTarget.getAttribute('data-instrument')];
    if (clickedInstrument) {
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
        var min = parseFloat(clickedTarget.getAttribute('data-range-min') || '0') || 0.0;
        var max = parseFloat(clickedTarget.getAttribute('data-range-max') || '100') || 100.0;
        var increment = (max - min) / 100.0;
        var newValue = Math.min(max, Math.max(min, parseFloat(clickedTarget.value) + (increment * (-1 * event.movementY + event.movementX))));
        var rotation = 0;
        rotation = (newValue - min) / max * 280.0 - 140;
        clickedTarget.style.transform = 'rotate(' + rotation.toString() + 'deg)';
        clickedTarget.value = newValue.toString();
        var scalar = 1.0;
        if (clickedTarget.getAttribute('data-scaling') == 'exp') {
            scalar = (newValue / max - min);
        }
        clickedInstrument[clickedParam] = newValue * scalar;
        console.log(clickedParam, ':', newValue * scalar);
    }
}
function setup() {
    document.addEventListener("keydown", keyPressed, false);
    // document.addEventListener("keyup", keyUp, false);
    var controls = document.querySelectorAll("button[class='knob']");
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener("mousedown", clickKnob);
    }
    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp);
    volumeControl = document.querySelector("input[name='volume']");
    volumeControl.addEventListener("change", changeVolume, false);
}
