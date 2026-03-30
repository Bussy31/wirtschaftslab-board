const GruppenWidget = {
    props: ['widgetData'],
    data() {
        return {
            modus: this.widgetData.modus || 'anzahl',
            parameter: this.widgetData.parameter || 4,
            gruppen: this.widgetData.gruppen || [],
            unassigned: this.widgetData.unassigned || [],
            schuelerText: this.widgetData.schuelerListe || '',
            showList: false,
            // NEU: Klick-Speicher
            selectedStudent: null,
            selectedSource: null
        };
    },
    methods: {
        getNamen() {
            return this.schuelerText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        },
        saveState() {
            this.widgetData.modus = this.modus;
            this.widgetData.parameter = this.parameter;
            this.widgetData.gruppen = this.gruppen;
            this.widgetData.unassigned = this.unassigned;
            this.widgetData.schuelerListe = this.schuelerText;
            this.$emit('save');
        },
        switchMode(newMode) {
            this.modus = newMode;
            this.showList = false;

            if (newMode === 'manuell') {
                this.gruppen = [];
                let numGroups = parseInt(this.parameter) || 4;
                for (let i = 0; i < numGroups; i++) this.gruppen.push([]);
                this.unassigned = this.getNamen(); // Alle ins Sammelbecken
            } else {
                this.gruppen = []; // Ansicht leeren
                this.unassigned = [];
            }
            this.saveState();
        },
        updateManuellGroups() {
            if (this.modus !== 'manuell') return;
            let numGroups = parseInt(this.parameter) || 4;
            while (this.gruppen.length < numGroups) this.gruppen.push([]);
            while (this.gruppen.length > numGroups) {
                let removed = this.gruppen.pop();
                this.unassigned.push(...removed);
            }
            this.saveState();
        },
        shuffleArray(array) {
            let arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        },
        generiereGruppen() {
            let namen = this.shuffleArray(this.getNamen());
            this.gruppen = [];
            this.unassigned = [];

            if (namen.length === 0) return;

            if (this.modus === 'anzahl') {
                let numGroups = parseInt(this.parameter) || 1;
                for (let i = 0; i < numGroups; i++) this.gruppen.push([]);
                namen.forEach((name, i) => {
                    this.gruppen[i % numGroups].push(name);
                });
            } else if (this.modus === 'groesse') {
                let groupSize = parseInt(this.parameter) || 2;
                for (let i = 0; i < namen.length; i += groupSize) {
                    this.gruppen.push(namen.slice(i, i + groupSize));
                }
            }
            this.saveState();
        },

        // --- NEUE KLICK LOGIK (Ersetzt Drag & Drop) ---
        selectStudent(name, sourceIndex) {
            if (this.modus !== 'manuell' || this.widgetData.isTransparent) return;
            // Klickt man denselben nochmal an, wird er abgewählt
            if (this.selectedStudent === name) {
                this.selectedStudent = null;
                this.selectedSource = null;
            } else {
                this.selectedStudent = name;
                this.selectedSource = sourceIndex;
            }
        },
        moveToGroup(targetIndex) {
            if (!this.selectedStudent || this.modus !== 'manuell' || this.widgetData.isTransparent) return;

            // Wenn man in dieselbe Box klickt, in der der Schüler schon ist -> abwählen
            if (this.selectedSource === targetIndex) {
                this.selectedStudent = null;
                this.selectedSource = null;
                return;
            }

            // 1. Aus alter Box entfernen
            if (this.selectedSource === -1) {
                this.unassigned = this.unassigned.filter(n => n !== this.selectedStudent);
            } else {
                this.gruppen[this.selectedSource] = this.gruppen[this.selectedSource].filter(n => n !== this.selectedStudent);
            }

            // 2. In neue Box einfügen
            if (targetIndex === -1) {
                this.unassigned.push(this.selectedStudent);
            } else {
                this.gruppen[targetIndex].push(this.selectedStudent);
            }

            // 3. Auswahl leeren und speichern
            this.selectedStudent = null;
            this.selectedSource = null;
            this.saveState();
        }
    },
    template: `
        <div style="display:flex; flex-direction:column; height:100%; box-sizing: border-box; transition: padding 0.3s ease;"
             :style="{ gap: widgetData.isTransparent ? '0' : '10px', padding: widgetData.isTransparent ? '0' : '5px' }">
            
            <template v-if="!widgetData.isTransparent">
                <div style="display:flex; gap:5px; flex-shrink:0;">
                    <button @click="switchMode('anzahl')" :style="{background: modus==='anzahl' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}" style="flex:1; border:none; color:white; border-radius:4px; padding:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">🔢 Gruppenanzahl</button>
                    <button @click="switchMode('groesse')" :style="{background: modus==='groesse' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}" style="flex:1; border:none; color:white; border-radius:4px; padding:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">📏 Gruppengröße</button>
                    <button @click="switchMode('manuell')" :style="{background: modus==='manuell' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}" style="flex:1; border:none; color:white; border-radius:4px; padding:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">👆 Manuell (Klick)</button>
                    <button @click="showList = !showList" style="background:transparent; border:1px solid