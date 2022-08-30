

function savePreset(){
    let preset = {};
    let knobs = document.getElementsByClassName('knob');
    for (let i = 0; i < knobs.length; i++){
        if (knobs[i].getAttribute('name') != null) {
            preset[knobs[i].getAttribute('name')] = parseFloat(knobs[i].getAttribute('value')).toFixed(2);
        }
    }
    let presetText = document.getElementById('preset_text') as HTMLTextAreaElement;
    presetText.value =  JSON.stringify(preset);
    createPreset(preset, 0, 'user');

}
 
function loadPreset(preset:any){
    // let presetText = document.getElementById('preset_text') as HTMLTextAreaElement;
    // let preset = JSON.parse(presetText.value);

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

function loadUserPreset(preset_id:Number) {
    // var preset = user_presets[id];
    // todo get from local storage
};

function loadFactoryPreset(preset_id:number) {
    // var preset = presets[i];
    loadPreset(presets[preset_id]);
};

function clickPreset(event){
    if (event.currentTarget.className == 'preset_delete') {
        // deletePreset(event.currentTarget)
    } else {
        let preset_id = parseInt(event.target.getAttribute('data-preset-id'));
        if (event.target.getAttribute('data-preset-type') == "user") {
            loadUserPreset(preset_id);            
        } else {
            loadFactoryPreset(preset_id);
        }
    }
}

var presets = [];
var presetList:HTMLElement;

function createPreset(preset, id:number, typename:string){
    var presetLi = document.createElement("LI");
    presetLi.setAttribute('data-preset-type', typename);
    presetLi.setAttribute('data-preset-id', id.toString());
    presetLi.innerHTML = preset.name + ' <span class="preset_delete">Delete</span>';
    presetList.appendChild(presetLi);
}

function initializePresets(){
    var request = new XMLHttpRequest();
    request.open("GET", "presets.json", true);
    request.responseType = "json";
    presetList = document.getElementById('preset_list');

    request.onload = function() {
        presets = request.response;
        for (var i = 0; i < presets.length; i++) {
            createPreset(presets[i], i, 'factory');
        }
    }

    request.send();

    presetList.addEventListener('click', clickPreset);
}