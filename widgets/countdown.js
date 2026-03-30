const CountdownWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; container-type: size; position: relative;">
            
            <div v-show="!widgetData.isTransparent" 
                 style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 5px; flex-shrink: 0; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 8px; z-index: 10;">
                
                <button @click="resetTimer" @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.9rem;">
                    ⏹️ Reset
                </button>

                <button @click="toggleTimer" @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.9rem;">
                    {{ isRunning ? '⏸️ Pause' : '▶️ Start' }}
                </button>
            </div>

            <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
                
                <div v-if="!isRunning && timeLeft === 0" style="display: flex; gap: 10px; align-items: center;">
                    <input type="number" v-model.number="eingabeMinuten" min="1" max="99" 
                           @mousedown.stop @touchstart.stop
                           style="width: 80px; font-size: 2.5rem; padding: 5px; text-align: center; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;">
                    <span style="font-size: 1.5rem; color: rgba(255,255,255,0.7);">min</span>
                </div>

                <div v-else :style="{ 
                        fontSize: '25cqw', 
                        fontWeight: 'bold', 
                        fontFamily: 'monospace',
                        color: timeLeft <= 10 ? '#ef4444' : '#ffffff',
                        textShadow: widgetData.isTransparent ? '2px 2px 10px rgba(0,0,0,0.8)' : 'none'
                     }">
                    {{ formatTime(timeLeft) }}
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            eingabeMinuten: this.widgetData.eingabeMinuten || 5,
            timeLeft: this.widgetData.timeLeft || 0,
            totalTime: this.widgetData.totalTime || 0,
            isRunning: this.widgetData.isRunning || false,
            timerInterval: null
        }
    },
    watch: {
        eingabeMinuten(val) {
            this.widgetData.eingabeMinuten = val;
            this.$emit('save');
        }
    },
    mounted() {
        if (this.isRunning) {
            this.tick();
        }
    },
    methods: {
        toggleTimer() {
            if (this.isRunning) {
                // Pause
                this.isRunning = false;
                clearInterval(this.timerInterval);
                this.saveState();
            } else {
                // Start / Weiterlaufen
                if (this.timeLeft === 0) {
                    if (this.eingabeMinuten <= 0) return;
                    this.totalTime = this.eingabeMinuten * 60;
                    this.timeLeft = this.totalTime;
                }
                this.isRunning = true;
                this.saveState();
                this.tick();
            }
        },
        resetTimer() {
            clearInterval(this.timerInterval);
            this.isRunning = false;
            this.timeLeft = 0; // Setzt auf 0, damit das Eingabefeld wieder erscheint
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