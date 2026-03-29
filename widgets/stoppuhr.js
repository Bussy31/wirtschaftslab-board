const StoppuhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            
            <div style="font-size: clamp(2rem, 15cqw, 5rem); font-weight: bold; font-variant-numeric: tabular-nums; text-shadow: 0 2px 5px rgba(0,0,0,0.5); margin-bottom: 20px;">
                {{ formatTime(elapsed) }}
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button v-if="!isRunning" @click="start" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 6px; padding: 6px 16px; color: #34d399; cursor: pointer; font-size: 1.1rem;">
                    ▶ Start
                </button>
                <button v-else @click="pause" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 6px 16px; color: white; cursor: pointer; font-size: 1.1rem;">
                    ⏸ Pause
                </button>
                <button @click="reset" style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; padding: 6px 16px; color: #fca5a5; cursor: pointer; font-size: 1.1rem;">
                    ⏹ Reset
                </button>
            </div>

        </div>
    `,
    data() {
        return {
            isRunning: this.widgetData.isRunning || false,
            elapsed: this.widgetData.elapsed || 0,
            frame: null
        }
    },
    mounted() {
        // Wenn die Stoppuhr lief und wir einen Start-Zeitstempel haben, berechne die exakte Zeit!
        if (this.isRunning && this.widgetData.startTimestamp) {
            this.elapsed = Date.now() - this.widgetData.startTimestamp;
            this.startLoop();
        }
    },
    unmounted() {
        cancelAnimationFrame(this.frame);
    },
    methods: {
        start() {
            this.isRunning = true;
            // Wir merken uns den exakten Start-Moment in der Zeit (abzüglich der Zeit, die schon lief)
            this.widgetData.startTimestamp = Date.now() - this.elapsed;
            this.startLoop();
            this.save();
        },
        pause() {
            this.isRunning = false;
            cancelAnimationFrame(this.frame);
            this.save();
        },
        reset() {
            this.isRunning = false;
            cancelAnimationFrame(this.frame);
            this.elapsed = 0;
            this.widgetData.startTimestamp = null;
            this.save();
        },
        startLoop() {
            const step = () => {
                if (!this.isRunning) return;
                // Wir berechnen die Zeit immer relativ zum Start-Zeitstempel -> Perfekte Genauigkeit auch bei Refresh!
                this.elapsed = Date.now() - this.widgetData.startTimestamp;
                this.frame = requestAnimationFrame(step);
            };
            this.frame = requestAnimationFrame(step);
        },
        formatTime(ms) {
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const seconds = (totalSeconds % 60).toString().padStart(2, '0');
            const centiseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
            return `${minutes}:${seconds}.${centiseconds}`;
        },
        save() {
            this.widgetData.isRunning = this.isRunning;
            this.widgetData.elapsed = this.elapsed;
            this.$emit('save');
        }
    }
};