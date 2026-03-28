const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            offsetX: 0,
            offsetY: 0,
            aktuelleZeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),

            backgroundImage: null,
            bgMode: 'cover',
            bgPreviewUrl: null
        }
    },
    // NEU: Berechnet den Hintergrund-Code sauber und fehlerfrei für den Browser
    computed: {
        boardBackgroundStyle() {
            if (!this.backgroundImage) return {};
            return {
                backgroundImage: `url("${this.backgroundImage}")`,
                backgroundSize: this.bgMode === 'tile' ? 'auto' : this.bgMode,
                backgroundRepeat: this.bgMode === 'tile' ? 'repeat' : 'no-repeat',
                backgroundPosition: 'center'
            };
        },
        previewBackgroundStyle() {
            if (!this.bgPreviewUrl) return {};
            return {
                backgroundImage: `url("${this.bgPreviewUrl}")`,
                backgroundSize: this.bgMode === 'tile' ? 'auto' : this.bgMode,
                backgroundRepeat: this.bgMode === 'tile' ? 'repeat' : 'no-repeat',
                backgroundPosition: 'center'
            };
        }
    },
    mounted() {
        const saved = localStorage.getItem('meinBoard');
        if (saved) {
            this.widgets = JSON.parse(saved);
        }

        const savedBg = localStorage.getItem('meinBoard_bg');
        if (savedBg) this.backgroundImage = savedBg;

        const savedBgMode = localStorage.getItem('meinBoard_bgMode');
        if (savedBgMode) this.bgMode = savedBgMode;

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

        // --- DIE ROBUSTE OFFLINE-METHODE ---
        onBgSelected(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Liest das Bild direkt als "Text" ein, das funktioniert immer!
            const reader = new FileReader();
            reader.onload = (e) => {
                this.bgPreviewUrl = e.target.result;
            };
            reader.readAsDataURL(file);

            event.target.value = '';
        },
        applyBackground() {
            this.backgroundImage = this.bgPreviewUrl;
            try {
                localStorage.setItem('meinBoard_bg', this.backgroundImage);
                localStorage.setItem('meinBoard_bgMode', this.bgMode);
            } catch (error) {
                console.warn("Hinweis: Bild ist zu groß für den Langzeit-Speicher.");
            }
            this.bgPreviewUrl = null;
        },
        cancelBackground() {
            this.bgPreviewUrl = null;
        }
    }
});

app.component('uhr-widget', UhrWidget);
app.component('notiz-widget', NotizWidget);
app.component('countdown-widget', CountdownWidget);
app.component('stoppuhr-widget', StoppuhrWidget);
app.mount('#app');