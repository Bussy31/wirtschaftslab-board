const ZufallWidget = {
    props: ['widgetData'],
    template: `
        <div @mouseenter="isHovered = true" @mouseleave="isHovered = false"
             style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 5px; gap: 5px; box-sizing: border-box; position: relative;">
            
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
                <div v-else style="text-align: center; color: var(--text-color); opacity: 0.5; font-style: italic; font-size: clamp(1rem, 5cqw, 2rem);">
                    Bereit...
                </div>
            </div>

            <div v-if="!showSettings && currentModus === 'rad'" style="flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                <div style="position: relative; width: 75cqmin; height: 75cqmin; margin-bottom: 5px;">
                    <div style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); z-index: 10; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 20px solid var(--text-color); filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8));"></div>
                    
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
                                 transform: 'translate(-50%, -50%) rotate(' + ((i * 360 / namenList.length) + (180 / Math.max(1, namenList.length))) + 'deg) translateY(-25cqmin) rotate(-90deg)',
                                 transformOrigin: 'center center',
                                 fontSize: 'clamp(0.5rem, 3.5cqmin, 1.1rem)',
                                 fontWeight: 'bold',
                                 color: 'white',
                                 textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                 whiteSpace: 'nowrap',
                                 maxWidth: '30cqmin',
                                 overflow: 'hidden'
                             }">
                             {{ name }}
                        </div>
                    </div>
                </div>
                
                <div style="height: 35px; width: 100%; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
                    <div v-if="anzeigeName && !isSpinning" 
                         style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; border-radius: 6px; padding: 4px 12px; text-align: center; font-size: clamp(0.9rem, 4.5cqmin, 1.3rem); font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.5); max-width: 95%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        🎉 {{ anzeigeName }} 🎉
                    </div>
                </div>
            </div>

            <div v-if="showSettings" style="flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0;">
                <div style="display: flex; gap: 5px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 8px;">
                    <button @click="widgetData.modus = 'rad'" :style="{ flex: 1, padding: '6px', fontSize: '0.85rem', background: currentModus === 'rad' ? 'var(--button-color)' : 'transparent', color: 'var(--text-color)', border: 'none', borderRadius: '4px', cursor: 'pointer' }">🎡 Rad</button>
                    <button @click="widgetData.modus = 'text'" :style="{ flex: 1, padding: '6px', fontSize: '0.85rem', background: currentModus === 'text' ? 'var(--button-color)' : 'transparent', color: 'var(--text-color)', border: 'none', borderRadius: '4px', cursor: 'pointer' }">🔤 Text</button>
                </div>
                <textarea v-model="schuelerListe" 
                          style="flex: 1; width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: var(--text-color); border-radius: 8px; padding: 10px; resize: none; font-family: inherit; outline: none;"
                          placeholder="Namen hier rein..."></textarea>
            </div>

            <div v-if="!showSettings" 
                 :style="{ 
                    opacity: (widgetData.isTransparent && !isHovered) ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                 }"
                 style="display:flex; gap:8px; align-items: stretch; margin-top: auto;">
                <button @click="spin" style="flex: 1; height: 32px; background: var(--button-color); color: var(--text-color); border: none; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" :disabled="isSpinning">🎲 Zufall</button>
                <button @click="showSettings = true" style="width: 36px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: var(--text-color); border-radius: 6px; cursor: pointer;">
                    ⚙️
                </button>
            </div>
            <div v-else style="display:flex; margin-top: auto;">
                <button @click="closeSettings" style="flex:1; height: 32px; background: var(--button-color); color: var(--text-color); border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">✅ Speichern</button>
            </div>
        </div>
    `,
    data() {
        return {
            schuelerListe: this.widgetData.schuelerListe || '',
            anzeigeName: '',
            isSpinning: false,
            showSettings: false,
            wheelRotation: 0,
            isHovered: false
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