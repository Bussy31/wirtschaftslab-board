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
            // NEU: Wir merken uns jetzt den Index (Listenplatz), nicht mehr den Namen!
            selectedStudentIndex: null,
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

        // --- KLICK LOGIK (Update für gleiche Namen) ---
        selectStudent(studentIndex, sourceIndex) {
            if (this.modus !== 'manuell' || this.widgetData.isTransparent) return;

            // Klickt man exakt denselben Platz nochmal an, wird er abgewählt
            if (this.selectedSource === sourceIndex && this.selectedStudentIndex === studentIndex) {
                this.selectedStudentIndex = null;
                this.selectedSource = null;
            } else {
                this.selectedStudentIndex = studentIndex;
                this.selectedSource = sourceIndex;
            }
        },
        moveToGroup(targetIndex) {
            if (this.selectedStudentIndex === null || this.modus !== 'manuell' || this.widgetData.isTransparent) return;

            // Wenn man in dieselbe Box klickt -> abwählen
            if (this.selectedSource === targetIndex) {
                this.selectedStudentIndex = null;
                this.selectedSource = null;
                return;
            }

            let studentName = "";

            // 1. Namen anhand des Listenplatzes (Index) holen und exakt dort löschen
            if (this.selectedSource === -1) {
                studentName = this.unassigned[this.selectedStudentIndex];
                this.unassigned.splice(this.selectedStudentIndex, 1);
            } else {
                studentName = this.gruppen[this.selectedSource][this.selectedStudentIndex];
                this.gruppen[this.selectedSource].splice(this.selectedStudentIndex, 1);
            }

            // 2. In neue Box einfügen
            if (targetIndex === -1) {
                this.unassigned.push(studentName);
            } else {
                this.gruppen[targetIndex].push(studentName);
            }

            // 3. Auswahl leeren und speichern
            this.selectedStudentIndex = null;
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
                    <button @click="showList = !showList" style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:white; border-radius:4px; padding:6px; cursor:pointer;" title="Schülerliste bearbeiten">⚙️</button>
                </div>

                <textarea v-if="showList" v-model="schuelerText" @input="saveState" style="width:100%; height:80px; flex-shrink:0; background:rgba(0,0,0,0.3); color:white; border:1px solid var(--widget-border); border-radius:4px; padding:5px; resize:none; font-family:inherit; box-sizing:border-box;" placeholder="Namen (einer pro Zeile)"></textarea>

                <div style="display:flex; gap:10px; flex-shrink:0; align-items:center; background:rgba(0,0,0,0.1); padding:8px; border-radius:6px;">
                    <label style="font-size:0.85rem; color:#cbd5e1;">
                        {{ modus === 'anzahl' ? 'Wie viele Gruppen?' : (modus === 'groesse' ? 'Schüler pro Gruppe?' : 'Gruppen insgesamt:') }}
                    </label>
                    <input type="number" min="1" v-model="parameter" @change="updateManuellGroups" style="width:50px; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:4px; padding:4px; text-align:center; font-weight:bold;">
                    
                    <button v-if="modus !== 'manuell'" @click="generiereGruppen" style="background:#10b981; color:white; border:none; border-radius:4px; padding:4px 12px; cursor:pointer; font-weight:bold; margin-left:auto; box-shadow:0 2px 4px rgba(0,0,0,0.2);">🎲 Auslosen</button>
                    <span v-else style="font-size:0.75rem; color:#94a3b8; margin-left:auto; font-style:italic;">(Namen antippen, dann Ziel antippen)</span>
                </div>

                <div v-if="modus === 'manuell'" 
                     @click="moveToGroup(-1)"
                     style="background:rgba(245, 158, 11, 0.1); border-radius:6px; flex-shrink:0; padding:8px; display:flex; flex-wrap:wrap; gap:6px; min-height:45px; align-items:center; transition: all 0.2s;"
                     :style="{ 
                         border: selectedStudentIndex !== null ? '2px dashed #ef4444' : '1px dashed rgba(245, 158, 11, 0.4)',
                         cursor: selectedStudentIndex !== null ? 'pointer' : 'default'
                     }">
                    
                    <div v-if="unassigned.length === 0" style="color:rgba(251, 191, 36, 0.5); font-size:0.8rem; width:100%; text-align:center; pointer-events:none;">Alle Schüler sind eingeteilt! 🎉</div>
                    
                    <span v-for="(name, sIndex) in unassigned" :key="'u-' + sIndex"
                          @click.stop="selectStudent(sIndex, -1)"
                          style="padding:3px 10px; border-radius:12px; font-size:0.85rem; font-weight:600; transition:all 0.2s;"
                          :style="{
                              cursor: 'pointer',
                              background: (selectedSource === -1 && selectedStudentIndex === sIndex) ? '#ef4444' : 'rgba(245, 158, 11, 0.2)',
                              border: (selectedSource === -1 && selectedStudentIndex === sIndex) ? '1px solid #dc2626' : '1px solid rgba(245, 158, 11, 0.4)',
                              color: (selectedSource === -1 && selectedStudentIndex === sIndex) ? 'white' : '#fcd34d',
                              transform: (selectedSource === -1 && selectedStudentIndex === sIndex) ? 'scale(1.1)' : 'scale(1)',
                              boxShadow: (selectedSource === -1 && selectedStudentIndex === sIndex) ? '0 0 10px rgba(239,68,68,0.8)' : '0 2px 2px rgba(0,0,0,0.1)'
                          }">
                          {{ name }}
                    </span>
                </div>
            </template>

            <div style="flex:1; overflow-y:auto; display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px; align-items:start;"
                 :style="{ paddingRight: widgetData.isTransparent ? '0' : '5px' }" class="custom-scrollbar">
                
                <div v-for="(gruppe, index) in gruppen" :key="index"
                     @click="moveToGroup(index)"
                     :style="{
                        background: widgetData.isTransparent ? 'rgba(15, 23, 42, 0.9)' : (selectedStudentIndex !== null ? 'rgba(239, 68, 68, 0.05)' : 'rgba(59, 130, 246, 0.1)'),
                        border: widgetData.isTransparent ? '1px solid rgba(255,255,255,0.2)' : (selectedStudentIndex !== null ? '2px dashed #ef4444' : '1px solid rgba(59, 130, 246, 0.3)'),
                        borderRadius: '8px',
                        padding: '10px',
                        minHeight: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: widgetData.isTransparent ? '0 4px 8px rgba(0,0,0,0.6)' : 'inset 0 2px 10px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        cursor: (modus === 'manuell' && !widgetData.isTransparent && selectedStudentIndex !== null) ? 'pointer' : 'default'
                     }">
                     
                     <div :style="{
                        fontWeight: 'bold',
                        fontSize: widgetData.isTransparent ? '1rem' : '0.9rem',
                        color: widgetData.isTransparent ? 'white' : '#93c5fd',
                        marginBottom: '8px',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                        paddingBottom: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        textShadow: widgetData.isTransparent ? '0px 1px 3px rgba(0,0,0,0.8)' : 'none',
                        pointerEvents: 'none'
                     }">
                         <span>Gruppe {{ index + 1 }}</span>
                         <span v-if="!widgetData.isTransparent" style="font-size:0.7rem; background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:10px;">{{ gruppe.length }}</span>
                     </div>
                     
                     <div style="display:flex; flex-direction:column; gap:6px; flex:1;">
                         <span v-for="(name, sIndex) in gruppe" :key="'g-' + index + '-' + sIndex"
                               @click.stop="selectStudent(sIndex, index)"
                               style="padding:4px 8px; border-radius:4px; font-size:0.85rem; transition: all 0.2s;"
                               :style="{
                                   cursor: (!widgetData.isTransparent && modus === 'manuell') ? 'pointer' : 'default',
                                   background: (selectedSource === index && selectedStudentIndex === sIndex) ? '#ef4444' : 'rgba(255,255,255,0.08)',
                                   color: 'white',
                                   border: (selectedSource === index && selectedStudentIndex === sIndex) ? '1px solid #dc2626' : '1px solid rgba(255,255,255,0.05)',
                                   transform: (selectedSource === index && selectedStudentIndex === sIndex) ? 'scale(1.05)' : 'scale(1)',
                                   boxShadow: (selectedSource === index && selectedStudentIndex === sIndex) ? '0 0 10px rgba(239,68,68,0.8)' : 'none'
                               }">
                             {{ name }}
                         </span>
                         
                         <div v-if="gruppe.length === 0 && !widgetData.isTransparent" style="color:rgba(255,255,255,0.2); font-size:0.75rem; font-style:italic; text-align:center; margin-top:10px; pointer-events:none;">(Leer)</div>
                     </div>
                </div>
            </div>

            <div v-if="gruppen.length === 0 && widgetData.isTransparent" style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 20px; font-style: italic;">
                Noch keine Gruppen ausgelost...
            </div>

        </div>
    `
};