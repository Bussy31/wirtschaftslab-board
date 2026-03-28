const CountdownWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
            
            <div v-if="!isRunning && timeLeft === 0" style="display: flex; gap: 10px; align-items: center; z-index: 10;">
                <input type="number" v-model.number="eingabeMinuten" min="1" max="99" style="width: 70px; font-size: 1.5rem; padding: 4px; text-align: center; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;">
                <span style="font-size: 1.2rem;">min</span>
                <button @click="startTimer" style="background: #10b981; border: none; padding: 8px 16px; border-radius: 8px; color: white; cursor: pointer; font-weight: bold; font-size: 1.1rem;">Start</button>
            </div>

            <div v-else style="position: relative; width: 80cqmin; height: 80cqmin; display: flex; align-items: center; justify-content: center;">
                
                <svg viewBox="0 0 100 100" style="position: absolute; width: 100%; height: 100%; transform: rotate(-90deg);">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
                    <circle cx="50" cy="50" r="45" fill="none" :stroke="ringColor" stroke-width="8" stroke-linecap="round"
                            :stroke-dasharray="283" :stroke-dashoffset="dashOffset" 
                            style="transition: stroke-dashoffset 1s linear, stroke 0.5s;" />
                </svg>
                
                <div style="font-size: clamp(2rem, 15cqw, 4.5rem); font-weight: bold; font-variant-numeric: tabular-nums; z-index: 10;">
                    {{ formatTime(timeLeft) }}
                </div>
            </div>

            <div v-if="timeLeft > 0" style="position: absolute; bottom: 0; display: flex; gap: 10px; z-index: 10;">
                <button @click="togglePause" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 12px; color: white; cursor: pointer;">
                    {{ isRunning ? '⏸ Pause' : '▶ Weiter' }}
                </button>
                <button @click="resetTimer" style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; padding: 4px 12px; color: #fca5a5; cursor: pointer;">
                    ⏹ Stopp
                </button>
            </div>
        </div>
    `,
    data() {
        return {
            eingabeMinuten: 5,
            timeLeft: this.widgetData.timeLeft || 0,
            totalTime: this.widgetData.totalTime || 1,
            isRunning: this.widgetData.isRunning || false,
            timerInterval: null
        }
    },
    computed: {
        // Berechnet, wie weit der Ring "geleert" werden muss
        dashOffset() {
            if (this.totalTime === 0) return 0;
            const fraction = this.timeLeft / this.totalTime;
            return 283 - (fraction * 283); // 283 ist der Umfang des Kreises (2 * pi * r)
        },
        // Ändert die Farbe je nach verbleibender Zeit
        ringColor() {
            const fraction = this.timeLeft / this.totalTime;
            if (fraction > 0.5) return '#34d399'; // Grün (über 50%)
            if (fraction > 0.2) return '#fbbf24'; // Gelb (über 20%)
            return '#ef4444'; // Rot (unter 20%)
        }
    },
    mounted() {
        if (this.isRunning) this.tick(); // Lässt Timer nach Neuladen der Seite weiterlaufen
    },
    unmounted() {
        clearInterval(this.timerInterval);
    },
    methods: {
        startTimer() {
            if (this.eingabeMinuten <= 0) return;
            this.totalTime = this.eingabeMinuten * 60;
            this.timeLeft = this.totalTime;
            this.isRunning = true;
            this.saveState();
            this.tick();
        },
        togglePause() {
            this.isRunning = !this.isRunning;
            this.saveState();
            if (this.isRunning) this.tick();
            else clearInterval(this.timerInterval);
        },
        resetTimer() {
            clearInterval(this.timerInterval);
            this.isRunning = false;
            this.timeLeft = 0;
            this.saveState();
        },
        tick() {
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                if (!this.isRunning) {
                    clearInterval(this.timerInterval);
                    return;
                }
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    this.saveState(); // Speichert jede Sekunde für den Fall, dass man F5 drückt
                } else {
                    this.isRunning = false;
                    clearInterval(this.timerInterval);
                    this.saveState();
                }
            }, 1000);
        },
        formatTime(seconds) {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        },
        saveState() {
            this.widgetData.timeLeft = this.timeLeft;
            this.widgetData.totalTime = this.totalTime;
            this.widgetData.isRunning = this.isRunning;
            this.$emit('save');
        }
    }
};