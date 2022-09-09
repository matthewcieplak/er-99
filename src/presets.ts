
class PresetList {

  presets = {};
  presetList:HTMLElement = null;
  saveButton:HTMLElement = null;
  user_preset_ids = [];
  storageKey = '';
  loadPresetCallback:Function = null;
  savePresetCallback:Function = null;

  constructor(presetList:HTMLElement, saveButton:HTMLElement, storageKey:string, loadPresetCallback:Function, savePresetCallback:Function) {
    this.presetList = presetList;
    this.saveButton = saveButton;
    this.storageKey = storageKey;
    this.loadPresetCallback = loadPresetCallback;
    this.savePresetCallback = savePresetCallback;

    this.savePreset = this.savePreset.bind(this);
    this.createPresetNameEditor = this.createPresetNameEditor.bind(this);
    this.initializePresets();
  }

  savePreset(){
    let preset = this.savePresetCallback.call(this);

    // let presetText = document.getElementById('preset_text') as HTMLTextAreaElement;
    // presetText.value =  JSON.stringify(preset);
    this.createPreset(preset, `${this.storageKey}-${Object.keys(this.presets).length}`, 'user', true);
  }
 
  loadPreset(preset:any){
    this.loadPresetCallback.call(this, preset);
  }

  loadUserPreset(preset_id) {
    // var preset = user_presets[id];
    // todo get from local storage
    this.loadPreset(JSON.parse(localStorage.getItem(`${this.storageKey}-${preset_id}`)));
  }

  loadFactoryPreset(preset_id) {
    // var preset = presets[i];
    this.loadPreset(this.presets[preset_id]);
  }

  deletePreset(id){
    for (let i = 0; i < this.user_preset_ids.length; i++) {
        if (this.user_preset_ids[i] == id) {
            this.user_preset_ids.splice(i, 1);
            break;
        }
    }
    localStorage.setItem(`user-${this.storageKey}-ids`, JSON.stringify(this.user_preset_ids));
    localStorage.removeItem(`${this.storageKey}-${id}`);
  }

  clickPreset(event){
    let preset_id = event.target.getAttribute('data-preset-id');
    if (event.target.className == 'preset_delete') {
        preset_id = event.target.parentNode.getAttribute('data-preset-id');

        this.deletePreset(preset_id);
        event.target.parentNode.remove();
    } else {
        
        if (event.target.getAttribute('data-preset-type') == "user") {
            this.loadUserPreset(preset_id);            
        } else {
            this.loadFactoryPreset(preset_id);
        }
    }
  }



  createPresetNameEditor (presetLi:HTMLElement, localPreset){
    var presetName = document.createElement('INPUT') as HTMLInputElement;
    presetName.type = 'text';
    // presetName.name = `preset_name_${}`;
    presetName.autofocus = true;
    presetLi.appendChild(presetName);
    this.presetList.insertBefore(presetLi, this.presetList.firstChild);
 
    let presetInput = presetName;


    presetName.value = `${this.storageKey.charAt(0).toUpperCase()+this.storageKey.slice(1)} ${(Object.keys(this.presets).length + this.user_preset_ids.length).toString()}`;
    presetName.autocomplete = presetName.name;
    presetName.focus();
    presetName.addEventListener('blur', function(event){
        var id = presetName.value;
        presetName.parentElement.setAttribute('data-preset-id', id);
        presetLi.prepend(id);
        presetName.style.display = 'none';
        presetName.remove();


        //save to local storage
        this.user_preset_ids.push(id);
        localStorage.setItem(`user-${this.storageKey}-ids`, JSON.stringify(this.user_preset_ids));
        localStorage.setItem(`${this.storageKey}-${id}`, JSON.stringify(localPreset));
    }.bind(this));
    return presetName;
  }

  createPreset(preset, id:string, typename:string, is_new:boolean = false){
    var presetLi = document.createElement("LI");
    presetLi.setAttribute('data-preset-type', typename);
    presetLi.setAttribute('data-preset-id', id.toString());
    var presetName:HTMLInputElement;

    
    if (typename == 'factory') {
        presetLi.innerHTML = id;
        this.presetList.appendChild(presetLi);
    } else {
        if (is_new) {
            presetName = this.createPresetNameEditor(presetLi, preset);
        } else {
            presetLi.innerHTML = id;
            this.presetList.insertBefore(presetLi, this.presetList.firstChild);
        }

        var deleteBtn = document.createElement('SPAN');
        deleteBtn.innerText = 'Delete';
        deleteBtn.className = 'preset_delete';
        presetLi.appendChild(deleteBtn);
    }
  }

   initializePresets(){
    var request = new XMLHttpRequest();
    request.open("GET", `${this.storageKey}s.json`, true);
    request.responseType = "json";
    // this.presetList = document.getElementById('preset_list');

    request.onload = function() {
        this.presets = request.response;
        for (let key in request.response) {
            this.createPreset(this.presets[key], key, 'factory');
        }

        this.user_preset_ids = JSON.parse(localStorage.getItem(`user-${this.storageKey}-ids`) || '[]');
        for (let i = 0; i < this.user_preset_ids.length; i++ ) {
            var id = this.user_preset_ids[i];
            //this.presets[id] = {}; //JSON.parse(localStorage.getItem('preset-'+id));
            this.createPreset({}, id, 'user', false);
        }

    }.bind(this);
    

    request.send();

    this.presetList.addEventListener('click', this.clickPreset.bind(this));

    this.saveButton.addEventListener('click', this.savePreset.bind(this));
  }
};