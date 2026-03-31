const ZufallWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; gap: 10px; box-sizing: border-box;">
            
            <div v-if="!showSettings && currentModus === 'text'" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <div v-if="anzeigeName" 
                     :style="{ 
                        background: isSpinning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                        border: isSpinning ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                        color: isSpinning ? '#fbbf24' : '#34d399',
                        transition: 'all 0.1s'
                     }"
                     style="border-radius: 8px; padding: 2cqh; text-align: center; font-size: clamp(1.2rem, 8cqw, 4rem); font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5); line-height: 1.2; word-wrap: break-word;">
                    {{ isSpinning ? '🔄 ' + anzeigeName : '🎉 ' + anzeigeName + ' 🎉' }}
                </div>
                <div v-else style="text-align: center; color: rgba(255,255,255,0.4); font-style: italic; font-size: clamp(1rem, 5cqw, 2rem);">
                    Bereit...
                </div>
            </div>

            <div v-if="!showSettings && currentModus === 'rad'" style="flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                <div style="position: relative; width: 65cqmin; height: 65cqmin; margin-bottom: 10px;">
                    <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); z-index: 10; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 20px solid white; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8));"></div>
                    
                    <div :style="{
                        width: '100%', height: '100%',
                        borderRadius: '50%',
                        background: wheelGradient,
                        transform: 'rotate(' + wheelRotation + 'deg)',
                        transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                        border: '2px solid rgba(255,255,255,0.2)'
                    }">
                        <div v-for="(name, i) in namenList" :key="i"
                             :style="{
                                 position: 'absolute',
                                 top: '50%', left: '50%',
                                 transform: 'translate(-50%, -50%) rotate(' + ((i * 360 / namenList.length) + (180 / Math.max(1, namenList.length))) + 'deg) translateY(-20cqmin) rotate(-90deg)',
                                 transformOrigin: 'center center',
                                 fontSize: 'clamp(0.5rem, 3cqmin, 1.1rem)',
                                 fontWeight: 'bold',
                                 color: 'white',
                                 textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                 whiteSpace: 'nowrap',
                                 maxWidth: '25cqmin',
                                 overflow: 'hidden'
                             }">
                             {{ name }}
                        </div>
                    </div>
                </div>
                <div style="height: 30px; display: flex; align-items: center;">
                    <div v-if="anzeigeName && !isSpinning" style="font-size: clamp(1rem, 5cqmin, 1.8rem); font-weight: bold; color: #34d399; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                        {{ anzeigeName }}
                    </div>
                </div>
            </div>

            <div v-if="showSettings" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
                <textarea v-model="schuelerListe" 
                          style="flex: 1; width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 4px; padding: 10px; resize: none; font-family: inherit;"
                          placeholder="Namen hier rein..."></textarea>
            </div>

            <div v-if="!showSettings" style="display:flex; gap:8px; align-items: stretch;">
                <button @click="spin" class="btn-primary" style="flex: 1; height: 36px;" :disabled="isSpinning">Zufall</button>
                <button @click="showSettings = true" class="btn-secondary" style="width: 40px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                    ⚙️
                </button>
            </div>
            <div v-else style="display:flex;">
                <button @click="closeSettings" class="btn-primary" style="flex:1; height: 36px;">Speichern</button>
            </div>
        </div>
    `,
    data() {
        return {
            schuelerListe: this.widgetData.schuelerListe || '',
            anzeigeName: '',
            isSpinning: false,
            showSettings: false,
            wheelRotation: 0
        };
    },
    computed: {
        namenList() {
            return this.schuelerListe.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        },
        currentModus() {
            return this.widgetData.modus || 'rad';
        },
        wheelGradient() {
            const namen = this.namenList;
            if (namen.length === 0) return 'conic-gradient(#334155 0%, #334155 100%)';
            const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];
            const step = 100 / namen.length;
            let grad = [];
            for(let i = 0; i < namen.length; i++) {
                grad.push(`${colors[i % colors.length]} ${i * step}% ${(i+1) * step}%`);
            }
            return `conic-gradient(${grad.join(', ')})`;
        }
    },
    methods: {
        spin() {
            const namen = this.namenList;
            if (namen.length === 0 || this.isSpinning) return;
            this.isSpinning = true;
            this.anzeigeName = '';

            if (this.currentModus === 'text') {
                let duration = 3000;
                let startTime = Date.now();
                const spinTick = () => {
                    const elapsed = Date.now() - startTime;
                    this.anzeigeName = namen[Math.floor(Math.random() * namen.length)];
                    if (elapsed < duration) {
                        setTimeout(spinTick, 50 + (elapsed/duration * 400));
                    } else {
                        this.isSpinning = false;
                    }
                };
                spinTick();
            } else {
                const extraSpins = 360 * 5;
                const randomOffset = Math.floor(Math.random() * 360);
                this.wheelRotation += extraSpins + randomOffset;
                setTimeout(() => {
                    this.isSpinning = false;
                    const sliceAngle = 360 / namen.length;
                    const finalAngle = (360 - (this.wheelRotation % 360)) % 360;
                    this.anzeigeName = namen[Math.floor(finalAngle / sliceAngle)];
                }, 4000);
            }
        },
        closeSettings() {
            this.showSettings = false;
            this.saveState();
        },
        saveState() {
            this.widgetData.schuelerListe = this.schuelerListe;
            if(!this.widgetData.modus) this.widgetData.modus = 'rad';
            this.$emit('save');
        }
    }
};