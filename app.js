const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            widgets: [],
            selectedWidgets: [],
            isSelecting: false,
            selectionBox: { x: 0, y: 0, w: 0, h: 0 },
            selectionStartX: 0,
            selectionStartY: 0,
            draggingIds: [],
            dragStartX: 0,
            dragStartY: 0,
            dragInitialPositions: [],
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
        startSelection(e) {
            // Nur bei linker Maustaste oder Touch starten
            if (e.type === 'mousedown' && e.button !== 0) return;

            this.isSelecting = true;
            this.selectedWidgets = []; // Auswahl aufheben, wenn man neu klickt

            let clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            let clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            this.selectionStartX = clientX;
            this.selectionStartY = clientY;
            this.selectionBox = { x: clientX, y: clientY, w: 0, h: 0 };
        },
        startDrag(e, index) {
            const isHeader = e.target.closest('.widget-header');
            if (!isHeader) return;
            if (e.target.closest('.close-btn') || e.target.tagName === 'BUTTON') return;

            const widget = this.widgets[index];

            // Wenn das angeklickte Widget noch NICHT markiert ist,
            // heben wir die alte Auswahl auf und markieren NUR dieses eine.
            if (!this.selectedWidgets.includes(widget.id)) {
                this.selectedWidgets = [widget.id];
            }

            // Wir merken uns alle aktuell markierten Widgets zum Ziehen
            this.draggingIds = [...this.selectedWidgets];

            let clientX, clientY;
            if (e.type === 'touchstart') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            this.dragStartX = clientX;
            this.dragStartY = clientY;

            // Startpositionen aller ausgewählten Widgets abspeichern
            this.dragInitialPositions = this.widgets
                .filter(w => this.draggingIds.includes(w.id))
                .map(w => ({ id: w.id, x: w.x, y: w.y }));
        },
        onDrag(e) {
            // Verhindert das Scrollen beim Ziehen
            if (e.type === 'touchmove' && (this.draggingIds.length > 0 || this.resizingIndex !== null || this.isSelecting)) {
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

            // 1. FALL: Wir ziehen ein AUSWAHL-RECHTECK
            if (this.isSelecting) {
                let x = Math.min(clientX, this.selectionStartX);
                let y = Math.min(clientY, this.selectionStartY);
                let w = Math.abs(clientX - this.selectionStartX);
                let h = Math.abs(clientY - this.selectionStartY);

                this.selectionBox = { x, y, w, h };

                // 50% Überschneidungs-Check (Mathe-Magie)
                this.selectedWidgets = this.widgets.filter(widget => {
                    let wX = widget.x;
                    let wY = widget.y;
                    let wW = widget.width;
                    let wH = widget.height;
                    let widgetArea = wW * wH;

                    // Bereich ermitteln, der sich überlappt
                    let overX = Math.max(x, wX);
                    let overY = Math.max(y, wY);
                    let overW = Math.max(0, Math.min(x + w, wX + wW) - overX);
                    let overH = Math.max(0, Math.min(y + h, wY + wH) - overY);
                    let overlapArea = overW * overH;

                    // Mindestens 50% der Widget-Fläche muss im Rechteck liegen
                    return overlapArea >= (widgetArea * 0.5);
                }).map(w => w.id);
            }
            // 2. FALL: Wir VERSCHIEBEN WIDGETS
            else if (this.draggingIds.length > 0) {
                // Wie weit hat sich die Maus seit dem Klick bewegt?
                let deltaX = clientX - this.dragStartX;
                let deltaY = clientY - this.dragStartY;

                const toolbarHeight = 60;

                // Wende diese Bewegung auf ALLE markierten Widgets an
                this.dragInitialPositions.forEach(initPos => {
                    const w = this.widgets.find(widget => widget.id === initPos.id);
                    if (w) {
                        let newX = initPos.x + deltaX;
                        let newY = initPos.y + deltaY;

                        const maxX = window.innerWidth - w.width;
                        const maxY = window.innerHeight - w.height;

                        // Grenzen einhalten
                        if (newX < 0) newX = 0;
                        if (newX > maxX) newX = maxX;
                        if (newY < toolbarHeight) newY = toolbarHeight;
                        if (newY > maxY) newY = maxY;

                        w.x = newX;
                        w.y = newY;
                    }
                });
            }
            // 3. FALL: Wir VERGRÖßERN (RESIZE) EIN WIDGET
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
            // Aufräumen, wenn wir die Maustaste / den Finger loslassen
            if (this.draggingIds.length > 0 || this.resizingIndex !== null) {
                this.draggingIds = [];
                this.resizingIndex = null;
                this.saveToLocal();
            }
            if (this.isSelecting) {
                this.isSelecting = false;
            }
        },
        /*updateSizes() {
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
        },*/

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

app.mount('#app');