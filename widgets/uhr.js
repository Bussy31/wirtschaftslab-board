const UhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="position: relative; container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
            
            <button @click="toggleModus" style="position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 8px; cursor: pointer; color: white; font-size: 1rem; transition: background 0.2s; z-index: 10;" title="Ansicht wechseln">
                {{ widgetData.isAnalog ? kurzeZeit : '⌚' }}
            </button>

            <div v-if="!widgetData.isAnalog" style="font-size: clamp(1.5rem, 18cqw, 6rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                {{ zeit }}
            </div>
            
            <svg v-else viewBox="0 0 100 100" style="width: 80cqmin; height: 80cqmin; max-width: 100%; max-height: 100%; filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.4));">
                <circle cx="50" cy="50" r="48" fill="rgba(30, 41, 59, 0.8)" stroke="#3b82f6" stroke-width="2"/>
                <line v-for="n in 12" :key="n" x1="50" y1="6" x2="50" y2="12" stroke="#94a3b8" stroke-width="2" :transform="'rotate(' + (n * 30) + ' 50 50)'" />
                <line x1="50" y1="50" x2="50" y2="25" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" :transform="'rotate(' + stundenWinkel + ' 50 50)'" />
                <line x1="50" y1="50" x2="50" y2="12" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round" :transform="'rotate(' + minutenWinkel + ' 50 50)'" />
                <line x1="50" y1="50" x2="50" y2="10" stroke="#ef4444" stroke-width="1" stroke-linecap="round" :transform="'rotate(' + sekundenWinkel + ' 50 50)'" />
                <circle cx="50" cy="50" r="2.5" fill="#ef4444"/>
            </svg>

        </div>
    `,
    data() {
        return {
            jetzt: new Date()
        }
    },
    computed: {
        // Die normale Zeit mit Sekunden für die große Digitaluhr
        zeit() { return this.jetzt.toLocaleTimeString('de-DE'); },

        // NEU: Die kurze Zeit für den Button (nur Stunden und Minuten, z.B. 07:05)
        kurzeZeit() { return this.jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); },

        stundenWinkel() { return ((this.jetzt.getHours() % 12) * 30) + (this.jetzt.getMinutes() * 0.5); },
        minutenWinkel() { return (this.jetzt.getMinutes() * 6) + (this.jetzt.getSeconds() * 0.1); },
        sekundenWinkel() { return this.jetzt.getSeconds() * 6; }
    },
    mounted() {
        if (this.widgetData.isAnalog === undefined) {
            this.widgetData.isAnalog = false;
        }
        this.timer = setInterval(() => {
            this.jetzt = new Date();
        }, 1000);
    },
    unmounted() {
        clearInterval(this.timer);
    },
    methods: {
        toggleModus() {
            this.widgetData.isAnalog = !this.widgetData.isAnalog;
            this.$emit('save');
        }
    }
};