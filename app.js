const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            draggingIndex: null,
            offsetX: 0,
            offsetY: 0,
            isFullscreen: false,
            showWidgetMenu: false,
            resizingIndex: null,
            startWidth: 0,
            startHeight: 0,
            aktuelleZeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),

            showSettings: false,
            activeSettingsTab: 'klassen',

            availableBackgrounds: [
                'hintergruende/bild1.jpg',
                'hintergruende/bild2.jpg',
                'hintergruende/bild3.jpg',
                'hintergruende/bild4.jpg',
                'hintergruende/bild5.jpg',
                'hintergruende/bild6.jpg',
                'hintergruende/bild7.jpg'],

            settings: {
                klassen: [],
                hintergrund: '1e293b'
            },
            neuerKlassenName: '',
            aktiveKlasse: 'Standard'
        }
    },
    mounted() {
        const savedSettings = localStorage.getItem('boardSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        }

        if (!this.settings.klassen || this.settings.klassen.length === 0) {
            this.showSettings = true;
            this.activeSettingsTab = 'klassen';
        }

        if (!this.settings.hintergrund) {
            this.settings.hintergrund = '#1e293b';
            this.saveToLocal();
        }

        const lastActive = localStorage.getItem('aktiveKlasse');
        if (lastActive) {
            this.aktiveKlasse = lastActive;
        }

        this.loadBoard();

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.showWidgetMenu = false;
            }
        });

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
        aktualisiereWidgets() {
            const aktuelleKlasse = this.settings.klassen.find(k => k.name === this.aktiveKlasse);

            if (aktuelleKlasse && aktuelleKlasse.schueler && aktuelleKlasse.schueler.length > 0) {
                const anwesendeSchueler = aktuelleKlasse.schueler
                    .filter(s => !s.absent)
                    .map(s => s.name)
                    .join('\n');

                if (!anwesendeSchueler) {
                    alert("Es sind momentan keine anwesenden Schüler in dieser Klasse eingetragen.");
                    return;
                }

                let hatAktualisiert = false;

                this.widgets.forEach(w => {
                    if (w.type === 'gruppen' || w.type === 'zufall') {
                        w.schuelerListe = anwesendeSchueler;
                        if (w.type === 'gruppen') {
                            const anzahlGruppen = w.gruppen.length > 0 ? w.gruppen.length : (w.parameter || 4);
                            w.gruppen = [];
                            for (let i = 0; i < anzahlGruppen; i++) {
                                w.gruppen.push([]);
                            }
                            w.unassigned = anwesendeSchueler.split('\n');
                        }
                        hatAktualisiert = true;
                    }
                });

                if (hatAktualisiert) {
                    this.saveToLocal();
                    window.location.reload();
                } else {
                    alert("Keine Widgets offen, die eine Schülerliste verwenden.");
                }
            } else {
                alert("Keine aktive Klasse gefunden oder die Klasse ist leer.");
            }
        },
        resetAll() {
            if (confirm("⚠️ ACHTUNG: Möchtest du wirklich ALLES löschen? Alle Klassen, Schüler und Einstellungen gehen unwiderruflich verloren!")) {
                localStorage.clear();
                alert("Das Board wurde auf Werkseinstellungen zurückgesetzt.");
                window.location.reload(); // Seite neu laden, um alles zu säubern
            }
        },
        setHintergrund(bg) {
            this.settings.hintergrund = bg;
            localStorage.setItem('hintergrund_' + this.aktiveKlasse, bg);
        },

        loadBoard() {
            const saved = localStorage.getItem('board_' + this.aktiveKlasse);
            if (saved) {
                this.widgets = JSON.parse(saved);
            } else {
                this.widgets = [];
            }

            const savedBg = localStorage.getItem('hintergrund_' + this.aktiveKlasse);
            if (savedBg) {
                this.settings.hintergrund = savedBg;
            } else {
                this.settings.hintergrund = '#1e293b';
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

        addKlasse() {
            if (!this.neuerKlassenName.trim()) return;
            if (!this.settings.klassen) this.settings.klassen = [];

            const name = this.neuerKlassenName.trim();
            this.settings.klassen.push({ name: name, schueler: [] });
            this.neuerKlassenName = '';
            this.saveSettings();

            // Wenn es die allererste Klasse ist...
            if (this.settings.klassen.length === 1) {
                // ...wechseln wir die Klasse nur im Hintergrund, OHNE das Menü zu schließen!
                this.aktiveKlasse = name;
                localStorage.setItem('aktiveKlasse', name);
                this.loadBoard();
            }
        },
        removeKlasse(index) {
            if(confirm('Möchtest du diese Klasse und ihr Board wirklich löschen?')) {
                const klasseName = this.settings.klassen[index].name;
                localStorage.removeItem('board_' + klasseName);
                localStorage.removeItem('hintergrund_' + klasseName);
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

        startResize(e, index) {
            this.resizingIndex = index;
            const widget = this.widgets[index];
            let clientX, clientY;
            if (e.type === 'touchstart') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            this.startWidth = widget.width;
            this.startHeight = widget.height;
            this.offsetX = clientX;
            this.offsetY = clientY;
        },

        startDrag(e, index) {
            // 1. Prüfen, ob auf ein interaktives Element geklickt wurde
            const tagName = e.target.tagName.toUpperCase();

            if (tagName === 'BUTTON' || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
                return;
            }
            if (e.target.closest('button') || e.target.closest('.close-btn')) {
                return;
            }

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

            // NEU: Verhindert, dass der Browser während des Klicks Text markieren will
            document.body.style.userSelect = 'none';
        },

        onDrag(e) {
            if (e.type === 'touchmove' && (this.draggingIndex !== null || this.resizingIndex !== null)) {
                e.preventDefault();
            }

            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            // 1. Fall: Wir verschieben das Widget
            if (this.draggingIndex !== null) {
                const w = this.widgets[this.draggingIndex];
                let newX = clientX - this.offsetX;
                let newY = clientY - this.offsetY;

                // NEU: Grenzen großzügig erweitern!
                // Es bleiben nur noch 50 Pixel sichtbar, damit man das Fenster wieder zurückholen kann.
                const safeZone = 50;

                if (newX < -w.width + safeZone) newX = -w.width + safeZone;
                if (newX > window.innerWidth - safeZone) newX = window.innerWidth - safeZone;

                // Auch nach oben darf geschoben werden (60px ist die obere Toolbar)
                if (newY < -w.height + safeZone + 60) newY = -w.height + safeZone + 60;
                if (newY > window.innerHeight - safeZone) newY = window.innerHeight - safeZone;

                w.x = newX;
                w.y = newY;

                // NEU: Löscht blaue Markierungen, falls doch irgendwo Text erwischt wurde
                if (window.getSelection) {
                    window.getSelection().removeAllRanges();
                }
            }
            // 2. Fall: Wir machen das Widget größer/kleiner (iPad Fix)
            else if (this.resizingIndex !== null) {
                const w = this.widgets[this.resizingIndex];
                let diffX = clientX - this.offsetX;
                let diffY = clientY - this.offsetY;

                let newWidth = this.startWidth + diffX;
                let newHeight = this.startHeight + diffY;

                if (newWidth < 200) newWidth = 200;
                if (newHeight < 150) newHeight = 150;

                w.width = newWidth;
                w.height = newHeight;
            }
        },

        stopDrag() {
            if (this.draggingIndex !== null || this.resizingIndex !== null) {
                this.draggingIndex = null;
                this.resizingIndex = null;
                this.saveToLocal();

                // NEU: Textauswahl im Browser wieder ganz normal erlauben
                document.body.style.userSelect = '';
            }
        },

        exportBoard() {
            const backupData = {
                settings: this.settings,
                boards: {},
                backgrounds: {}
            };

            if (this.settings.klassen) {
                this.settings.klassen.forEach(klasse => {
                    const boardData = localStorage.getItem('board_' + klasse.name);
                    if (boardData) backupData.boards[klasse.name] = JSON.parse(boardData);

                    const bgData = localStorage.getItem('hintergrund_' + klasse.name);
                    if (bgData) backupData.backgrounds[klasse.name] = bgData;
                });
            }

            const standardBoard = localStorage.getItem('board_Standard');
            if (standardBoard) backupData.boards['Standard'] = JSON.parse(standardBoard);

            const standardBg = localStorage.getItem('hintergrund_Standard');
            if (standardBg) backupData.backgrounds['Standard'] = standardBg;

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

                    if (importedData.settings && importedData.boards) {

                        this.settings = importedData.settings;
                        this.saveSettings();

                        for (const [klasseName, widgets] of Object.entries(importedData.boards)) {
                            localStorage.setItem('board_' + klasseName, JSON.stringify(widgets));
                        }

                        if (importedData.backgrounds) {
                            for (const [klasseName, bg] of Object.entries(importedData.backgrounds)) {
                                localStorage.setItem('hintergrund_' + klasseName, bg);
                            }
                        }

                        if (this.settings.klassen && this.settings.klassen.length > 0) {
                            this.wechsleKlasse(this.settings.klassen[0].name);
                        } else {
                            this.wechsleKlasse('Standard');
                        }

                        alert("✅ Komplett-Backup inkl. Hintergründe erfolgreich geladen!");
                    } else {
                        this.widgets = importedData;
                        this.saveToLocal();
                        alert("ℹ️ Einzelnes Board in die aktuelle Klasse importiert.");
                    }
                } catch (err) {
                    alert("❌ Fehler beim Importieren. Ist das die richtige Datei?");
                    console.error(err);
                }
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
    },
});

app.component('uhr-widget', UhrWidget);
app.component('notiz-widget', NotizWidget);
app.component('countdown-widget', CountdownWidget);
app.component('stoppuhr-widget', StoppuhrWidget);
app.component('zufall-widget', ZufallWidget);
app.component('qr-widget', QrWidget);
app.component('handlungsplan-widget', HandlungsplanWidget);
app.component('gruppen-widget', GruppenWidget);
app.component('arbeitsphase-widget', ArbeitsphaseWidget);
app.component('medien-widget', MedienWidget);
app.component('ampel-widget', AmpelWidget);
app.component('stundenziel-widget', StundenzielWidget);

app.mount('#app');