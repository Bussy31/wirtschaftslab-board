const StundenzielWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 15px; box-sizing: border-box; container-type: size; position: relative;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">🎯</span>
                    <span style="font-weight: 600; color: #94a3b8; font-size: 0.8rem; uppercase; letter-spacing: 1px;">STUNDENZIEL</span>
                </div>
                
                <div style="display: flex; gap: 5px;">
                    <button @click="importFromHandlungsplan" 
                            @mousedown.stop @touchstart.stop
                            title="Vom Handlungsplan übernehmen"
                            style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #60a5fa; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
                        <span>📋</span> Import
                    </button>
                    
                    <button @click="isEditing = !isEditing" 
                            @mousedown.stop @touchstart.stop
                            style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;">
                        {{ isEditing ? '✅ Fertig' : '✏️ Ändern' }}
                    </button>
                </div>
            </div>

            <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center;">
                
                <textarea v-if="isEditing" 
                          v-model="widgetData.zielText" 
                          @mousedown.stop @touchstart.stop
                          @input="$emit('save')"
                          placeholder="Was ist das Ziel dieser Stunde?"
                          style="width: 100%; height: 80%; background: rgba(0,0,0,0.2); color: white; border: 1px dashed rgba(255,255,255,0.3); border-radius: 8px; padding: 10px; font-family: inherit; font-size: 1.1rem; resize: none;"></textarea>
                
                <div v-else 
                     @click="isEditing = true"
                     @mousedown.stop @touchstart.stop
                     :style="{ fontSize: 'clamp(1rem, 8cqmin, 2.5rem)' }"
                     style="color: #f8fafc; font-weight: 500; line-height: 1.3; cursor: pointer; padding: 10px; width: 100%;">
                    {{ widgetData.zielText || 'Klicke hier, um ein Ziel einzutragen...' }}
                </div>

            </div>

        </div>
    `,
    data() {
        return {
            isEditing: false
        }
    },
    created() {
        if (this.widgetData.zielText === undefined) {
            this.widgetData.zielText = "";
        }
    },
    methods: {
        importFromHandlungsplan() {
            // Wir suchen in der Haupt-App ($root) nach dem Handlungsplan-Widget
            const allWidgets = this.$root.widgets;
            const hpWidget = allWidgets.find(w => w.type === 'handlungsplan');

            if (hpWidget && hpWidget.schritte && hpWidget.schritte.length > 0) {
                // Suche den ersten Schritt, der noch NICHT erledigt (done) ist
                const nextStep = hpWidget.schritte.find(s => !s.done);

                if (nextStep) {
                    this.widgetData.zielText = nextStep.text;
                    this.isEditing = false; // Direkt in den Anzeige-Modus wechseln
                    this.$emit('save');
                } else {
                    // Falls alle erledigt sind, nimm den letzten
                    this.widgetData.zielText = hpWidget.schritte[hpWidget.schritte.length - 1].text;
                    this.$emit('save');
                }
            } else {
                alert("Kein aktiver Handlungsplan mit Schritten gefunden!");
            }
        }
    }
};