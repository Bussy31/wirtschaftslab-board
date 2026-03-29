const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            offsetX: 0,
            offsetY: 0,
            isFullscreen: false,
            aktuelleZeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        }
    },
    mounted() {
        const saved = localStorage.getItem('meinBoard');
        if (saved) {
            this.widgets = JSON.parse(saved);
        }

        // --- MAUS EVENTS ---
        window.addEventListener('mousemove', this.onDrag);
        window.addEventListener('mouseup', this.stopDrag);

        // --- NEU: TOUCH EVENTS FÜRS iPAD ---
        window.addEventListener('touchmove', this.onDrag, { passive: false }); // passive: false erlaubt e.preventDefault()
        window.addEventListener('touchend', this.stopDrag);
        window.addEventListener('touchcancel', this.stopDrag); // Falls der Touch abgebrochen wird (z.B. Systemgeste)

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

        // --- KOMBINIERTE START-DRAG FUNKTION (Maus & Touch) ---
        startDrag(e, index) {
            // Prüfen: Wurde der Header geklickt?
            const isHeader = e.target.closest('.widget-header');
            if (!isHeader) return;

            // Sicherheits-Check: Klicks auf das Schließen-X oder Buttons im Header ignorieren
            if (e.target.closest('.close-btn') || e.target.tagName === 'BUTTON') {
                return;
            }

            this.draggingIndex = index;
            const widget = this.widgets[index];

            // Unterscheiden, ob es ein Maus-Klick oder ein Finger-Tipp ist
            let clientX, clientY;
            if (e.type === 'touchstart') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            this.offsetX = clientX - widget.x;
            this.offsetY = clientY - widget.y;
        },

        // --- KOMBINIERTE ON-DRAG FUNKTION (Maus & Touch) ---
        onDrag(e) {
            if (this.draggingIndex !== null) {
                // Verhindert das Scrollen der ganzen Seite auf dem iPad beim Ziehen des Fensters
                if (e.type === 'touchmove') {
                    e.preventDefault();
                }

                const w = this.widgets[this.draggingIndex];

                // Wieder unterscheiden zwischen Maus und Touch
                let clientX, clientY;
                if (e.type === 'touchmove') {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                let newX = clientX - this.offsetX;
                let newY = clientY - this.offsetY;

                const toolbar = document.querySelector('.toolbar');
                const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;

                const maxX = window.innerWidth - w.width;
                const maxY = window.innerHeight - w.height;

                // Begrenzung (Constraints)
                if (newX < 0) newX = 0;
                if (newX > maxX) newX = maxX;

                if (newY < toolbarHeight) newY = toolbarHeight;
                if (newY > maxY) newY = maxY;

                w.x = newX;
                w.y = newY;
            }
        },

        // --- KOMBINIERTE STOP-DRAG FUNKTION (Maus & Touch) ---
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

// Komponenten registrieren
app.component('uhr-widget', UhrWidget);
app.component('notiz-widget', NotizWidget);
app.component('countdown-widget', CountdownWidget);
app.component('stoppuhr-widget', StoppuhrWidget);
app.component('zufall-widget', ZufallWidget);
app.component('qr-widget', QrWidget);
app.component('handlungsplan-widget', HandlungsplanWidget);

app.mount('#app');