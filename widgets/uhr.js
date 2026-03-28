const UhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; overflow: hidden;">
            
            <div style="font-size: clamp(1rem, 15cqw, 4rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                {{ zeit }}
            </div>
            
            <svg viewBox="0 0 100 100" style="width: 50cqmin; height: 50cqmin; max-width: 100%; max-height: 100%; filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.4));">
                
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
        // Formatiert die Zeit als Text (z.B. 14:35:12)
        zeit() {
            return this.jetzt.toLocaleTimeString('de-DE');
        },
        // Berechnet die Winkel für die Zeiger (360 Grad Kreis)
        stundenWinkel() {
            const stunden = this.jetzt.getHours() % 12;
            const minuten = this.jetzt.getMinutes();
            return (stunden * 30) + (minuten * 0.5); // 30° pro Stunde + leichter Vorschub durch Minuten
        },
        minutenWinkel() {
            const minuten = this.jetzt.getMinutes();
            const sekunden = this.jetzt.getSeconds();
            return (minuten * 6) + (sekunden * 0.1); // 6° pro Minute + sanfter Vorschub durch Sekunden
        },
        sekundenWinkel() {
            return this.jetzt.getSeconds() * 6; // 6° pro Sekunde
        }
    },
    mounted() {
        // Aktualisiert das Daten-Objekt "jetzt" jede Sekunde
        this.timer = setInterval(() => {
            this.jetzt = new Date();
        }, 1000);
    },
    unmounted() {
        clearInterval(this.timer);
    }
};