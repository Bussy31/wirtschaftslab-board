const UhrWidget = {
    props: ['widgetData'],
    template: `
        <div style="font-size: 2rem; font-weight: bold; text-align: center; font-variant-numeric: tabular-nums;">
            {{ zeit }}
        </div>
    `,
    data() {
        return { zeit: new Date().toLocaleTimeString('de-DE') }
    },
    mounted() {
        // Aktualisiert die Uhrzeit jede Sekunde, solange das Widget offen ist
        this.timer = setInterval(() => {
            this.zeit = new Date().toLocaleTimeString('de-DE');
        }, 1000);
    },
    unmounted() {
        clearInterval(this.timer);
    }
};