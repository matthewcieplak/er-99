function playGenerator(generator:any, accent:Boolean) {
    // generator.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
    if (generator.delayConst) { //clap

        // generator.noiseInput.gain.cancelAndHoldAtTime(audioContext.currentTime);
        
        generator.noiseInput.gain.setValueAtTime(0.5, audioContext.currentTime);
        generator.noiseInput.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + (generator.tone_decay / 1000.0));

        generator.delayInput.gain.cancelScheduledValues(1.0);


        var dc = generator.delayConst/1000.0;
        let decay_val =  generator.decay / 250 * dc;


        generator.delayOutput.gain.setValueAtTime(0.1, audioContext.currentTime); //0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime, dc/3 + decay_val);

        generator.delayOutput.gain.setValueAtTime(0.8, audioContext.currentTime+dc); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime+dc, dc/2 + decay_val);
        
        generator.delayOutput.gain.setValueAtTime(0.5, audioContext.currentTime+dc*2); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime+dc*2, dc/2 + decay_val);

        generator.delayOutput.gain.setValueAtTime(0.3, audioContext.currentTime+dc*3); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime+dc*3, dc/2 + decay_val);

        generator.delayOutput.gain.setValueAtTime(0.2, audioContext.currentTime+dc*4); // 0.001);
        generator.delayOutput.gain.setTargetAtTime(0.000001, audioContext.currentTime+dc*4, dc/2 + (generator.decay / 2500) );
    } else {
        if (generator.bufferSource) generator.bufferSource.stop();
        generator.bufferSource = audioContext.createBufferSource();
        generator.bufferSource.buffer = generator.buffer;
        generator.bufferSource.connect(generator.noiseInput);
        generator.bufferSource.start();
        generator.noiseInput.gain.setValueAtTime(1.0, audioContext.currentTime);
        generator.noiseInput.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + generator.decay / 1000.0);
    }

    generator.output.gain.setValueAtTime(generator.volume * (accent ? globalParams.globalAccent : 1.0), audioContext.currentTime);
    
}

function setupGenerator(generator){
    generator.output = audioContext.createGain();
    generator.output.gain.value = 0;
    generator.output.connect(compressor);

    generator.hiPass = new BiquadFilterNode(audioContext, { frequency : generator.hiPassFreq, type : "highpass"});
    generator.hiPass.connect(generator.output);

    generator.saturationNode = audioContext.createGain();
    generator.saturationNode.gain.value = generator.saturation || 1.0;
    

    if (generator.saturation) {
        generator.waveShaper = audioContext.createWaveShaper();
        generator.waveShaper.curve = makeDistortionCurve(20);
        generator.waveShaper.oversample = '2x';
        generator.saturationNode.connect(generator.waveShaper);
        generator.waveShaper.connect(generator.hiPass);
    } else {
        generator.saturationNode.connect(generator.hiPass);
    }

    generator.noiseInput = audioContext.createGain();
    generator.noiseInput.gain.value = 0;
    // whiteNoise.connect(generator.noiseInput);
    
    
    if (generator.delayConst) {
        setupClap(generator);
    } else {
        setupRim(generator);
    }


    for (let x = 0; x < generator.filterFreqs.length; x++) {
        generator.filterNodes[x] = new BiquadFilterNode(audioContext, { frequency : generator.filterFreqs[x], Q: generator.filterQs[x], type : generator.filterTypes[x]});
        if (generator.filterTopology == 'serial') { 
            if (x > 0) {
                generator.filterNodes[x-1].connect(generator.filterNodes[x]);
            } else {
                // generator.noiseInput.connect(generator.filterNodes[0]);
                if (generator.delayOutput) generator.delayOutput.connect(generator.filterNodes[0]);
            }
            if (x == generator.filterFreqs.length - 1) {
                generator.filterNodes[x].connect(generator.saturationNode);
            }


        } else {
            generator.filterNodes[x].connect(generator.saturationNode);
            if (x == 0) {
                generator.noiseInput.connect(generator.filterNodes[x]);
                if (generator.delayOutput) generator.delayOutput.connect(generator.filterNodes[x]);
            }
        }

        if (generator.filterGains) {
            generator.filterNodes[x].gain.value = generator.filterGains[x];
        }
    }
}

