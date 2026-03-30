const UhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="position: relative; container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
            
            <div v-if="!widgetData.isAnalog" style="font-size: clamp(1.5rem, 18cqw, 6rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                {{ zeit }}
            </div>
            
            <svg v-else viewBox="0 0 100 100" style="width: 80cqmin; height: 80cqmin; max-width: 100%; max-height: 100%; filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.4)); font-family: 'Inter', sans-serif;">
                <circle cx="50" cy="50" r="48" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.0"/>
                
                <text x="50" y="18" fill="#fafafa" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central">12</text>
                <text x="82" y="50" fill="#fafafa" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central">3</text>
                <text x="50" y="82" fill="#fafafa" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central">6</text>
                <text x="18" y="50" fill="#fafafa" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central">9</text>
                
                <line x1="50" y1="50" x2="50" y2="28" stroke="#fafafa" stroke-width="3" stroke-linecap="round" :transform="'rotate(' + stundenWinkel + ' 50 50)'" />
                
                <line x1="50" y1="50" x2="50" y2="12" stroke="#fafafa" stroke-width="2" stroke-linecap="round" :transform="'rotate(' + minutenWinkel + ' 50 50)'" />
                
                <line x1="50" y1="58" x2="50" y2="10" stroke="#f97316" stroke-width="1.0" stroke-linecap="round" :transform="'rotate(' + sekundenWinkel + ' 50 50)'" />
                
                <circle cx="50" cy="50" r="2.5" fill="#fafafa"/>
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