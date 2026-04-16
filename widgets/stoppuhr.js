const StoppuhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="container-type: size; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            
            <div :style="{ 
                fontSize: 'clamp(2rem, 18cqw, 8rem)', 
                fontWeight: 'bold', 
                fontVariantNumeric: 'tabular-nums', 
                textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                color: 'var(--text-color)',
                opacity: isRunning ? 1 : 0.7,
                transition: 'all 0.3s ease'
            }">
                {{ formatTime(elapsed) }}
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
    watch: {
        // Reagiert auf Start/Pause von oben
        'widgetData.isRunning'(newVal) {
            this.isRunning = newVal;
            if (newVal) {
                // Zeitstempel berechnen (Aktuelle Zeit minus bereits vergangene Zeit)
                this.widgetData.startTimestamp = Date.now() - this.elapsed;
                this.startLoop();
            } else {
                cancelAnimationFrame(this.frame);
                this.save();
            }
        },
        // Reagiert auf Stopp/Reset von oben
        'widgetData.resetTrigger'() {
            this.reset();
        }
    },
    mounted() {
        if (this.isRunning) {
            this.startLoop();
        }
    },
    unmounted() {
        cancelAnimationFrame(this.frame);
    },
    methods: {
        startLoop() {
            const step = () => {
                if (!this.isRunning) return;
                this.elapsed = Date.now() - this.widgetData.startTimestamp;
                this.frame = requestAnimationFrame(step);
            };
            this.frame = requestAnimationFrame(step);
        },
        reset() {
            this.isRunning = false;
            this.widgetData.isRunning = false;
            cancelAnimationFrame(this.frame);
            this.elapsed = 0;
            this.widgetData.elapsed = 0;
            this.widgetData.startTimestamp = null;
            this.$emit('save');
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