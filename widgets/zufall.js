const ZufallWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 5px; gap: 10px; box-sizing: border-box;">
            
            <div v-if="gewinner" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 10px; text-align: center; font-size: clamp(1.2rem, 10cqw, 3rem); font-weight: bold; color: #34d399; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                🎉 {{ gewinner }} 🎉
            </div>

            <textarea 
                v-model="schuelerListe" 
                @input="saveState"
                placeholder="Namen eintragen (einer pro Zeile)..." 
                style="flex: 1; min-height: 60px; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px; resize: none; font-family: inherit; font-size: 1rem;">
            </textarea>

            <button @click="zieheZufall" style="background: #3b82f6; border: none; padding: 12px; border-radius: 8px; color: white; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background 0.2s;">
                🎲 Zufällig ziehen
            </button>
        </div>
    `,
    data() {
        return {
            schuelerListe: this.widgetData.schuelerListe || '',
            gewinner: null
        }
    },
    methods: {
        zieheZufall() {
            // Liste aufteilen, leere Zeilen und Leerzeichen filtern
            const namen = this.schuelerListe.split('\n').map(n => n.trim()).filter(n => n !== '');

            if (namen.length === 0) {
                this.gewinner = "Leere Liste!";
                return;
            }

            // Zufälligen Index auswählen
            const randomIndex = Math.floor(Math.random() * namen.length);
            this.gewinner = namen[randomIndex];
        },
        saveState() {
            this.widgetData.schuelerListe = this.schuelerListe;
            this.$emit('save');
        }
    }
};