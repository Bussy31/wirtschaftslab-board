const ArbeitsphaseWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; overflow: hidden; position: relative; container-type: size;">
            
            <div v-if="showList" style="display: flex; flex-direction: column; gap: 6px; height: 100%; overflow-y: auto;" class="custom-scrollbar">
                <div style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-bottom: 5px; font-weight: 600;">Phase wählen:</div>
                
                <div v-for="phase in phasen" :key="phase.id" 
                     @click="selectPhase(phase.id)"
                     style="flex: 1; min-height: 35px; display: flex; align-items: center; justify-content: flex-start; padding-left: 10%; gap: 15px; border-radius: 8px; cursor: pointer; transition: background 0.2s ease; background-color: rgba(255,255,255,0.05);">
                     
                     <span style="font-size: 1.5rem;">{{ phase.icon }}</span>
                     <span style="font-size: 1rem; font-weight: 600; color: #e2e8f0;">{{ phase.label }}</span>
                </div>
            </div>

            <div v-else 
                 @click="showList = true"
                 :style="{ backgroundColor: activePhaseData.color + '15', borderColor: activePhaseData.color, boxShadow: '0 8px 24px ' + activePhaseData.color + '20' }"
                 style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid; cursor: pointer; transition: all 0.3s ease; text-align: center; position: relative;">
                 
                 <div style="position: absolute; top: 8px; right: 8px; color: #94a3b8; font-size: 0.7rem; opacity: 0.6;">🔄 Ändern</div>
                 
                 <span style="font-size: clamp(3rem, 35cqmin, 8rem); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)); line-height: 1.2;">{{ activePhaseData.icon }}</span>
                 
                 <span :style="{ color: activePhaseData.color }" style="font-size: clamp(1.2rem, 12cqmin, 3rem); font-weight: bold; margin-top: 5px; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                     {{ activePhaseData.label }}
                 </span>
                 
            </div>

        </div>
    `,
    data() {
        return {
            showList: false, // Startet im Anzeige-Modus, wenn schon was gewählt ist
            phasen: [
                { id: 'plenum', icon: '🗣️', label: 'Plenum', color: '#8b5cf6' },
                { id: 'einzel', icon: '👤', label: 'Einzelarbeit', color: '#3b82f6' },
                { id: 'partner', icon: '👥', label: 'Partnerarbeit', color: '#10b981' },
                { id: 'gruppe', icon: '🧑‍🤝‍🧑', label: 'Gruppenarbeit', color: '#f59e0b' },
                { id: 'klausur', icon: '🤫', label: 'Ruhephase', color: '#ef4444' }
            ]
        }
    },
    computed: {
        activePhaseData() {
            // Findet die Daten zur aktuell gespeicherten Phase
            return this.phasen.find(p => p.id === this.widgetData.activePhase) || this.phasen[0];
        }
    },
    created() {
        // Wenn das Widget ganz neu ist, zeige die Liste an
        if (!this.widgetData.activePhase) {
            this.widgetData.activePhase = 'plenum';
            this.showList = true;
        }
    },
    methods: {
        selectPhase(id) {
            this.widgetData.activePhase = id;
            this.$emit('save'); // Speichert den Stand auf dem Board
            this.showList = false; // Wechselt sofort in den Groß-Modus
        }
    }
};