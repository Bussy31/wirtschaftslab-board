const CountdownWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            
            <div v-if="!isRunning && timeLeft === 0" style="display: flex; gap: 10px; align-items: center; z-index: 10;">
                <input type="number" v-model.number="eingabeMinuten" min="1" max="99" style="width: 70px; font-size: 1.5rem; padding: 4px; text-align: center; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;">
                <span style="font-size: 1.2rem;">min</span>
                <button @click="startTimer" style="background: #10b981; border: none; padding: 8px 16px; border-radius: 8px; color: white; cursor: pointer; font-weight: bold; font-size: 1.1rem;">Start</button>
            </div>

            <div v-else style="width: 85%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px;">
                
                <div style="font-size: clamp(2rem, 18cqw, 5rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                    {{ formatTime(timeLeft) }}
                </div>
                
                <div style="width: 100%; height: 24px; background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);">
                    <div :style="{ 
                        width: barWidth + '%', 
                        backgroundColor: barColor, 
                        height: '100%', 
                        transition: 'width 1s linear, background-color 0.5s ease',
                        boxShadow: '0 0 10px ' + barColor
                    }"></div>
                </div>
            </div>

            <div v-if="timeLeft > 0" style="margin-top: 20px; display: flex; gap: 10px; z-index: 10;">
                <button @click="togglePause" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 6px 16px; color: white; cursor: pointer; font-size: 1.1rem;">
                    {{ isRunning ? '⏸ Pause' : '▶ Weiter' }}
                </button>
                <button @click="resetTimer" style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; padding: 6px 16px; color: #fca5a5; cursor: pointer; font-size: 1.1rem;">
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
        // Berechnet die Breite des Balkens in Prozent
        barWidth() {
            if (this.totalTime === 0) return 0;
            return (this.timeLeft / this.totalTime) * 100;
        },
        // Bestimmt die Farbe des Balkens je nach verbleibender Zeit
        barColor() {
            const fraction = this.timeLeft / this.totalTime;
            if (fraction > 0.5) return '#34d399'; // Grün
            if (fraction > 0.2) return '#fbbf24'; // Gelb
            return '#ef4444'; // Rot
        }
    },
    mounted() { if (this.isRunning) this.tick(); },
    unmounted() { clearInterval(this.timerInterval); },
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
                if (!this.isRunning) return clearInterval(this.timerInterval);
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    this.saveState();
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