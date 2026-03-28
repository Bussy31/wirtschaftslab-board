const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            offsetX: 0,
            offsetY: 0,
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
            const widget = this.widgets[index];
            const isHeader = e.target.closest('.widget-header');
            const isHandle = e.target.closest('.drag-handle');
            const tagsDieIgnoriertWerden = ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];

            // --- SONDERREGEL NOTIZ ---
            // Wenn es eine Notiz ist, darf NUR am Header (der Leiste oben) gezogen werden
            if (widget.type === 'notiz' && !isHeader && !isHandle) return;

            // Generelle Regel für alle: Nicht an Buttons oder Eingabefeldern ziehen
            if (tagsDieIgnoriertWerden.includes(e.target.tagName) && !isHandle) return;
            this.draggingIndex = index;
            this.offsetX = e.clientX - widget.x;
            this.offsetY = e.clientY - widget.y;
        },
        onDrag(e) {
            if (this.draggingIndex !== null) {
                const w = this.widgets[this.draggingIndex];

                // 1. Berechne die gewünschte neue Position
                let newX = e.clientX - this.offsetX;
                let newY = e.clientY - this.offsetY;

                const toolbar = document.querySelector('.toolbar');
                const toolbarHeight = toolbar ? toolbar.offsetHeight : 0; // Misst die echte Höhe der Leiste
                // 2. Fenster-Grenzen ermitteln
                const maxX = window.innerWidth - w.width;
                const maxY = window.innerHeight - w.height;

                // 3. Begrenzung anwenden (Constraint)

                // Horizontal (Links/Rechts)
                if (newX < 0) newX = 0; // Nicht links raus
                if (newX > maxX) newX = maxX; // Nicht rechts raus

                // Vertikal (Oben/Unten)
                if (newY < 0) newY = 0; // Nicht oben raus (wichtig für die Leiste!)
                if (newY > maxY) newY = maxY; // Nicht unten raus

                // 4. Position im Widget speichern
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
        }
    }
});

app.component('uhr-widget', UhrWidget);
app.component('notiz-widget', NotizWidget);
app.component('countdown-widget', CountdownWidget);
app.component('stoppuhr-widget', StoppuhrWidget);
app.mount('#app');