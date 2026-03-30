const StundenzielWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; container-type: size; position: relative; overflow: hidden;">
            
            <div v-show="!widgetData.isTransparent" 
                 style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 5px; flex-shrink: 0;">
                
                <button @click="importFromHandlungsplan" 
                        @mousedown.stop @touchstart.stop
                        style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px;">
                    📋 IMPORT HANDLUNGSPLAN
                </button>
                
                <button @click="isEditing = !isEditing" 
                        @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px;">
                    {{ isEditing ? '✅ FERTIG' : '✏️ ÄNDERN' }}
                </button>
            </div>

            <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%; overflow: hidden;">
                
                <textarea v-if="isEditing" 
                          v-model="widgetData.zielText" 
                          @mousedown.stop @touchstart.stop
                          @input="$emit('save')"
                          placeholder="Stundenziel hier eingeben..."
                          style="width: 95%; height: 90%; background: rgba(0,0,0,0.3); color: white; border: 1px dashed rgba(255,255,255,0.3); border-radius: 12px; padding: 10px; font-family: inherit; font-size: 1.1rem; resize: none; text-align: center; outline: none;"></textarea>
                
                <div v-else 
                     @click="isEditing = true"
                     @mousedown.stop @touchstart.stop
                     :style="{ 
                        fontSize: 'clamp(1.2rem, 10cqmin, 4.5rem)', 
                        lineHeight: '1.2',
                        fontWeight: '700',
                        textShadow: widgetData.isTransparent ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none'
                     }"
                     style="color: #ffffff; cursor: pointer; padding: 5px; width: 100%; word-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden;">
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
            const allWidgets = this.$root.widgets;
            const hpWidget = allWidgets.find(w => w.type === 'handlungsplan');

            if (hpWidget && hpWidget.schritte && hpWidget.schritte.length > 0) {
                const nextStep = hpWidget.schritte.find(s => !s.done);
                if (nextStep) {
                    this.widgetData.zielText = nextStep.text;
                } else {
                    this.widgetData.zielText = hpWidget.schritte[hpWidget.schritte.length - 1].text;
                }
                this.isEditing = false;
                this.$emit('save');
            } else {
                alert("Kein aktiver Handlungsplan gefunden!");
            }
        }
    }
};