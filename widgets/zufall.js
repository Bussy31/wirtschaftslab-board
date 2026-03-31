const ZufallWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 5px; gap: 10px; box-sizing: border-box;">
            
            <div v-if="!showSettings && modus === 'text'" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
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
                    Bereit für die Ziehung...
                </div>
            </div>

            <div v-if="!showSettings && modus === 'rad'" style="flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                
                <div style="position: relative; width: 60cqmin; height: 60cqmin; margin: 0 auto 10px auto;">
                    
                    <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); z-index: 10; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 20px solid white; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8));"></div>
                    
                    <div :style="{
                        width: '100%', height: '100%',
                        borderRadius: '50%',
                        background: wheelGradient,
                        transform: 'rotate(' + wheelRotation + 'deg)',
                        transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        border: '2px solid rgba(255,255,255,0.2)'
                    }">
                        <div v-for="(name, i) in namenList" :key="i"
                             :style="{
                                 position: 'absolute',
                                 top: '50%', left: '50%',
                                 transform: 'translate(-50%, -50%) rotate(' + ((i * 360 / namenList.length) + (180 / Math.max(1, namenList.length))) + 'deg) translateY(-20cqmin)',
                                 transformOrigin: 'center center',
                                 fontSize: 'clamp(0.6rem, 3.5cqmin, 1.2rem)',
                                 fontWeight: 'bold',
                                 color: 'white',
                                 textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                                 whiteSpace: 'nowrap',
                                 maxWidth: '25cqmin',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis'
                             }">
                             {{ name }}
                        </div>
                    </div>
                </div>
                
                <div style="height: 2cqmin; min-height: 30px; display: flex; align-items: center; justify-content: center;">
                    <div v-if="anzeigeName && !isSpinning" style="font-size: clamp(1rem, 5cqmin, 2rem); font-weight: bold; color: #34d399; text-shadow: 0 2px 4px rgba(0,0,0,0.5); text-align: center; animation: popIn 0.3s ease-out;">
                        🎉 {{ anzeigeName }} 🎉
                    </div>
                </div>
            </div>

            <div v-if="showSettings" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
                <label style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 5px;">Namen (einer pro Zeile):</label>
                <textarea v-model="schuelerListe" 
                          style="flex: 1; width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 4px; padding: 5px; resize: none; font-family: inherit; font-size: 0.9rem;"
                          placeholder="Max&#10;Anna&#10;Leon..."></textarea>
            </div>

            <div v-if="!showSettings" style="display:flex; gap:5px; margin-top: auto; z-index: 10;">
                <button @click="spin" class="btn-primary" style="flex:1;" :disabled="isSpinning">Zufall</button>
                <button @click="toggleModus" class="btn-secondary" title="Modus wechseln" style="width: 40px;">
                    {{ modus === 'text' ? '🎡' : '📝' }}
                </button>
                <button @click="showSettings = true" class="btn-secondary" style="width: 40px;">⚙️</button>
            </div>
            <div v-else style="display:flex; margin-top: auto;">
                <button @click="closeSettings" class="btn-primary" style="flex:1;">Speichern</button>
            </div>
        </div>
    `,
    data() {
        return {
            schuelerListe: this.widgetData.schuelerListe || '',
            anzeigeName: '',
            isSpinning: false,
            showSettings: false,
            modus: this.widgetData.modus || 'rad', // Standardmäßig jetzt Rad!
            wheelRotation: 0 // Speichert den aktuellen Drehwinkel des Rades
        };
    },
    computed: {
        namenList() {
            return this.schuelerListe.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        },
        wheelGradient() {
            const namen = this.namenList;
            if (namen.length === 0) return 'conic-gradient(gray 0%, gray 100%)';

            // Schöne Farben für die Tortenstücke
            const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];
            const step = 100 / Math.max(1, namen.length);
            let grad = [];

            for(let i = 0; i < namen.length; i++) {
                const color = colors[i % colors.length];
                grad.push(`${color} ${i * step}% ${(i+1) * step}%`);
            }
            return `conic-gradient(${grad.join(', ')})`;
        }
    },
    methods: {
        getNamen() {
            return this.namenList;
        },
        toggleModus() {
            if (this.isSpinning) return;
            this.modus = this.modus === 'text' ? 'rad' : 'text';
            this.anzeigeName = '';
            this.saveState();
        },
        spin() {
            const namen = this.getNamen();
            if (namen.length === 0) return;

            this.isSpinning = true;

            if (this.modus === 'text') {
                // ALTE LOGIK: Text-Slotmachine
                this.anzeigeName = '';
                let duration = 4000;
                let startTime = Date.now();
                let currentDelay = 50;

                const spinTick = () => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    this.anzeigeName = namen[Math.floor(Math.random() * namen.length)];

                    if (elapsed < duration) {
                        let progress = elapsed / duration;
                        currentDelay = 50 + (progress * progress * 500);
                        setTimeout(spinTick, currentDelay);
                    } else {
                        this.isSpinning = false;
                        this.anzeigeName = namen[Math.floor(Math.random() * namen.length)];
                    }
                };
                spinTick();
            } else {
                // NEUE LOGIK: Glücksrad drehen
                this.anzeigeName = '';
                const num = namen.length;
                const sliceAngle = 360 / num;

                // Wir drehen das Rad um mindestens 5 volle Umdrehungen (1800 Grad) + zufälliger Winkel
                const extraSpins = 360 * 5;
                const randomOffset = Math.floor(Math.random() * 360);

                this.wheelRotation += extraSpins + randomOffset;

                // Warten, bis die CSS-Animation (4 Sekunden) fertig ist, dann Gewinner berechnen
                setTimeout(() => {
                    this.isSpinning = false;

                    // Rechnet aus, welches Stück am Ende genau oben (unter dem Pfeil) steht
                    const finalAngle = (360 - (this.wheelRotation % 360)) % 360;
                    const index = Math.floor(finalAngle / sliceAngle);

                    this.anzeigeName = namen[index];
                }, 4000); // 4000 Millisekunden = 4 Sekunden (muss zur CSS-Transition passen)
            }
        },
        closeSettings() {
            this.showSettings = false;
            this.saveState();
        },
        saveState() {
            this.widgetData.schuelerListe = this.schuelerListe;
            this.widgetData.modus = this.modus;
            this.$emit('save');
        }
    }
};