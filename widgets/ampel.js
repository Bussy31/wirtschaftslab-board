const AmpelWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; container-type: size; position: relative;">
            
            <div style="background: #1e293b; border-radius: 40px; padding: 15px; display: flex; flex-direction: column; gap: 15px; border: 2px solid #334155; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3); z-index: 2;">
                
                <div :style="{ 
                        opacity: activeColor === 'red' ? 1 : 0.15, 
                        boxShadow: activeColor === 'red' ? '0 0 40px #ef4444, inset 0 0 10px rgba(255,255,255,0.6)' : 'none',
                        background: activeColor === 'red' ? '#ef4444' : '#7f1d1d'
                     }"
                     style="width: clamp(30px, 15cqmin, 80px); height: clamp(30px, 15cqmin, 80px); border-radius: 50%; transition: all 0.2s ease;"></div>
                
                <div :style="{ 
                        opacity: activeColor === 'yellow' ? 1 : 0.15, 
                        boxShadow: activeColor === 'yellow' ? '0 0 40px #facc15, inset 0 0 10px rgba(255,255,255,0.6)' : 'none',
                        background: activeColor === 'yellow' ? '#facc15' : '#713f12'
                     }"
                     style="width: clamp(30px, 15cqmin, 80px); height: clamp(30px, 15cqmin, 80px); border-radius: 50%; transition: all 0.2s ease;"></div>
                
                <div :style="{ 
                        opacity: activeColor === 'green' ? 1 : 0.15, 
                        boxShadow: activeColor === 'green' ? '0 0 40px #22c55e, inset 0 0 10px rgba(255,255,255,0.6)' : 'none',
                        background: activeColor === 'green' ? '#22c55e' : '#14532d'
                     }"
                     style="width: clamp(30px, 15cqmin, 80px); height: clamp(30px, 15cqmin, 80px); border-radius: 50%; transition: all 0.2s ease;"></div>
            </div>

            <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 80%; max-width: 200px; background: rgba(30,41,59,0.8); padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                
                <button v-if="!isListening" @click="startListening" @mousedown.stop @touchstart.stop
                        style="width: 100%; padding: 8px; background: #22c55e; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    🎤 Mikrofon Start
                </button>
                
                <button v-else @click="stopListening" @mousedown.stop @touchstart.stop
                        style="width: 100%; padding: 8px; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    🛑 Stopp
                </button>

                <div v-if="isListening" style="width: 100%; text-align: center;">
                    <label style="font-size: 0.7rem; color: #94a3b8; display: block; margin-bottom: 3px;">Empfindlichkeit</label>
                    <input type="range" min="0.5" max="5" step="0.1" v-model.number="sensitivity" @change="saveSettings"
                           @mousedown.stop @touchstart.stop
                           style="width: 100%; cursor: pointer;">
                    
                    <div style="width: 100%; height: 4px; background: #334155; border-radius: 2px; margin-top: 5px; overflow: hidden;">
                        <div :style="{ width: Math.min(adjustedVolume, 100) + '%', background: activeColor === 'red' ? '#ef4444' : (activeColor === 'yellow' ? '#facc15' : '#22c55e') }" 
                             style="height: 100%; transition: width 0.1s linear;"></div>
                    </div>
                </div>
            </div>

        </div>
    `,
    data() {
        return {
            isListening: false,
            volume: 0,
            audioContext: null,
            analyser: null,
            microphone: null,
            animationFrame: null,
            // Speichere Empfindlichkeit, lade Standard 2.0 wenn leer
            sensitivity: this.widgetData.sensitivity || 2.0
        }
    },
    computed: {
        adjustedVolume() {
            return this.volume * this.sensitivity;
        },
        activeColor() {
            if (!this.isListening) return 'none'; // Alles aus, wenn nicht aktiv

            // Schwellenwerte für die Ampel
            if (this.adjustedVolume > 75) return 'red';
            if (this.adjustedVolume > 40) return 'yellow';
            return 'green';
        }
    },
    methods: {
        async startListening() {
            try {
                // Erlaubnis für das Mikrofon anfragen
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.smoothingTimeConstant = 0.8; // Macht die Bewegung flüssiger (0-1)
                this.analyser.fftSize = 256;

                this.microphone = this.audioContext.createMediaStreamSource(stream);
                this.microphone.connect(this.analyser);

                this.isListening = true;
                this.measureVolume();

            } catch (err) {
                console.error("Mikrofon-Zugriff verweigert oder Fehler:", err);
                alert("Konnte nicht auf das Mikrofon zugreifen. Bitte erlaube den Zugriff im Browser.");
            }
        },
        measureVolume() {
            if (!this.isListening) return;

            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);

            // Durchschnittliche Lautstärke berechnen
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            // Wert glätten und in die Variable schreiben (max Wert wäre 255, wir skalieren es etwas runter)
            this.volume = (sum / dataArray.length);

            // Loop starten
            this.animationFrame = requestAnimationFrame(this.measureVolume);
        },
        stopListening() {
            this.isListening = false;

            if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
            if (this.microphone) this.microphone.disconnect();
            if (this.audioContext) this.audioContext.close();

            this.volume = 0;
        },
        saveSettings() {
            this.widgetData.sensitivity = this.sensitivity;
            this.$emit('save');
        }
    },
    // Wenn das Widget gelöscht wird, Mikrofon freigeben!
    unmounted() {
        this.stopListening();
    }
};