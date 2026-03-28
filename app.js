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
        window.addEventListener('mouseup', this.stopDrag);
    },
    methods: {
        addWidget(type) {
            this.widgets.push({
                id: Date.now(),
                type: type,
                x: window.innerWidth / 2 - 100, // Spawnt in der Mitte
                y: 100,
                data: ''
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
            if (this.draggingIndex !== null) {
                this.draggingIndex = null;
                this.saveToLocal();
            }
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

// Hier verbinden wir unsere ausgelagerten Dateien mit der Haupt-App
app.component('uhr-widget', UhrWidget);
app.component('notiz-widget', NotizWidget);

app.mount('#app');