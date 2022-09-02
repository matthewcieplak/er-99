//SEQUENCER STUFF
let sequencer = { "bars" : 1 };
let playing = false;
let tempo = 120;
let tempoInMs = 60 * 1000 / (4 * tempo);
let current_step = -1;
let sequencerTimeout:number;
let active_instrument_id:string = 'bd';
let start_button:HTMLButtonElement;
let clear_button:HTMLButtonElement;
let jumble_button:HTMLButtonElement;
let bar_buttons;
let sequence_bars = 1;
let visible_bar = 0;
let SEQUENCE_LENGTH:number = 16;
let sequence_max_length = 16;
let waitingForLengthInput = false;
let barButtonFlasher;

function initSequence(id:string){
    sequencer[id] = new Array(64).fill(0); //preset_sequences[0][id]; //[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}

function toggleSequence(){
    if (playing) {
        clearTimeout(sequencerTimeout);
        playing = false;
        start_button.className = 'big_button'
        updateSequenceDisplay();
    } else {
        playing = true;
        playNextStep();
        start_button.className = 'big_button active'
    }
    screenDiv.innerText = playing ? 'STA' : 'STP';
}

function selectInstrument(){
    
}

function clearTrack(){
    for (let i:number = 0; i < SEQUENCE_LENGTH; i++){
        sequencer[active_instrument_id][i] = 0;
    }
    screenDiv.innerText = 'CLR';

    updateSequenceDisplay();
}

function jumbleTrack(){
    for (let i:number = 0; i < SEQUENCE_LENGTH; i++){
        if (i < 16) {
            var rand:Number = Math.random()
            sequencer[active_instrument_id][i] = rand > 0.6;
            if (rand > 0.85) {
                sequencer[active_instrument_id][i] = 2;
            }
        } else {
            sequencer[active_instrument_id][i] = sequencer[active_instrument_id][i-16];
        }
    }
    screenDiv.innerText = 'JMB';
    updateSequenceDisplay();
}

function playNextStep(){
    current_step++;
    if (current_step > SEQUENCE_LENGTH-1) current_step = 0;
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
        } else {
            nextStepInMs = tempoInMs + swing_offset; 
        }
        
    }

    if (playing) sequencerTimeout = setTimeout(playNextStep, nextStepInMs);
    updateSequenceDisplay();
}

function updateSequenceDisplay(force_active = false){
    var step_value = 0;
    document.querySelectorAll('.sequencer_button').forEach(function (button, idx) {
        var step = idx+ visible_bar*16
        step_value = sequencer[active_instrument_id][step];
        if (step == current_step && (playing || force_active)) {
            button.className = 'sequencer_button' + (step_value == 0 ? '  active' : '');
        }
        else if (sequencer[active_instrument_id][step] > 0) {
            button.className = 'sequencer_button ' + (step_value == 2 ? 'accent' : 'active');
        }
        else {
            button.className = 'sequencer_button';
        }
    });

    if (!waitingForLengthInput) {
        var current_bar = Math.floor(current_step / 16);
        for (var i = 0; i < bar_buttons.length; i++) {
            bar_buttons[i].className = 'led_button bar_button' + (i == current_bar ? ' dim' : '') + (i == visible_bar ? ' active' : '');
        }
    }
}

function onSequencerButtonClick(event){
    var target = event.target;
    if (event.target.className == 'squareled') {
        target = event.target.parent;
    }
    if (target.getAttribute('data-step')) {
        var step = parseInt(event.target.getAttribute('data-step')) - 1 + visible_bar*16;
        sequencer[active_instrument_id][step] += 1;
        if (sequencer[active_instrument_id][step] > 2) sequencer[active_instrument_id][step] = 0;
        updateSequenceDisplay();
        // console.log(step);
    }
}

