let midi = null;  // global MIDIAccess object
let input_list = null;
let channel_list = null;
let midi_input = null;
let midi_channel = 0;
let midi_on = false;
let midi_ppqn_counter = 5;

//GM midi map - C below middle up
var notemap = {
  36: 'bd',
  38: 'sd',
  43: 'lt',
  45: 'mt',
  47: 'ht',
  37: 'rs',
  39: 'hc',
  42: 'chh',
  46: 'ohh',
  51: 'rc',
  49: 'cr'
}
function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
  listMidiInputs(midi);
}

function onMIDIFailure(msg) {
  console.error(`Failed to get MIDI access - ${msg}`);
}

function onMIDIMessage(event) {
    if (!midi_on) return; 
    // let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
    // for (const character of event.data) {
    //   str += `0x${character.toString(16)} `;
    // }
    // console.log(str);
    if (event.data[0] >>> 4 == 9) {//note on! 
      if (midi_channel == 0 || (event.data[0] & 0x0F) == midi_channel) {
        var inst:String = notemap[event.data[1]];
        inst && playNote(inst, event.data[2] > 64); //play the selected note with accent if velocity > 64
      }
    } else if (event.data[0] == 0xF8) { //midi beat
      midi_ppqn_counter++;
      if (midi_ppqn_counter >= 6) {
        midi_ppqn_counter = 0;
        playNextStep();
        updateSequenceDisplay(true);
      }
      if (playing) {
        toggleSequence();
      }
    } else if (event.data[0] == 0xFA) { //midi start
      // if (playing) {
      //   toggleSequence();
      // }
      current_step = 16;
      midi_ppqn_counter = 5;
    }
}


function onMidiInputChange(event){
  if (midi_input) {
    midi_input.onmidimessage = null;
  }
  midi.inputs.forEach((entry) => {
    if (entry.id == event.currentTarget.value) {
      entry.onmidimessage = onMIDIMessage;
      midi_input = entry;
      console.log('listening on ', entry.name);
    }
  });
}

function onMidiChannelChange(event){
  midi_channel = event.currentTarget.value;
}

function listMidiInputs(midiAccess) {
  while (input_list.hasChildNodes()) {
    input_list.removeChild(input_list.firstChild);
  }
  midi.inputs.forEach((entry) => {
        let node = document.createElement('OPTION') as HTMLOptionElement;
        node.value = entry.id;
        node.innerText = entry.name;
        input_list.appendChild(node);
        // entry.onmidimessage = onMIDIMessage;
    });
}
  

function midiSetup(){
    var midi_button = document.getElementById('midi_button');
    
    midi_button.addEventListener('click', (event) => {
        midi_on = !midi_on;
        if (midi_on) {
          document.getElementById('midi_led').className = 'led active';
          document.getElementById('midi_controls').style.visibility = 'visible';
          navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        } else {
          document.getElementById('midi_led').className = 'led';
          document.getElementById('midi_controls').style.visibility = 'hidden';          
        }
    });

    input_list = document.getElementById('midi_inputs');
    input_list.addEventListener('change', onMidiInputChange);

    channel_list = document.getElementById('midi_channel');
    channel_list.addEventListener('change', onMidiChannelChange);
}
