const GruppenWidget = {
    props: ['widgetData'],
    data() {
        return {
            modus: this.widgetData.modus || 'anzahl',
            parameter: this.widgetData.parameter || 4,
            gruppen: this.widgetData.gruppen || [],
            unassigned: this.widgetData.unassigned || [],
            schuelerText: this.widgetData.schuelerListe || '',
            showList: false
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
            // Wenn man im manuellen Modus die Gruppenanzahl ändert
            let numGroups = parseInt(this.parameter) || 4;
            while (this.gruppen.length < numGroups) this.gruppen.push([]);
            while (this.gruppen.length > numGroups) {
                // Schüler aus gelöschten Gruppen zurück ins Sammelbecken werfen
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
        // --- DRAG & DROP LOGIK ---
        dragStart(e, name, index) {
            e.dataTransfer.setData('text/plain', name);
            e.dataTransfer.setData('fromIndex', index);

            // --- MAC VISUAL FIX ---
            let dragGhost = e.target.cloneNode(true);

            // 2. Styling im Gelbton des Sammelbeckens anpassen
            dragGhost.style.position = "absolute";
            dragGhost.style.top = "-1000px";

            // HIER SIND DIE NEUEN FARBEN:
            dragGhost.style.background = "rgba(245, 158, 11, 0.9)"; // Kräftiges Gelb/Orange (fast deckend)
            dragGhost.style.border = "1px solid #fcd34d"; // Hellerer gelber Rand
            dragGhost.style.color = "#ffffff"; // Weiß (ist auf dem Orange am besten lesbar beim Ziehen)

            dragGhost.style.padding = "4px 12px";
            dragGhost.style.borderRadius = "12px"; // Schön abgerundet wie im Sammelbecken
            dragGhost.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
            dragGhost.style.fontWeight = "600";
            dragGhost.style.fontSize = "0.9rem";
            dragGhost.style.zIndex = "9999";

            document.body.appendChild(dragGhost);
            e.dataTransfer.setDragImage(dragGhost, 15, 15);

            setTimeout(() => {
                if (document.body.contains(dragGhost)) {
                    document.body.removeChild(dragGhost);
                }
            }, 50);
        },
        drop(e, toIndex) {
            // Drop nur erlauben, wenn NICHT transparent
            if (this.widgetData.isTransparent) return;

            const name = e.dataTransfer.getData('text/plain');
            const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));

            if (!name || isNaN(fromIndex)) return;
            if (fromIndex === toIndex) return; // Nichts zu tun

            // 1. Aus der alten Quelle entfernen (WICHTIG: nur EINEN Eintrag löschen!)
            if (fromIndex === -1) {
                const idx = this.unassigned.indexOf(name);
                if (idx !== -1) this.unassigned.splice(idx, 1); // Löscht exakt 1 Element an dieser Position
            } else {
                const idx = this.gruppen[fromIndex].indexOf(name);
                if (idx !== -1) this.gruppen[fromIndex].splice(idx, 1);
            }

            // 2. Ins neue Ziel einfügen (Einfach pushen, Duplikate sind jetzt erlaubt)
            if (toIndex === -1) {
                this.unassigned.push(name);
            } else {
                this.gruppen[toIndex].push(name);
            }

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
                    <button @click="switchMode('manuell')" :style="{background: modus==='manuell' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}" style="flex:1; border:none; color:white; border-radius:4px; padding:6px; cursor:pointer; font-weight:600; font-size:0.85rem;">🖐️ Manuell (Drag)</button>
                    <button @click="showList = !showList" style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:white; border-radius:4px; padding:6px; cursor:pointer;" title="Schülerliste bearbeiten">⚙️</button>
                </div>

                <textarea v-if="showList" v-model="schuelerText" @input="saveState" style="width:100%; height:80px; flex-shrink:0; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--widget-border); border-radius:4px; padding:5px; resize:none; font-family:inherit; box-sizing:border-box;" placeholder="Namen (einer pro Zeile)"></textarea>

                <div style="display:flex; gap:10px; flex-shrink:0; align-items:center; background:rgba(0,0,0,0.1); padding:8px; border-radius:6px;">
                    <label style="font-size:0.85rem; color:#cbd5e1;">
                        {{ modus === 'anzahl' ? 'Wie viele Gruppen?' : (modus === 'groesse' ? 'Schüler pro Gruppe?' : 'Gruppen insgesamt:') }}
                    </label>
                    <input type="number" min="1" v-model="parameter" @change="updateManuellGroups" style="width:50px; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:4px; padding:4px; text-align:center; font-weight:bold;">
                    
                    <button v-if="modus !== 'manuell'" @click="generiereGruppen" style="background:#10b981; color:white; border:none; border-radius:4px; padding:4px 12px; cursor:pointer; font-weight:bold; margin-left:auto; box-shadow:0 2px 4px rgba(0,0,0,0.2);">🎲 Auslosen</button>
                    <span v-else style="font-size:0.75rem; color:#94a3b8; margin-left:auto; font-style:italic;">(Namen einfach ziehen)</span>
                </div>

                <div v-if="modus === 'manuell'" 
                     @mousedown.stop
                     @touchstart.stop
                     @dragover.prevent 
                     @drop="drop($event, -1)"
                     style="background:rgba(245, 158, 11, 0.1); border:1px dashed rgba(245, 158, 11, 0.4); border-radius:6px; flex-shrink:0; padding:8px; display:flex; flex-wrap:wrap; gap:6px; min-height:45px; align-items:center;">
                    <div v-if="unassigned.length === 0" style="color:rgba(251, 191, 36, 0.5); font-size:0.8rem; width:100%; text-align:center;">Alle Schüler sind eingeteilt! 🎉</div>
                    <span v-for="name in unassigned" :key="name"
                          class="draggable-name"
                          draggable="true" 
                          @dragstart="dragStart($event, name, -1)"
                          :data-name="name"
                          style="background:rgba(245, 158, 11, 0.2); border:1px solid rgba(245, 158, 11, 0.4); color:#fcd34d; padding:3px 10px; border-radius:12px; font-size:0.85rem; font-weight:600; cursor:grab; box-shadow:0 2px 2px rgba(0,0,0,0.1); touch-action: none; display: inline-block; margin: 3px;">
                    </span>
                </div>
            </template>

            <div style="flex:1; overflow-y:auto; display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px; align-items:start;"
                 :style="{ paddingRight: widgetData.isTransparent ? '0' : '5px' }" class="custom-scrollbar">
                
                <div v-for="(gruppe, index) in gruppen" :key="index"
                     @mousedown.stop
                     @touchstart.stop
                     @dragover.prevent
                     @drop="drop($event, index)"
                     :style="{
                        // DESIGN-FIX: Wie beim Handlungsplan eingefärbt
                        background: widgetData.isTransparent ? 'rgba(15, 23, 42, 0.9)' : 'rgba(59, 130, 246, 0.1)',
                        border: widgetData.isTransparent ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '10px',
                        minHeight: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        // Schatten nur im Editier-Modus, blickdicht im Transparent-Modus
                        boxShadow: widgetData.isTransparent ? '0 4px 8px rgba(0,0,0,0.6)' : 'inset 0 2px 10px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease'
                     }">
                     
                     <div :style="{
                        fontWeight: 'bold',
                        fontSize: widgetData.isTransparent ? '1rem' : '0.9rem',
                        // Titelfarbe im Transparent-Modus heller
                        color: widgetData.isTransparent ? 'white' : '#93c5fd',
                        marginBottom: '8px',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                        paddingBottom: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        // Text-Schatten für bessere Lesbarkeit auf Hintergründen
                        textShadow: widgetData.isTransparent ? '0px 1px 3px rgba(0,0,0,0.8)' : 'none'
                     }">
                         <span>Gruppe {{ index + 1 }}</span>
                         
                         <span v-if="!widgetData.isTransparent" style="font-size:0.7rem; background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:10px;">{{ gruppe.length }}</span>
                     </div>
                     
                     <div style="display:flex; flex-direction:column; gap:6px; flex:1;">
                         <span v-for="name in unassigned" :key="name"
                          class="draggable-name"
                          draggable="true" 
                          @dragstart="dragStart($event, name, -1)"
                          :data-name="name"
                          style="background:rgba(245, 158, 11, 0.2); border:1px solid rgba(245, 158, 11, 0.4); color:#fcd34d; padding:3px 10px; border-radius:12px; font-size:0.85rem; font-weight:600; cursor:grab; box-shadow:0 2px 2px rgba(0,0,0,0.1); touch-action: none; display: inline-block; margin: 3px;">
                          </span>
                         
                         <div v-if="gruppe.length === 0 && !widgetData.isTransparent" style="color:rgba(255,255,255,0.2); font-size:0.75rem; font-style:italic; text-align:center; margin-top:10px;">(Leer)</div>
                     </div>
                </div>
            </div>

            <div v-if="gruppen.length === 0 && widgetData.isTransparent" style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 20px; font-style: italic;">
                Noch keine Gruppen ausgelost...
            </div>

        </div>
    `
};