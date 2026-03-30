const StoppuhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; container-type: size; position: relative;">
            
            <div v-show="!widgetData.isTransparent" 
                 style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 5px; flex-shrink: 0; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 8px; z-index: 10;">
                
                <button @click="reset" @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.9rem;">
                    ⏹️ Reset
                </button>

                <button @click="toggle" @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.9rem;">
                    {{ isRunning ? '⏸️ Pause' : '▶️ Start' }}
                </button>
            </div>

            <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
                <div :style="{ 
                        fontSize: '20cqw', 
                        fontWeight: 'bold', 
                        fontFamily: 'monospace',
                        color: isRunning ? '#60a5fa' : '#ffffff',
                        textShadow: widgetData.isTransparent ? '2px 2px 10px rgba(0,0,0,0.8)' : 'none'
                     }">
                    {{ formatTime(elapsed) }}
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            isRunning: false,
            elapsed: 0,
            frame: null
        }
    },
    mounted() {
        // Lade gespeicherten Zustand
        if (this.widgetData.isRunning) {
            this.isRunning = true;
            this.startLoop();
        } else if (this.widgetData.elapsed) {
            this.elapsed = this.widgetData.elapsed;
        }
    },
    methods: {
        toggle() {
            if (this.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        },
        start() {
            this.isRunning = true;
            // Falls neu gestartet wird, initialisiere den Zeitstempel
            if (!this.widgetData.startTimestamp) {
                this.widgetData.startTimestamp = Date.now() - this.elapsed;
            } else {
                this.widgetData.startTimestamp = Date.now() - this.elapsed;
            }
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