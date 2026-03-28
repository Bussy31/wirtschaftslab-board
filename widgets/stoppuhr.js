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
            elapsed: this.widgetData.elapsed || 0, // Zeit in Millisekunden
            lastTick: Date.now(),
            frame: null
        }
    },
    mounted() {
        // Falls die Seite neu geladen wird und die Stoppuhr lief, direkt weiterlaufen lassen
        if (this.isRunning) {
            this.lastTick = Date.now();
            this.startLoop();
        }
    },
    unmounted() {
        cancelAnimationFrame(this.frame); // Verhindert Hintergrund-Bugs, wenn das Widget gelöscht wird
    },
    methods: {
        start() {
            this.isRunning = true;
            this.lastTick = Date.now();
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
            this.save();
        },
        startLoop() {
            // Eine extrem flüssige Schleife, die an die Bildwiederholrate deines Monitors gekoppelt ist
            const step = () => {
                if (!this.isRunning) return;
                const now = Date.now();
                this.elapsed += (now - this.lastTick);
                this.lastTick = now;
                this.frame = requestAnimationFrame(step);
            };
            this.frame = requestAnimationFrame(step);
        },
        formatTime(ms) {
            // Rechnet die Millisekunden in das Format mm:ss.ms um
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const seconds = (totalSeconds % 60).toString().padStart(2, '0');
            // Wir zeigen nur zwei Stellen der Millisekunden an (Hundertstelsekunden), das liest sich besser
            const centiseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
            return `${minutes}:${seconds}.${centiseconds}`;
        },
        save() {
            // Wir sagen Vue, er soll den Zustand nur alle paar Sekunden speichern,
            // damit der Browser nicht mit 60 Speicherungen pro Sekunde überlastet wird!
            this.widgetData.isRunning = this.isRunning;
            this.widgetData.elapsed = this.elapsed;
            this.$emit('save');
        }
    }
};