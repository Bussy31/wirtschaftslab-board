const UhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="position: relative; container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
            
            <div v-if="!widgetData.isAnalog" style="font-size: clamp(1.5rem, 18cqw, 6rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                {{ zeit }}
            </div>
            
            <svg v-else viewBox="0 0 100 100" style="width: 80cqmin; height: 80cqmin; max-width: 100%; max-height: 100%; filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.4));">
                <circle cx="50" cy="50" r="48" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5"/>
                
                <line v-for="n in 4" :key="n" x1="50" y1="6" x2="50" y2="14" stroke="#ffffff" stroke-width="3" stroke-linecap="round" :transform="'rotate(' + (n * 90) + ' 50 50)'" />
                
                <line x1="50" y1="50" x2="50" y2="26" stroke="#ffffff" stroke-width="4" stroke-linecap="round" :transform="'rotate(' + stundenWinkel + ' 50 50)'" />
                
                <line x1="50" y1="50" x2="50" y2="12" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" :transform="'rotate(' + minutenWinkel + ' 50 50)'" />
                
                <line x1="50" y1="58" x2="50" y2="10" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" :transform="'rotate(' + sekundenWinkel + ' 50 50)'" />
                
                <circle cx="50" cy="50" r="3.5" fill="#ffffff"/>
                <circle cx="50" cy="50" r="1.5" fill="#f97316"/>
            </svg>

        </div>
    `,
    data() { return { jetzt: new Date() } },
    computed: {
        zeit() { return this.jetzt.toLocaleTimeString('de-DE'); },
        stundenWinkel() { return ((this.jetzt.getHours() % 12) * 30) + (this.jetzt.getMinutes() * 0.5); },
        minutenWinkel() { return (this.jetzt.getMinutes() * 6) + (this.jetzt.getSeconds() * 0.1); },
        sekundenWinkel() { return this.jetzt.getSeconds() * 6; }
    },
    mounted() {
        if (this.widgetData.isAnalog === undefined) this.widgetData.isAnalog = false;
        this.timer = setInterval(() => { this.jetzt = new Date(); }, 1000);
    },
    unmounted() { clearInterval(this.timer); }
};