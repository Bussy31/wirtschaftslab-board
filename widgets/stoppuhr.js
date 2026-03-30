const StoppuhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; container-type: size; position: relative;">
            
            <div v-show="!widgetData.isTransparent" 
                 style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 5px; flex-shrink: 0; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 8px;">
                
                <button @click="reset" @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; width: 30px; height: 24px; cursor: pointer; font-size: 0.8rem;">⏹️</button>

                <button v-if="!isRunning" @click="start" @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; width: 40px; height: 24px; cursor: pointer; font-size: 0.8rem;">▶️</button>
                <button v-else @click="stop" @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; width: 40px; height: 24px; cursor: pointer; font-size: 0.8rem;">⏸️</button>

                <div style="width: 1px; height: 15px; background: rgba(255,255,255,0.2); margin: 0 4px;"></div>

                <button @click="$emit('toggle-transparency')" @mousedown.stop @touchstart.stop
                        style="background: transparent; border: none; cursor: pointer; font-size: 1rem;" title="Transparenz">👻</button>
                <button @click="$emit('edit')" @mousedown.stop @touchstart.stop
                        style="background: transparent; border: none; cursor: pointer; font-size: 1rem;" title="Einstellungen">⚙️</button>
            </div>

            <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
                <div :style="{ 
                        fontSize: '25cqw', 
                        fontWeight: '800', 
                        fontFamily: 'monospace',
                        color: isRunning ? '#60a5fa' : '#ffffff',
                        textShadow: widgetData.isTransparent ? '2px 2px 10px rgba(0,0,0,0.8)' : 'none'
                     }">
                    {{ formatTime(time) }}
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            time: 0,
            timer: null,
            isRunning: false
        }
    },
    methods: {
        formatTime(ms) {
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const centiseconds = Math.floor((ms % 1000) / 10);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${centiseconds.toString().padStart(2, '0')}`;
        },
        start() {
            if (!this.isRunning) {
                this.isRunning = true;
                const startTime = Date.now() - this.time;
                this.timer = setInterval(() => {
                    this.time = Date.now() - startTime;
                }, 10);
            }
        },
        stop() {
            this.isRunning = false;
            clearInterval(this.timer);
        },
        reset() {
            this.stop();
            this.time = 0;
        }
    }
};