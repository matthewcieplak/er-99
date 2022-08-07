//SEQUENCER STUFF
let sequencer = {};
let playing = false;
let tempo = 120;
let tempoInMs = 60 * 1000 / (4 * tempo);
let current_step = 0;
let sequencerTimeout;
let active_instrument_id = 'bd';
function initSequence(id) {
    sequencer[id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}
function toggleSequence() {
    if (playing) {
        clearTimeout(sequencerTimeout);
        playing = false;
    }
    else {
        playing = true;
        playNextStep();
    }
}
function selectInstrument() {
}
function playNextStep() {
    current_step++;
    if (current_step > 15)
        current_step = 0;
    for (let inst_key in instruments_table) {
        if (sequencer[inst_key][current_step]) {
            playNote(inst_key);
        }
    }
    sequencerTimeout = setTimeout(playNextStep, tempoInMs);
    updateSequenceDisplay();
    console.log(current_step, tempoInMs);
}
function updateSequenceDisplay() {
    document.querySelectorAll('.sequencer_button').forEach(function (button, idx) {
        if (idx == current_step || sequencer[active_instrument_id][idx] == 2) {
            button.className = 'sequencer_button playing';
        }
        else if (sequencer[active_instrument_id][idx] == 1) {
            button.className = 'sequencer_button active';
        }
        else {
            button.className = 'sequencer_button';
        }
    });
}
function onSequencerButtonClick(event) {
    if (event.target.getAttribute('data-step')) {
        var step = parseInt(event.target.getAttribute('data-step')) - 1;
        sequencer[active_instrument_id][step] += 1;
        if (sequencer[active_instrument_id][step] > 2)
            sequencer[active_instrument_id][step] = 0;
        updateSequenceDisplay();
        console.log(step);
    }
}
function sequencerSetup() {
    document.querySelector('#sequencer').addEventListener('click', onSequencerButtonClick);
}
