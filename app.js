const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            offsetX: 0,
            offsetY: 0,
            isFullscreen: false,
            aktuelleZeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            showSettings: false,
            settings: { klassen: [] },
            neuerKlassenName: '',
            aktiveKlasse: 'Standard'
        }
    },
    mounted() {
        const savedSettings = localStorage.getItem('boardSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        }

        const lastActive = localStorage.getItem('aktiveKlasse');
        if (lastActive) {
            this.aktiveKlasse = lastActive;
        }

        this.loadBoard();

        window.addEventListener('mousemove', this.onDrag);
        window.addEventListener('mouseup', this.stopDrag);

        window.addEventListener('touchmove', this.onDrag, { passive: false });
        window.addEventListener('touchend', this.stopDrag);
        window.addEventListener('touchcancel', this.stopDrag);

        document.addEventListener('fullscreenchange', this.onFullscreenChange);

        setInterval(() => {
            this.aktuelleZeit = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    },
    methods: {
        loadBoard() {
            const saved = localStorage.getItem('board_' + this.aktiveKlasse);
            if (saved) {
                this.widgets = JSON.parse(saved);
            } else {
                this.widgets = [];
            }
        },
        saveToLocal() {
            localStorage.setItem('board_' + this.aktiveKlasse, JSON.stringify(this.widgets));
        },
        wechsleKlasse(klassenName) {
            this.aktiveKlasse = klassenName;
            localStorage.setItem('aktiveKlasse', klassenName);
            this.loadBoard();
            this.showSettings = false;
        },

        // --- KLASSEN & SCHÜLER VERWALTUNG ---
        addKlasse() {
            if (!this.neuerKlassenName.trim()) return;
            if (!this.settings.klassen) this.settings.klassen = [];

            const name = this.neuerKlassenName.trim();
            this.settings.klassen.push({ name: name, schueler: [] });
            this.neuerKlassenName = '';
            this.saveSettings();

            if (this.settings.klassen.length === 1) {
                this.wechsleKlasse(name);
            }
        },
        removeKlasse(index) {
            if(confirm('Möchtest du diese Klasse und ihr Board wirklich löschen?')) {
                const klasseName = this.settings.klassen[index].name;
                localStorage.removeItem('board_' + klasseName);
                this.settings.klassen.splice(index, 1);

                if (this.aktiveKlasse === klasseName) {
                    this.wechsleKlasse('Standard');
                }
                this.saveSettings();
            }
        },
        addSchuelerInline(klasse, event) {
            const name = event.target.value;
            if (name && name.trim()) {
                klasse.schueler.push({ name: name.trim(), absent: false });
                event.target.value = '';
                this.saveSettings();
            }
        },
        removeSchueler(klasse, sIndex) {
            klasse.schueler.splice(sIndex, 1);
            this.saveSettings();
        },
        toggleAbsent(schueler) {
            schueler.absent = !schueler.absent;
            this.saveSettings();
        },
        saveSettings() {
            localStorage.setItem('boardSettings', JSON.stringify(this.settings));
        },

        addWidget(type, icon) {
            const isNotiz = type === 'notiz';
            const isGruppen = type === 'gruppen';

            // Vorbefüllung für Zufall ODER Gruppen
            let startListe = '';
            if (type === 'zufall' || type === 'gruppen') {
                const aktuelleKlasseObj = this.settings.klassen.find(k => k.name === this.aktiveKlasse);

                if (aktuelleKlasseObj && aktuelleKlasseObj.schueler) {
                    const anwesendeSchueler = aktuelleKlasseObj.schueler
                        .filter(s => !s.absent)
                        .map(s => s.name);
                    startListe = anwesendeSchueler.join('\n');
                }
            }

            this.widgets.push({
                id: Date.now(),
                type: type,
                icon: icon || '✨',
                x: window.innerWidth / 2 - (isNotiz ? 300 : (isGruppen ? 250 : 150)),
                y: 100,
                width: isNotiz ? 600 : (isGruppen ? 500 : 300),
                height: isNotiz ? 400 : (isGruppen ? 350 : 200),
                data: isNotiz ? 'Hier tippen...' : '',
                schuelerListe: (type === 'zufall' || type === 'gruppen') ? startListe : ''
            });
            this.saveToLocal();
        },
        removeWidget(index) {
            this.widgets.splice(index, 1);
            this.saveToLocal();
        },
        startDrag(e, index) {
            const isHeader = e.target.closest('.widget-header');
            if (!isHeader) return;
            if (e.target.closest('.close-btn') || e.target.tagName === 'BUTTON') return;

            this.draggingIndex = index;
            const widget = this.widgets[index];

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
        onDrag(e) {
            if (this.draggingIndex !== null) {
                if (e.type === 'touchmove') e.preventDefault();

                const w = this.widgets[this.draggingIndex];
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

                if (newX < 0) newX = 0;
                if (newX > maxX) newX = maxX;
                if (newY < toolbarHeight) newY = toolbarHeight;
                if (newY > maxY) newY = maxY;

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

        // ==========================================
        // NEU: KOMPLETT-BACKUP (EXPORT & IMPORT)
        // ==========================================
        exportBoard() {
            // Wir erstellen ein großes Paket mit Settings und allen Boards
            const backupData = {
                settings: this.settings,
                boards: {}
            };

            // Wir sammeln die Boards von allen Klassen ein
            if (this.settings.klassen) {
                this.settings.klassen.forEach(klasse => {
                    const boardData = localStorage.getItem('board_' + klasse.name);
                    if (boardData) {
                        backupData.boards[klasse.name] = JSON.parse(boardData);
                    }
                });
            }

            // Zur Sicherheit auch das "Standard"-Board mitnehmen
            const standardBoard = localStorage.getItem('board_Standard');
            if (standardBoard) {
                backupData.boards['Standard'] = JSON.parse(standardBoard);
            }

            // Paket schnüren und herunterladen
            const dataStr = JSON.stringify(backupData);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = "wirtschaftslab-komplett-backup.json";
            link.click();
        },
        importBoard(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // Prüfen: Ist es ein neues Komplett-Backup?
                    if (importedData.settings && importedData.boards) {

                        // 1. Settings (Klassen & Schüler) überschreiben
                        this.settings = importedData.settings;
                        this.saveSettings();

                        // 2. Alle Boards in den Speicher des Browsers schreiben
                        for (const [klasseName, widgets] of Object.entries(importedData.boards)) {
                            localStorage.setItem('board_' + klasseName, JSON.stringify(widgets));
                        }

                        // 3. Auf die erste importierte Klasse wechseln
                        if (this.settings.klassen && this.settings.klassen.length > 0) {
                            this.wechsleKlasse(this.settings.klassen[0].name);
                        } else {
                            this.wechsleKlasse('Standard');
                        }

                        alert("✅ Komplett-Backup erfolgreich geladen! Alle Klassen und Boards sind da.");

                    } else {
                        // Abwärtskompatibilität: Falls jemand ein altes Backup hochlädt
                        this.widgets = importedData;
                        this.saveToLocal();
                        alert("ℹ️ Einzelnes Board in die aktuelle Klasse importiert.");
                    }
                } catch (err) {
                    alert("❌ Fehler beim Importieren. Ist das die richtige Datei?");
                    console.error(err);
                }

                // Input-Feld leeren, damit man dieselbe Datei bei Bedarf nochmal wählen kann
                event.target.value = '';
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
app.component('handlungsplan-widget', HandlungsplanWidget);
app.component('gruppen-widget', GruppenWidget);

app.mount('#app');