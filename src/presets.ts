

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
    createPreset(preset, `Preset ${presets.length}`, 'user', true);

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

function loadUserPreset(preset_id) {
    // var preset = user_presets[id];
    // todo get from local storage
    loadPreset(JSON.parse(localStorage.getItem(`preset-${preset_id}`)));
};

function loadFactoryPreset(preset_id) {
    // var preset = presets[i];
    loadPreset(presets[preset_id]);
};

function deletePreset(id){
    for (let i = 0; i < user_preset_ids.length; i++) {
        if (user_preset_ids[i] == id) {
            user_preset_ids.splice(i, 1);
            break;
        }
    }
    localStorage.setItem('user-preset-ids', JSON.stringify(user_preset_ids));
    localStorage.removeItem(`preset-${id}`);
}

function clickPreset(event){
    let preset_id = event.target.getAttribute('data-preset-id');
    if (event.target.className == 'preset_delete') {
        preset_id = event.target.parentNode.getAttribute('data-preset-id');

        deletePreset(preset_id);
        event.target.parentNode.remove();
    } else {
        
        if (event.target.getAttribute('data-preset-type') == "user") {
            loadUserPreset(preset_id);            
        } else {
            loadFactoryPreset(preset_id);
        }
    }
}

var presets = [];
var presetList:HTMLElement;
var presetInput;
var user_preset_ids = [];

function createPresetNameEditor(presetLi:HTMLElement, preset){
    var presetName = document.createElement('INPUT') as HTMLInputElement;
    presetName.type = 'text';
    // presetName.name = `preset_name_${}`;
    presetName.autofocus = true;
    presetLi.appendChild(presetName);
    presetList.insertBefore(presetLi, presetList.firstChild);
 
    presetInput = presetName;


    presetName.value = `Preset ${(Object.keys(presets).length + user_preset_ids.length).toString()}`;
    presetName.autocomplete = presetName.name;
    presetName.focus();
    presetName.addEventListener('blur', function(event){
        var id = presetName.value;
        presetName.parentElement.setAttribute('data-preset-id', id);
        // presetLi.innerText = id;
        // var nameSpan = document.createElement('');
        // nameSpan.innerText = presetName.name;
        // presetLi.insertBefore(nameSpan, presetName);
        presetLi.prepend(id);
        presetName.style.display = 'none';
        presetName.remove();


        //save to local storag;
        user_preset_ids.push(id);
        localStorage.setItem('user-preset-ids', JSON.stringify(user_preset_ids));
        localStorage.setItem(`preset-${id}`, JSON.stringify(preset));
    });
    return presetName;
}

function createPreset(preset, id:string, typename:string, is_new:boolean = false){
    var presetLi = document.createElement("LI");
    presetLi.setAttribute('data-preset-type', typename);
    presetLi.setAttribute('data-preset-id', id.toString());
    var presetName:HTMLInputElement;

    if (typename == 'factory') {
        presetLi.innerHTML = id;
        presetList.insertBefore(presetLi, presetList.firstChild);
    } else {
        if (is_new) {
            presetName = createPresetNameEditor(presetLi, preset);
        } else {
            presetLi.innerHTML = id;
            presetList.insertBefore(presetLi, presetList.firstChild);
        }

        var deleteBtn = document.createElement('SPAN');
        deleteBtn.innerText = 'Delete';
        deleteBtn.className = 'preset_delete';
        presetLi.appendChild(deleteBtn);
    }
}

function initializePresets(){
    var request = new XMLHttpRequest();
    request.open("GET", "presets.json", true);
    request.responseType = "json";
    presetList = document.getElementById('preset_list');

    request.onload = function() {
        presets = request.response;
        for (let key in request.response) {
            createPreset(presets[key], key, 'factory');
        }

        user_preset_ids = JSON.parse(localStorage.getItem('user-preset-ids') || '[]');
        for (let i = 0; i < user_preset_ids.length; i++ ) {
            var id = user_preset_ids[i];
            presets[id] = JSON.parse(localStorage.getItem('preset-'+id));
            createPreset(presets[id], id, 'user', false);
        }

    }
    

    request.send();

    presetList.addEventListener('click', clickPreset);

    document.getElementById('save_preset').addEventListener('click', savePreset);
}