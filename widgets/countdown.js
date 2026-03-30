const CountdownWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            
            <div v-if="!isRunning && timeLeft === 0" style="display: flex; gap: 3cqw; align-items: center; z-index: 10;">
                <input type="number" v-model.number="eingabeMinuten" min="1" max="99" style="width: 25cqw; min-width: 60px; font-size: clamp(1.2rem, 8cqw, 3.5rem); padding: 1cqw; text-align: center; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                <span style="font-size: clamp(1.2rem, 6cqw, 2.5rem); color: rgba(255,255,255,0.7);">min</span>
            </div>

            <div v-else style="width: 90cqw; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5cqh;">
                
                <div style="font-size: clamp(2rem, 14cqw, 9rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 4px 10px rgba(0,0,0,0.6); line-height: 1.1; color: white;">
                    {{ formatTime(timeLeft) }}
                </div>
                
                <div style="width: 100%; height: clamp(24px, 14cqh, 80px); background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; box-shadow: inset 0 4px 10px rgba(0,0,0,0.7);">
                    <div :style="{ 
                        width: barWidth + '%', 
                        backgroundColor: barColor, 
                        height: '100%', 
                        transition: 'width 1s linear, background-color 0.5s ease',
                        boxShadow: '0 0 4cqw ' + barColor 
                    }"></div>
                </div>
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
    // Lauscht auf Signale aus der board.html
    watch: {
        'widgetData.isRunning'(newVal) {
            this.isRunning = newVal;
            if (newVal) {
                this.tick();
            } else {
                clearInterval(this.timerInterval);
            }
        },
        'widgetData.resetTrigger'() {
            this.resetTimer();
        },
        // NEU: Hört auf den Start-Befehl von oben
        'widgetData.startTrigger'() {
            this.startTimer();
        }
    },
    computed: {
        barWidth() {
            if (this.totalTime === 0) return 0;
            return (this.timeLeft / this.totalTime) * 100;
        },
        barColor() {
            const fraction = this.timeLeft / this.totalTime;
            if (fraction > 0.5) return '#3b82f6';
            if (fraction > 0.2) return '#fbbf24';
            return '#ef4444';
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