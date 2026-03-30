// uhr.js
app.component('uhr-widget', {
    template: `
        <div class="uhr-container" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; position: relative;">
            <svg viewBox="0 0 200 200" style="width: 100%; height: 100%; display: block; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
                
                <circle cx="100" cy="100" r="96" stroke="rgba(255,255,255,0.1)" fill="none" stroke-width="1.5"/>

                <line x1="100" y1="8" x2="100" y2="24" stroke="#fafafa" stroke-width="4" stroke-linecap="round"/> <line x1="192" y1="100" x2="176" y2="100" stroke="#fafafa" stroke-width="4" stroke-linecap="round"/> <line x1="100" y1="192" x2="100" y2="176" stroke="#fafafa" stroke-width="4" stroke-linecap="round"/> <line x1="8" y1="100" x2="24" y2="100" stroke="#fafafa" stroke-width="4" stroke-linecap="round"/> <line class="hour-hand" x1="100" y1="100" x2="100" y2="58" 
                      stroke="#fafafa" stroke-width="7" stroke-linecap="round" 
                      :transform="\'rotate(\' + time.hourRotation + \' 100 100)\'"/>

                <line class="minute-hand" x1="100" y1="100" x2="100" y2="28" 
                      stroke="#fafafa" stroke-width="5" stroke-linecap="round" 
                      :transform="\'rotate(\' + time.minuteRotation + \' 100 100)\'"/>

                <line class="second-hand" x1="100" y1="115" x2="100" y2="18" 
                      stroke="#f97316" stroke-width="2" stroke-linecap="round" 
                      :transform="\'rotate(\' + time.secondRotation + \' 100 100)\'"/>

                <circle cx="100" cy="100" r="7" fill="#fafafa"/>
                <circle cx="100" cy="100" r="3" fill="#ea580c"/> 
            </svg>
        </div>
    `,
    props: ['widgetData'],
    data() {
        return {
            time: {
                hourRotation: 0,
                minuteRotation: 0,
                secondRotation: 0
            },
            interval: null
        };
    },
    mounted() {
        this.updateClock(); // Sofort einmal setzen
        this.interval = setInterval(this.updateClock, 1000);
    },
    unmounted() {
        clearInterval(this.interval);
    },
    methods: {
        updateClock() {
            const now = new Date();
            const sec = now.getSeconds();
            const min = now.getMinutes();
            const hour = now.getHours();

            this.time.secondRotation = (sec * 6); // 360 / 60
            this.time.minuteRotation = (min * 6) + (sec * 0.1); // 360 / 60
            this.time.hourRotation = (hour * 30) + (min * 0.5); // 360 / 12
        }
    }
});