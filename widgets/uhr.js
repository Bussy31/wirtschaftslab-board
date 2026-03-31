const UhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="position: relative; container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
            
            <div v-if="!widgetData.isAnalog" :style="{ color: currentTheme.text }" style="font-size: clamp(1.5rem, 18cqw, 6rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 2px 5px rgba(0,0,0,0.5); transition: color 0.3s ease;">
                {{ zeit }}
            </div>
            
            <svg v-else viewBox="0 0 100 100" style="width: 80cqmin; height: 80cqmin; max-width: 100%; max-height: 100%; filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.4)); font-family: 'Inter', sans-serif;">
                <circle cx="50" cy="50" r="48" :fill="currentTheme.bg" :stroke="currentTheme.border" stroke-width="1.5" style="transition: all 0.3s ease;"/>
                
                <g v-if="!widgetData.isTransparent" style="user-select: none;">
                    <text @click.stop="prevTheme" x="32" y="52" :fill="currentTheme.text" 
                          style="cursor: pointer; font-size: 8px; opacity: 0.2; transition: opacity 0.2s;" 
                          onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.2">◀</text>
                    <text @click.stop="nextTheme" x="60" y="54" :fill="currentTheme.text" 
                          style="cursor: pointer; font-size: 8px; opacity: 0.2; transition: opacity 0.2s;" 
                          onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.2">▶</text>
                </g>

                <line v-for="n in 12" :key="'strich-'+n" v-show="n % 3 !== 0" x1="50" y1="6" x2="50" y2="12" :stroke="currentTheme.marks" stroke-width="2" stroke-linecap="round" :transform="'rotate(' + (n * 30) + ' 50 50)'" style="transition: stroke 0.3s ease;" />
                
                <text x="50" y="11" :fill="currentTheme.text" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" style="transition: fill 0.3s ease;">12</text>
                <text x="89" y="50" :fill="currentTheme.text" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" style="transition: fill 0.3s ease;">3</text>
                <text x="50" y="90" :fill="currentTheme.text" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" style="transition: fill 0.3s ease;">6</text>
                <text x="11" y="50" :fill="currentTheme.text" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" style="transition: fill 0.3s ease;">9</text>
                
                <line x1="50" y1="50" x2="50" y2="28" :stroke="currentTheme.hours" stroke-width="3" stroke-linecap="round" :transform="'rotate(' + stundenWinkel + ' 50 50)'" style="transition: stroke 0.3s ease;" />
                
                <line x1="50" y1="50" x2="50" y2="12" :stroke="currentTheme.minutes" stroke-width="2" stroke-linecap="round" :transform="'rotate(' + minutenWinkel + ' 50 50)'" style="transition: stroke 0.3s ease;" />
                
                <line x1="50" y1="58" x2="50" y2="10" :stroke="currentTheme.seconds" stroke-width="1.0" stroke-linecap="round" :transform="'rotate(' + sekundenWinkel + ' 50 50)'" />
                
                <circle cx="50" cy="50" r="2.5" :fill="currentTheme.hours" style="transition: fill 0.3s ease;"/>
            </svg>

        </div>
    `,
    data() {
        return {
            jetzt: new Date(),
            themes: [
                { name: 'Standard', bg: 'rgba(30, 41, 59, 0.85)', border: '#3b82f6', text: '#f8fafc', hours: '#ffffff', minutes: '#ffffff', seconds: '#f97316', marks: '#94a3b8' },
                { name: 'Dark Minimal', bg: '#121212', border: '#333333', text: '#ffffff', hours: '#ffffff', minutes: '#a3a3a3', seconds: '#ef4444', marks: '#525252' },
                { name: 'Light Clean', bg: '#ffffff', border: '#e5e7eb', text: '#111827', hours: '#1f2937', minutes: '#4b5563', seconds: '#ef4444', marks: '#d1d5db' },
                { name: 'Neon Green', bg: '#064e3b', border: '#10b981', text: '#a7f3d0', hours: '#34d399', minutes: '#6ee7b7', seconds: '#fbbf24', marks: '#059669' },
                { name: 'Cyberpunk', bg: '#2e1065', border: '#d946ef', text: '#06b6d4', hours: '#f0abfc', minutes: '#22d3ee', seconds: '#fde047', marks: '#a21caf' },
                { name: 'Gold Luxury', bg: '#27272a', border: '#fbbf24', text: '#fef3c7', hours: '#fcd34d', minutes: '#fde047', seconds: '#ef4444', marks: '#b45309' },
                { name: 'Ocean', bg: '#083344', border: '#0ea5e9', text: '#e0f2fe', hours: '#7dd3fc', minutes: '#38bdf8', seconds: '#fde047', marks: '#0284c7' },
                { name: 'Sunset', bg: '#7c2d12', border: '#f97316', text: '#ffedd5', hours: '#fdba74', minutes: '#fb923c', seconds: '#fde047', marks: '#ea580c' },
                { name: 'Mint', bg: '#022c22', border: '#14b8a6', text: '#ccfbf1', hours: '#5eead4', minutes: '#2dd4bf', seconds: '#f43f5e', marks: '#0d9488' },
                { name: 'Hacker', bg: '#000000', border: '#22c55e', text: '#4ade80', hours: '#22c55e', minutes: '#16a34a', seconds: '#15803d', marks: '#14532d' }
            ]
        }
    },
    computed: {
        zeit() { return this.jetzt.toLocaleTimeString('de-DE'); },
        stundenWinkel() { return ((this.jetzt.getHours() % 12) * 30) + (this.jetzt.getMinutes() * 0.5); },
        minutenWinkel() { return (this.jetzt.getMinutes() * 6) + (this.jetzt.getSeconds() * 0.1); },
        sekundenWinkel() { return this.jetzt.getSeconds() * 6; },
        currentTheme() {
            const index = this.widgetData.themeIndex || 0;
            return this.themes[index % this.themes.length];
        }
    },
    methods: {
        nextTheme() {
            this.widgetData.themeIndex = ((this.widgetData.themeIndex || 0) + 1) % this.themes.length;
            this.$emit('save');
        },
        prevTheme() {
            const current = this.widgetData.themeIndex || 0;
            this.widgetData.themeIndex = (current - 1 + this.themes.length) % this.themes.length;
            this.$emit('save');
        }
    },
    mounted() {
        if (this.widgetData.themeIndex === undefined) this.widgetData.themeIndex = 0;
        this.timer = setInterval(() => { this.jetzt = new Date(); }, 1000);
    },
    unmounted() { clearInterval(this.timer); }
};