const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            offsetX: 0,
            offsetY: 0
        }
    },
    mounted() {
        const saved = localStorage.getItem('meinBoard');
        if (saved) {
            this.widgets = JSON.parse(saved);
        }
        window.addEventListener('mousemove', this.onDrag);
        // Wir hören auf JEDES Loslassen der Maus, um Größenänderungen zu erfassen
        window.addEventListener('mouseup', this.stopDrag);
    },
    methods: {
        addWidget(type, icon) {
            this.widgets.push({
                id: Date.now(),
                type: type,
                icon: icon || '✨',
                x: window.innerWidth / 2 - 150,
                y: 100,
                width: 300,  // NEU: Start-Breite
                height: 200, // NEU: Start-Höhe
                data: type === 'notiz' ? 'Hier tippen...' : ''
            });
            this.saveToLocal();
        },
        removeWidget(index) {
            this.widgets.splice(index, 1);
            this.saveToLocal();
        },
        startDrag(e, index) {
            if (!e.target.closest('.widget-header')) return;
            this.draggingIndex = index;
            const widget = this.widgets[index];
            this.offsetX = e.clientX - widget.x;
            this.offsetY = e.clientY - widget.y;
        },
        onDrag(e) {
            if (this.draggingIndex !== null) {
                const w = this.widgets[this.draggingIndex];
                w.x = e.clientX - this.offsetX;
                w.y = e.clientY - this.offsetY;
            }
        },
        stopDrag() {
            // Speichert die neue Position beim Verschieben
            if (this.draggingIndex !== null) {
                this.draggingIndex = null;
                this.saveToLocal();
            }
            // NEU: Speichert die neue Größe beim Resizen
            this.updateSizes();
        },
        // NEU: Liest die echte Pixelgröße aus dem Browser aus und speichert sie
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
app.mount('#app');