function setupClap(generator){
    generator.delayInput = audioContext.createGain();
    generator.delayOutput = audioContext.createGain();
    generator.modulatorLevel = audioContext.createGain();
    generator.modulatorLevel.gain.value = 0.4;
    generator.delayInput.gain.value = 1.0;
    generator.delayOutput.gain.value = 0;
    generator.delayInput.connect(generator.delayOutput);
    generator.modulator = audioContext.createOscillator();
    generator.modulator.frequency = 40;
    generator.modulator.type = 'sawtooth';
    generator.modulator.connect(generator.modulatorLevel);
    generator.modulatorLevel.connect(generator.delayInput.gain);
    generator.modulator.start();

    generator.toneFilter  = new BiquadFilterNode(audioContext, { frequency : generator.tone, Q: 2.0, type : 'bandpass'});
    // generator.toneFilter2 = new BiquadFilterNode(audioContext, { frequency : 1000, Q: 5.5, type : 'peaking'});
    // whiteNoise.disconnect(generator.noiseInput);
    whiteNoise.connect(generator.toneFilter);
    // generator.toneFilter.connect (generator.toneFilter2);
    generator.toneFilter.connect(generator.noiseInput);

    generator.noiseInput.connect(generator.saturationNode);

    whiteNoise.connect(generator.delayInput);
}


function setupRim(generator){
    generator.buffer = audioContext.createBuffer(1, 256, audioContext.sampleRate);
    // This gives us the actual ArrayBuffer that contains the data
    const nowBuffering = generator.buffer.getChannelData(0);
    for (let i = 0; i < 200; i++) {
        // Math.random() is in [0; 1.0]
        // audio needs to be in [-1.0; 1.0]
        // nowBuffering[i] = Math.random() * 2 - 1;
        nowBuffering[i] =  rimNoise[i];
    }
}