function onBarButtonClick(event){
    let bar = parseInt(event.currentTarget.value);
    
    if (waitingForLengthInput) { //when setting sequence length
        flashBarButtons(false);
        setSequenceLength(bar+1);
        clearTimeout(barButtonFlasher);
        waitingForLengthInput = false;
        updateSequenceDisplay();
    }

    if (bar != visible_bar) {
        visible_bar = bar;

        if ((bar+1) * 16 > SEQUENCE_LENGTH) setSequenceLength(bar+1);

        updateSequenceDisplay();
        for (var i = 0; i < bar_buttons.length; i++) {
            bar_buttons[i].className = 'led_button bar_button'
        }
        event.currentTarget.className = 'led_button bar_button active'
    }

}

function setSequenceLength(bars:number = 1) {
    SEQUENCE_LENGTH = bars * 16;
    sequence_bars = bars;
    if (SEQUENCE_LENGTH > sequence_max_length) {
        if (sequence_max_length > 16 && bars == 4) {
            copyBar(2,4);
        } else {
            let i = 2;
            while (i <= 4) {
                if (i*16 > sequence_max_length) {
                    var b = i-2;
                    if (i-2 < 1) b = 1;
                    copyBar(b, i);
                }
                i++;
            }
        }
        sequence_max_length = SEQUENCE_LENGTH;
    }
    screenDiv.innerText = SEQUENCE_LENGTH.toString();
}

function copyBar(sourceBar = 1, destBar){
    for (let inst in sequencer) {
        for (let i = 0; i < 16; i++) {
            sequencer[inst][(destBar-1)*16 + i] = sequencer[inst][(sourceBar-1)*16 + i];
        }
    }
    return;
}


function onLengthButtonClick(){
    if (waitingForLengthInput) {
        flashBarButtons(false);
        clearTimeout(barButtonFlasher);
        waitingForLengthInput = false;
        updateSequenceDisplay();
    }
    waitingForLengthInput = true;
    flashBarButtons(true);
}

function flashBarButtons(on = true){
    if (waitingForLengthInput == false) {
        clearTimeout(barButtonFlasher);
        return;
    }
    for (let i = 0; i < bar_buttons.length; i++) {
        bar_buttons[i].className = 'led_button bar_button ' + (on ? 'active' :  '');
    }
    barButtonFlasher = setTimeout(flashBarButtons, 300, !on);
}

function sequencerSetup(){
    document.querySelector('#sequencer').addEventListener('click', onSequencerButtonClick);

    start_button = document.querySelector('#start_button');
    start_button.addEventListener('click', toggleSequence);
    clear_button = document.querySelector('#clear_button');
    clear_button.addEventListener('click', clearTrack);
    jumble_button = document.querySelector('#jumble_button');
    jumble_button.addEventListener('click', jumbleTrack);

    var length_button = document.querySelector('#length_button');
    length_button.addEventListener('click', onLengthButtonClick);

    bar_buttons = document.querySelectorAll('.bar_button');
    for (let i = 0; i < bar_buttons.length; i++) {
        bar_buttons[i].addEventListener('click', onBarButtonClick);
    }
}


function loadSequenceCallback(preset){
    for (let key in preset) {
        sequencer[key] = preset[key];
        
        switch(key){
        case 'bars': 
            sequence_max_length = preset[key] * 16;
            setSequenceLength(preset[key]);
            updateSequenceDisplay();
            break;
        case 'tempo':
            tempo = preset[key]; tempoInMs = 60 * 1000 / (4 * tempo);
        case 'swing':
        case 'globalAccent':
            //debugger;
            globalParams[key] = preset[key];
            initializeKnobPositions();
            let knob = document.querySelector(`button[name="master_${key}"]`);
            knob.setAttribute('value', preset[key]);
            break;
        }
    }
    initializeKnobPositions();
    updateSequenceDisplay();
}

function saveSequenceCallback(){
    sequencer["bars"] = sequence_bars;
    sequencer["tempo"] = globalParams.tempo;
    sequencer["swing"] = globalParams.swing;
    sequencer["globalAccent"] = globalParams.globalAccent;
    return sequencer;
}

var preset_sequences = {};