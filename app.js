const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            resizingIndex: null,
            offsetX: 0,
            offsetY: 0,
            initialWidth: 0,
            initialHeight: 0,
            initialX: 0,
            initialY: 0,
            showCloseAllPrompt: false,
            isFullscreen: false,
            aktuelleZeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        }
    },
    mounted() {
        const saved = localStorage.getItem('meinBoard');
        if (saved) {
            this.widgets = JSON.parse(saved);
        }

        window.addEventListener('mousemove', this.onDrag);
        window.addEventListener('mouseup', this.stopDrag);

        document.addEventListener('fullscreenchange', this.onFullscreenChange);

        setInterval(() => {
            this.aktuelleZeit = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    },
    methods: {
        addWidget(type, icon) {
            const isNotiz = type === 'notiz';
            this.widgets.push({
                id: Date.now(),
                type: type,
                icon: icon || '✨',
                x: window.innerWidth / 2 - (isNotiz ? 300 : 150),
                y: 100,
                width: isNotiz ? 600 : 300,
                height: isNotiz ? 400 : 200,
                data: isNotiz ? 'Hier tippen...' : ''
            });
            this.saveToLocal();
        },
        removeWidget(index) {
            this.widgets.splice(index, 1);
            this.saveToLocal();
        },
        startDrag(e, index) {
            // 1. Prüfen: Wurde der Header geklickt?
            const isHeader = e.target.closest('.widget-header');

            // Wenn NICHT der Header geklickt wurde -> sofort abbrechen
            if (!isHeader) return;

            // 2. Sicherheits-Check: Klicks auf das Schließen-X oder Buttons im Header ignorieren
            if (e.target.closest('.close-btn') || e.target.tagName === 'BUTTON') {
                return;
            }

            this.draggingIndex = index;
            const widget = this.widgets[index];
            this.offsetX = e.clientX - widget.x;
            this.offsetY = e.clientY - widget.y;
        },
        onDrag(e) {
            if (this.draggingIndex !== null) {
                const w = this.widgets[this.draggingIndex];

                // 1. Berechne die gewünschte neue Position
                let newX = e.clientX - this.offsetX;
                let newY = e.clientY - this.offsetY;

                // 2. Toolbar-Höhe auslesen, damit wir nicht dahinter rutschen
                const toolbar = document.querySelector('.toolbar');
                const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;

                // 3. Fenster-Grenzen ermitteln
                const maxX = window.innerWidth - w.width;
                const maxY = window.innerHeight - w.height;

                // 4. Begrenzung anwenden (Constraint)

                // Horizontal (Links/Rechts)
                if (newX < 0) newX = 0; // Nicht links raus
                if (newX > maxX) newX = maxX; // Nicht rechts raus

                // Vertikal (Oben/Unten)
                // HIER IST DIE MAGIE: Nicht kleiner als die Toolbar-Höhe!
                if (newY < toolbarHeight) newY = toolbarHeight;
                if (newY > maxY) newY = maxY; // Nicht unten raus

                // 5. Position im Widget speichern
                w.x = newX;
                w.y = newY;
            }
        },
        stopDrag() {
            if (this.draggingIndex !== null) {
                this.draggingIndex = null;
                this.saveToLocal();
            }
            this.updateSizes();
        },
        updateSizes() {
            const widgetElements = document.querySelectorAll('.widget');
            let changed = false;
            widgetElements.forEach((el, index) => {
                if (this.widgets[index]) {
                    const newWidth = el.offsetWidth;
                    const newHeight = el.offsetHeight;
                    if (this.widgets[index].width !== newWidth || this.widgets[index].height !== newHeight) {
                        this.widgets[index].width = newWidth;
                        this.widgets[index].height = newHeight;
                        changed = true;
                    }
                }
            });
            if (changed) this.saveToLocal();
        },
        saveToLocal() {
            localStorage.setItem('meinBoard', JSON.stringify(this.widgets));
        },
        exportBoard() {
            const dataStr = JSON.stringify(this.widgets);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = "mein-wirtschaftslab-board.json";
            link.click();
        },
        importBoard(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.widgets = JSON.parse(e.target.result);
                this.saveToLocal();
            };
            reader.readAsText(file);
        },
        async toggleFullscreen() {
            if (!document.fullscreenElement) {
                try {
                    await document.documentElement.requestFullscreen();
                    this.isFullscreen = true;
                } catch (err) {
                    console.error("Vollbild Fehler:", err);
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                    this.isFullscreen = false;
                }
            }
        },
        onFullscreenChange() {
            this.isFullscreen = !!document.fullscreenElement;
        }
    }
});

app.component('uhr-widget', UhrWidget);
app.component('notiz-widget', NotizWidget);
app.component('countdown-widget', CountdownWidget);
app.component('stoppuhr-widget', StoppuhrWidget);
app.component('zufall-widget', ZufallWidget);
app.component('qr-widget', QrWidget);
app.mount('#app');