const GruppenWidget = {
    props: ['widgetData'],
    template: `
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; overflow: hidden; position: relative; container-type: size;">
            
            <div v-if="showList" style="display: flex; flex-direction: column; gap: 10px; height: 100%; overflow-y: auto;" class="custom-scrollbar">
                
                <div style="display: flex; gap: 5px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 8px;">
                    <button @click="switchMode('anzahl')" :style="{ flex: 1, padding: '8px', fontSize: '0.9rem', background: modus === 'anzahl' ? 'var(--button-color)' : 'transparent', color: 'var(--text-color)' }">Anzahl</button>
                    <button @click="switchMode('groesse')" :style="{ flex: 1, padding: '8px', fontSize: '0.9rem', background: modus === 'groesse' ? 'var(--button-color)' : 'transparent', color: 'var(--text-color)' }">Größe</button>
                    <button @click="switchMode('manuell')" :style="{ flex: 1, padding: '8px', fontSize: '0.9rem', background: modus === 'manuell' ? 'var(--button-color)' : 'transparent', color: 'var(--text-color)' }">Manuell</button>
                </div>

                <div v-if="modus !== 'manuell'" style="display: flex; align-items: center; gap: 10px;">
                    <label style="color: var(--text-color); font-size: 0.9rem;">{{ modus === 'anzahl' ? 'Anzahl der Gruppen:' : 'Personen pro Gruppe:' }}</label>
                    <input type="number" v-model.number="parameter" min="1" max="20" style="width: 60px; padding: 5px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: var(--text-color); border-radius: 4px; text-align: center;">
                </div>

                <textarea v-model="schuelerText" placeholder="Schülernamen einfügen (einer pro Zeile)..." style="flex-grow: 1; min-height: 100px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-color); padding: 10px; border-radius: 8px; resize: none; font-family: inherit; font-size: 0.9rem; line-height: 1.5; outline: none;"></textarea>

                <div style="display: flex; gap: 10px;">
                    <button v-if="modus !== 'manuell'" @click="generateGroups" style="flex: 2; padding: 10px; background: var(--button-color); color: var(--text-color); font-weight: bold;">Zufällig Einteilen</button>
                    <button v-if="modus === 'manuell'" @click="setupManual" style="flex: 2; padding: 10px; background: var(--button-color); color: var(--text-color); font-weight: bold;">Listen vorbereiten</button>
                    <button @click="showList = false" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: var(--text-color);">Abbrechen</button>
                </div>
            </div>

            <div v-else @click="openSettings" @mousedown.stop @touchstart.stop style="display: flex; gap: 10px; height: 100%; overflow-x: auto; padding-bottom: 5px; align-items: stretch;" class="custom-scrollbar">
                
                <div v-if="modus === 'manuell' && unassigned.length > 0 && !widgetData.isTransparent" style="min-width: 150px; flex: 1; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px; border: 1px dashed rgba(255,255,255,0.2);">
                    <div style="font-weight: bold; font-size: 1rem; color: #fca5a5; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; margin-bottom: 5px;">Ohne Gruppe</div>
                    
                    <div style="overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 6px;" class="custom-scrollbar">
                        <span v-for="(name, index) in unassigned" :key="'u'+index" 
                              @click.stop="selectStudent('unassigned', index)"
                              :style="{
                                  padding: '6px 10px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.9rem', 
                                  textAlign: 'center', 
                                  transition: 'all 0.2s',
                                  cursor: 'pointer',
                                  background: (selectedSource === 'unassigned' && selectedStudentIndex === index) ? '#ef4444' : 'rgba(255,255,255,0.08)',
                                  color: 'var(--text-color)',
                                  border: (selectedSource === 'unassigned' && selectedStudentIndex === index) ? '1px solid #dc2626' : '1px solid rgba(255,255,255,0.05)',
                                  transform: (selectedSource === 'unassigned' && selectedStudentIndex === index) ? 'scale(1.05)' : 'scale(1)',
                                  boxShadow: (selectedSource === 'unassigned' && selectedStudentIndex === index) ? '0 0 10px rgba(239,68,68,0.8)' : 'none'
                              }">
                            {{ name }}
                        </span>
                    </div>
                </div>

                <div v-for="(gruppe, index) in gruppen" :key="index" 
                     @click.stop="moveToGroup(index)"
                     :style="{ 
                         minWidth: '150px', 
                         flex: 1, 
                         background: widgetData.isTransparent ? 'transparent' : 'rgba(255,255,255,0.05)', 
                         borderRadius: '8px', 
                         padding: '10px', 
                         display: 'flex', 
                         flexDirection: 'column', 
                         gap: '8px',
                         border: (selectedSource !== null && modus === 'manuell') ? '1px dashed var(--button-color)' : 'none',
                         cursor: (selectedSource !== null && modus === 'manuell') ? 'pointer' : 'default'
                     }">
                     
                     <div style="font-weight: bold; font-size: 1.1rem; color: var(--button-color); text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; margin-bottom: 5px;">
                        Gruppe {{ index + 1 }}
                     </div>
                     
                     <div style="overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 6px;" class="custom-scrollbar">
                         <span v-for="(name, sIndex) in gruppe" :key="sIndex" 
                               @click.stop="modus === 'manuell' ? selectStudent(index, sIndex) : null"
                               :style="{
                                   padding: '6px 10px', 
                                   borderRadius: '6px', 
                                   fontSize: '0.9rem', 
                                   textAlign: 'center', 
                                   transition: 'all 0.2s',
                                   cursor: (!widgetData.isTransparent && modus === 'manuell') ? 'pointer' : 'default',
                                   background: (selectedSource === index && selectedStudentIndex === sIndex) ? '#ef4444' : 'rgba(255,255,255,0.08)',
                                   color: 'var(--text-color)',
                                   border: (selectedSource === index && selectedStudentIndex === sIndex) ? '1px solid #dc2626' : '1px solid rgba(255,255,255,0.05)',
                                   transform: (selectedSource === index && selectedStudentIndex === sIndex) ? 'scale(1.05)' : 'scale(1)',
                                   boxShadow: (selectedSource === index && selectedStudentIndex === sIndex) ? '0 0 10px rgba(239,68,68,0.8)' : 'none'
                               }">
                             {{ name }}
                         </span>
                         
                         <div v-if="gruppe.length === 0 && !widgetData.isTransparent" style="color: rgba(255,255,255,0.3); font-size: 0.85rem; font-style: italic; text-align: center; margin-top: 10px; pointer-events: none;">(Leer)</div>
                     </div>
                </div>
            </div>

            <div v-if="gruppen.length === 0 && widgetData.isTransparent && !showList" style="text-align: center; color: var(--text-color); margin-top: 20px;">
                Klicken zum Einrichten
            </div>

        </div>
    `,
    data() {
        return {
            modus: this.widgetData.modus || 'anzahl',
            parameter: this.widgetData.parameter || 4,
            gruppen: this.widgetData.gruppen || [],
            unassigned: this.widgetData.unassigned || [],
            schuelerText: this.widgetData.schuelerListe || '',
            showList: false,
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
                this.setupManual();
            } else {
                this.showList = true;
            }
        },
        openSettings() {
            if (this.modus === 'manuell' && this.selectedSource !== null) {
                return; // Wenn man gerade verschiebt, nicht die Einstellungen öffnen
            }
            this.showList = true;
        },
        setupManual() {
            this.gruppen = [];
            let numGroups = parseInt(this.parameter) || 4;
            for (let i = 0; i < numGroups; i++) this.gruppen.push([]);

            // Namen, die es schon gibt, in Unassigned packen (vermeidet Duplikate)
            const aktuelleNamen = this.getNamen();
            this.unassigned = [...aktuelleNamen];

            this.showList = false;
            this.selectedStudentIndex = null;
            this.selectedSource = null;
            this.saveState();
        },
        generateGroups() {
            let namen = this.getNamen();
            if (namen.length === 0) return;

            // Mischen (Fisher-Yates)
            for (let i = namen.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [namen[i], namen[j]] = [namen[j], namen[i]];
            }

            this.gruppen = [];
            let numGroups = 0;

            if (this.modus === 'anzahl') {
                numGroups = parseInt(this.parameter) || 4;
                for (let i = 0; i < numGroups; i++) this.gruppen.push([]);
                namen.forEach((name, index) => {
                    this.gruppen[index % numGroups].push(name);
                });
            } else if (this.modus === 'groesse') {
                let size = parseInt(this.parameter) || 4;
                numGroups = Math.ceil(namen.length / size);
                for (let i = 0; i < numGroups; i++) {
                    this.gruppen.push(namen.slice(i * size, (i + 1) * size));
                }
            }

            this.unassigned = [];
            this.showList = false;
            this.saveState();
        },
        selectStudent(sourceIndex, studentIndex) {
            if (this.selectedSource === sourceIndex && this.selectedStudentIndex === studentIndex) {
                // Abwählen
                this.selectedSource = null;
                this.selectedStudentIndex = null;
            } else {
                // Auswählen
                this.selectedSource = sourceIndex;
                this.selectedStudentIndex = studentIndex;
            }
        },
        moveToGroup(targetGroupIndex) {
            if (this.selectedSource === null || this.modus !== 'manuell') return;

            let studentName = '';

            // Aus alter Liste entfernen
            if (this.selectedSource === 'unassigned') {
                studentName = this.unassigned.splice(this.selectedStudentIndex, 1)[0];
            } else {
                studentName = this.gruppen[this.selectedSource].splice(this.selectedStudentIndex, 1)[0];
            }

            // In neue Gruppe einfügen
            this.gruppen[targetGroupIndex].push(studentName);

            // Auswahl zurücksetzen
            this.selectedSource = null;
            this.selectedStudentIndex = null;

            this.saveState();
        }
    }
};