const HandlungsplanWidget = {
    props: ['widgetData'],
    template: `
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%; padding: 5px; box-sizing: border-box;">
            
            <div v-if="schritte.length > 0" style="height: 10px; min-height: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; overflow: hidden; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                <div :style="{ width: progress + '%', background: progress === 100 ? '#10b981' : '#3b82f6', height: '100%', transition: 'width 0.4s ease, background 0.4s ease' }"></div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;" v-if="schritte.length > 0">
                <button @click="toggleModus" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 8px; color: white; cursor: pointer; font-size: 0.8rem; transition: background 0.2s;">
                    {{ isVisual ? '📋 Zurück zur Liste' : '🗺️ Visueller Pfad' }}
                </button>
            </div>

            <div v-if="!isVisual" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; padding-right: 5px;">
                <div v-for="(schritt, index) in schritte" :key="index" 
                     style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 8px; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.05);">
                    
                    <input type="checkbox" :checked="schritt.done" @change="toggleSchritt(index)" style="cursor: pointer; width: 20px; height: 20px; accent-color: #10b981;">
                    
                    <span :style="{ textDecoration: schritt.done ? 'line-through' : 'none', color: schritt.done ? 'rgba(255,255,255,0.3)' : 'white', flexGrow: 1, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s' }"
                          @click="toggleSchritt(index)">
                        {{ schritt.text }}
                    </span>

                    <button @click.stop="removeSchritt(index)" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; opacity: 0.6; padding: 0;" title="Schritt löschen">✖</button>
                </div>
                
                <div v-if="schritte.length === 0" style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 20px; font-style: italic;">
                    Noch keine Schritte geplant...
                </div>
            </div>

            <div v-if="isVisual" style="flex-grow: 1; overflow-y: auto; overflow-x: hidden; display: flex; flex-wrap: wrap; align-items: center; align-content: flex-start; gap: 10px; margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 8px;">
                
                <template v-for="(schritt, index) in schritte" :key="'vis_'+index">
                    
                    <div @click="toggleSchritt(index)" 
                         :style="{
                            background: schritt.done ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                            border: schritt.done ? '2px solid rgba(16, 185, 129, 0.4)' : '2px solid rgba(59, 130, 246, 0.6)',
                            color: schritt.done ? 'rgba(255,255,255,0.3)' : 'white',
                            textDecoration: schritt.done ? 'line-through' : 'none',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            boxShadow: schritt.done ? 'none' : '0 4px 6px rgba(0,0,0,0.3)'
                         }">
                        {{ index + 1 }}. {{ schritt.text }}
                    </div>

                    <div v-if="index < schritte.length - 1" 
                         :style="{
                            color: schritt.done ? '#10b981' : 'rgba(255,255,255,0.3)',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            transition: 'color 0.3s'
                         }">
                        ➔
                    </div>

                </template>
            </div>

            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <input type="text" v-model="neuerSchritt" @keyup.enter="addSchritt" placeholder="Neuer Schritt..." 
                       style="flex-grow: 1; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; font-size: 1rem; outline: none;">
                <button @click="addSchritt" style="background: #3b82f6; border: none; padding: 0 15px; border-radius: 8px; color: white; cursor: pointer; font-size: 1.2rem; transition: background 0.2s;" title="Hinzufügen">
                    ➕
                </button>
            </div>
        </div>
    `,
    data() {
        return {
            schritte: this.widgetData.schritte || [],
            neuerSchritt: '',
            isVisual: this.widgetData.isVisual || false
        }
    },
    computed: {
        progress() {
            if (this.schritte.length === 0) return 0;
            const doneCount = this.schritte.filter(s => s.done).length;
            return Math.round((doneCount / this.schritte.length) * 100);
        }
    },
    methods: {
        addSchritt() {
            if (this.neuerSchritt.trim() === '') return;
            this.schritte.push({ text: this.neuerSchritt.trim(), done: false });
            this.neuerSchritt = '';
            this.saveState();
        },
        toggleSchritt(index) {
            this.schritte[index].done = !this.schritte[index].done;
            this.saveState();
        },
        removeSchritt(index) {
            if(confirm('Diesen Schritt wirklich löschen?')) {
                this.schritte.splice(index, 1);
                // Wenn wir alle löschen, schalten wir sicherheitshalber die visuelle Ansicht aus
                if(this.schritte.length === 0) this.isVisual = false;
                this.saveState();
            }
        },
        toggleModus() {
            this.isVisual = !this.isVisual;
            this.saveState();
        },
        saveState() {
            this.widgetData.schritte = this.schritte;
            this.widgetData.isVisual = this.isVisual;
            this.$emit('save');
        }
    }
};