//200 32-bit floats of white noise that sounds pretty good when bandpass filtered. 
//it's important that it repeats and isn't re-generated each hit
//analog filters would have better ringing and could use a simple impulse input but the digital ones need more excitement to induce resonance
const rimNoise:number[] = [
    -0.0938141867518425,
    0.7102846503257751,
    -0.685766339302063,
    0.4907262921333313,
    -0.3911896049976349,
    -0.3124760091304779,
    0.6563512682914734,
    0.928503155708313,
    -0.6719098091125488,
    0.946106493473053,
    0.702319860458374,
    0.3403726816177368,
    -0.7190880179405212,
    0.2917483150959015,
    -0.7644904851913452,
    0.9628100991249084,
    0.4206474721431732,
    -0.44558143615722656,
    -0.9672186374664307,
    0.6598025560379028,
    0.47643211483955383,
    0.5561770796775818,
    0.3712882697582245,
    -0.36183351278305054,
    -0.7939896583557129,
    0.39301514625549316,
    -0.9791231751441956,
    -0.7119218111038208,
    0.17154400050640106,
    0.49292445182800293,
    -0.044391319155693054,
    -0.5022702217102051,
    0.42775845527648926,
    -0.7908858060836792,
    0.15842849016189575,
    -0.3464527428150177,
    -0.06815345585346222,
    -0.6528737545013428,
    -0.8457662463188171,
    0.2706998884677887,
    -0.4698350429534912,
    0.6159835457801819,
    0.579700767993927,
    -0.08275951445102692,
    -0.5312353372573853,
    0.6295946836471558,
    -0.7151079773902893,
    -0.4602707028388977,
    0.3251723647117615,
    0.5111592411994934,
    0.8249071836471558,
    0.33816373348236084,
    0.16297145187854767,
    0.20368638634681702,
    -0.6493934988975525,
    -0.7581902146339417,
    0.7735790610313416,
    0.47196561098098755,
    -0.10748262703418732,
    0.7939162850379944,
    0.1509392261505127,
    0.5842358469963074,
    -0.05638119578361511,
    0.8583419919013977,
    0.6294043660163879,
    0.22440209984779358,
    -0.8036736845970154,
    0.4246376156806946,
    0.6533545255661011,
    -0.6216084361076355,
    0.1065131276845932,
    0.7721655964851379,
    -0.8856338262557983,
    -0.9257946014404297,
    -0.22200027108192444,
    0.000844220572616905,
    0.099571093916893,
    0.6854760050773621,
    -0.7621583342552185,
    -0.38532841205596924,
    -0.6560276746749878,
    -0.11282013356685638,
    0.3745887279510498,
    -0.8450918793678284,
    -0.6507189869880676,
    0.7628042101860046,
    -0.28953537344932556,
    -0.3797481060028076,
    0.8847131729125977,
    0.7058473825454712,
    0.47311416268348694,
    -0.10166404396295547,
    0.6752808094024658,
    0.8873506188392639,
    0.6834714412689209,
    0.8259801268577576,
    0.7404413223266602,
    0.6065666675567627,
    0.48070207238197327,
    0.3736712634563446, 
    -0.253595769405365,
    -0.9127187728881836,
    0.8663365244865417,
    0.882439374923706,
    -0.09889926016330719,
    0.9645036458969116,
    -0.8030155897140503,
    0.7513594627380371,
    -0.19000419974327087,
    0.6537664532661438,
    0.9187515377998352,
    0.6098461151123047,
    -0.800383985042572,
    0.5615882873535156,
    -0.07559498399496078,
    0.14509990811347961,
    0.6961334347724915,
    -0.32785388827323914,
    0.36420372128486633,
    -0.057758450508117676,
    0.48798951506614685,
    -0.031131094321608543,
    -0.08771521598100662,
    -0.8598763942718506,
    0.4171707332134247,
    0.1086604967713356,
    0.03149956092238426,
    0.641241729259491,
    -0.6776508092880249,
    0.8478045463562012,
    0.515723705291748,
    -0.3923241198062897,
    -0.9096614122390747,
    0.07917828857898712,
    -0.2778809368610382,
    -0.8534830212593079,
    -0.0927843526005745,
    -0.1977241039276123,
    0.16568148136138916,
    -0.9512038230895996,
    0.03670766204595566,
    0.9108136892318726,
    0.1477319896221161,
    0.30539363622665405,
    -0.7050888538360596,
    0.9099668264389038,
    -0.49326977133750916,
    0.6052023768424988,
    0.004538396373391151,
    -0.7342783212661743,
    0.047306571155786514,
    0.3396494388580322,
    -0.24110381305217743,
    -0.6909115314483643,
    -0.15850205719470978,
    0.6355003118515015,
    0.1780438870191574,
    0.7516891360282898,
    -0.7339579463005066,
    0.7635491490364075,
    -0.08038980513811111,
    0.7032962441444397,
    -0.270632266998291,
    -0.47390109300613403,
    0.6037904620170593,
    0.07386089116334915,
    0.19045040011405945,
    0.24417270720005035,
    -0.6874961256980896,
    -0.1794464886188507,
    0.5320767164230347,
    -0.0663330927491188,
    -0.06958585232496262,
    -0.9505257606506348,
    0.8732248544692993,
    -0.9755458831787109,
    -0.9906177520751953,
    -0.7038559317588806,
    -0.8764607310295105,
    -0.5446853637695312,
    -0.25804081559181213,
    -0.846868634223938,
    -0.19499368965625763,
    -0.593953549861908,
    0.9608613848686218,
    -0.20571835339069366,
    -0.7908936738967896,
    -0.6336819529533386,
    -0.3839634656906128,
    0.9093872308731079,
    0.8396366238594055,
    -0.7636103630065918,
    0.6916990876197815,
    0.315847247838974,
    0.8680893182754517,
    0.12821145355701447,
    0.30398818850517273,
    0.9621102213859558,
    0.9373974204063416,
    -0.71066778898239
];