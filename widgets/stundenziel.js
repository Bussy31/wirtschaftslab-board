const StundenzielWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; container-type: size; position: relative; overflow: hidden;">
            
            <div v-show="!widgetData.isTransparent" 
                 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                
                <div style="display: flex; gap: 8px;">
                    <button @click="importFromHandlungsplan" 
                            @mousedown.stop @touchstart.stop
                            title="Vom Handlungsplan übernehmen"
                            style="background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
                        <span>📋</span> IMPORT
                    </button>
                    
                    <button @click="isEditing = !isEditing" 
                            @mousedown.stop @touchstart.stop
                            style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all 0.2s;">
                        {{ isEditing ? '✅ FERTIG' : '✏️ ÄNDERN' }}
                    </button>
                </div>
            </div>

            <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%;">
                
                <textarea v-if="isEditing" 
                          v-model="widgetData.zielText" 
                          @mousedown.stop @touchstart.stop
                          @input="$emit('save')"
                          placeholder="Stundenziel hier eingeben..."
                          style="width: 90%; height: 80%; background: rgba(0,0,0,0.3); color: white; border: 2px dashed rgba(59, 130, 246, 0.5); border-radius: 12px; padding: 15px; font-family: inherit; font-size: 1.2rem; resize: none; text-align: center;"></textarea>
                
                <div v-else 
                     @click="isEditing = true"
                     @mousedown.stop @touchstart.stop
                     :style="{ 
                        fontSize: 'clamp(1.5rem, 12cqw, 8rem)', 
                        lineHeight: '1.1',
                        fontWeight: '700',
                        textShadow: widgetData.isTransparent ? '2px 2px 10px rgba(0,0,0,0.5)' : 'none'
                     }"
                     style="color: #ffffff; cursor: pointer; padding: 10px; width: 100%; word-wrap: break-word;">
                    {{ widgetData.zielText || 'Ziel eintragen...' }}
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
            // Root-Board nach dem Handlungsplan durchsuchen
            const allWidgets = this.$root.widgets;
            const hpWidget = allWidgets.find(w => w.type === 'handlungsplan');

            if (hpWidget && hpWidget.schritte && hpWidget.schritte.length > 0) {
                // Den ersten nicht erledigten Schritt finden
                const nextStep = hpWidget.schritte.find(s => !s.done);

                if (nextStep) {
                    this.widgetData.zielText = nextStep.text;
                    this.isEditing = false;
                    this.$emit('save');
                } else {
                    // Falls alles fertig ist, den letzten Schritt zeigen
                    this.widgetData.zielText = hpWidget.schritte[hpWidget.schritte.length - 1].text;
                    this.$emit('save');
                }
            } else {
                alert("Kein aktiver Handlungsplan gefunden!");
            }
        }
    }
};