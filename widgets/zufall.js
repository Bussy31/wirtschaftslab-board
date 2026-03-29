const ZufallWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 5px; gap: 10px; box-sizing: border-box;">
            
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

            <textarea 
                v-model="schuelerListe" 
                @input="saveState"
                :disabled="isSpinning"
                placeholder="Namen eintragen (einer pro Zeile)..." 
                style="flex: 1; min-height: 60px; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px; resize: none; font-family: inherit; font-size: 1rem;">
            </textarea>

            <button @click="zieheZufall" :disabled="isSpinning"
                :style="{ background: isSpinning ? '#64748b' : '#3b82f6', cursor: isSpinning ? 'not-allowed' : 'pointer' }"
                style="border: none; padding: 12px; border-radius: 8px; color: white; font-weight: bold; font-size: 1rem; transition: background 0.2s;">
                {{ isSpinning ? 'Trommelwirbel...' : '🎲 Zufällig ziehen' }}
            </button>
        </div>
    `,
    data() {
        return {
            schuelerListe: this.widgetData.schuelerListe || '',
            anzeigeName: null,
            isSpinning: false
        }
    },
    methods: {
        zieheZufall() {
            if (this.isSpinning) return; // Verhindert, dass man während der Animation nochmal klickt

            const namen = this.schuelerListe.split('\n').map(n => n.trim()).filter(n => n !== '');

            if (namen.length === 0) {
                this.anzeigeName = "leer";
                return;
            }

            this.isSpinning = true;

            // Roulette-Logik: Dauer und Geschwindigkeit
            let duration = 4000; // 4 Sekunden Gesamtdauer
            let startTime = Date.now();
            let currentDelay = 50; // Startet extrem schnell (alle 50 Millisekunden ein neuer Name)

            const spin = () => {
                const now = Date.now();
                const elapsed = now - startTime;

                // Zufälligen Namen für diesen "Tick" anzeigen
                const randomIndex = Math.floor(Math.random() * namen.length);
                this.anzeigeName = namen[randomIndex];

                if (elapsed < duration) {
                    // Magie: Berechnet, wie viel der 4 Sekunden schon um sind (0.0 bis 1.0)
                    let progress = elapsed / duration;
                    // Der Delay wird quadratisch größer -> der Slow-Down-Effekt!
                    currentDelay = 50 + (progress * progress * 500);

                    setTimeout(spin, currentDelay);
                } else {
                    // Finale Ziehung!
                    this.isSpinning = false;
                    this.anzeigeName = namen[Math.floor(Math.random() * namen.length)];
                }
            };

            spin(); // Wirft die Maschine an
        },
        saveState() {
            this.widgetData.schuelerListe = this.schuelerListe;
            this.$emit('save');
        }
    }
};