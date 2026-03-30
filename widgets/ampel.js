const AmpelWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; container-type: size; position: relative; overflow: hidden;">
            
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

            <div v-show="!widgetData.isTransparent"
                 style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 80%; max-width: 200px; background: rgba(30,41,59,0.8); padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
                
                <button v-if="!isListening" @click="startListening" @mousedown.stop @touchstart.stop
                        style="width: 100%; padding: 5px; background: transparent; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #22c55e; color: white; border: 2px solid white; border-radius: 10px; width: 60px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; line-height: 1.1; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                        <span style="font-size: 0.8rem; letter-spacing: 0.5px;">START</span>
                        <span style="font-size: 1.8rem; font-weight: 900;">P</span>
                    </div>
                </button>
                
                <button v-else @click="stopListening" @mousedown.stop @touchstart.stop
                        style="width: 100%; padding: 5px; background: transparent; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #ef4444; color: white; border: 2px solid white; border-radius: 10px; width: 60px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; line-height: 1.1; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                        <span style="font-size: 0.8rem; letter-spacing: 0.5px;">STOP</span>
                        <span style="font-size: 1.8rem; font-weight: 900;">P</span>
                    </div>
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
            sensitivity: this.widgetData.sensitivity || 2.0
        }
    },
    computed: {
        adjustedVolume() {
            return this.volume * this.sensitivity;
        },
        activeColor() {
            if (!this.isListening) return 'none';

            if (this.adjustedVolume > 75) return 'red';
            if (this.adjustedVolume > 40) return 'yellow';
            return 'green';
        }
    },
    methods: {
        async startListening() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.smoothingTimeConstant = 0.8;
                this.analyser.fftSize = 256;

                this.microphone = this.audioContext.createMediaStreamSource(stream);
                this.microphone.connect(this.analyser);

                this.isListening = true;
                this.measureVolume();

            } catch (err) {
                console.error("Mikrofon-Zugriff verweigert:", err);
                alert("Konnte nicht auf das Mikrofon zugreifen.");
            }
        },
        measureVolume() {
            if (!this.isListening) return;

            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            this.volume = (sum / dataArray.length);

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
    unmounted() {
        this.stopListening();
    }
};