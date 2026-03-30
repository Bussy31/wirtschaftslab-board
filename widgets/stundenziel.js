const StundenzielWidget = {
    props: ['widgetData'],
    template: `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; container-type: size; position: relative; overflow: hidden;">
            
            <div v-show="!widgetData.isTransparent" 
                 style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 5px; flex-shrink: 0; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 8px;">
                
                <button @click="importFromHandlungsplan" 
                        @mousedown.stop @touchstart.stop
                        style="background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.65rem; font-weight: 700;">
                    📋 IMPORT HP
                </button>

                <div style="display: flex; align-items: center; gap: 2px; border-left: 1px solid rgba(255,255,255,0.2); border-right: 1px solid rgba(255,255,255,0.2); padding: 0 8px;">
                    <button @click="changeFontSize(-5)" @mousedown.stop @touchstart.stop
                            style="background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; width: 15px; height: 15px; cursor: pointer; font-weight: bold;">-</button>
                    <span style="color: #94a3b8; font-size: 0.65rem; min-width: 30px; text-align: center;">TEXT</span>
                    <button @click="changeFontSize(5)" @mousedown.stop @touchstart.stop
                            style="background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; font-weight: bold;">+</button>
                </div>
                
                <button @click="isEditing = !isEditing" 
                        @mousedown.stop @touchstart.stop
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.65rem; font-weight: 700;">
                    {{ isEditing ? '✅ OK' : '✏️ EDIT' }}
                </button>
            </div>

            <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%; overflow: hidden;">
                
                <textarea v-if="isEditing" 
                          v-model="widgetData.zielText" 
                          @mousedown.stop @touchstart.stop
                          @input="$emit('save')"
                          placeholder="Stundenziel eingeben..."
                          style="width: 95%; height: 90%; background: rgba(0,0,0,0.3); color: white; border: 1px dashed rgba(255,255,255,0.3); border-radius: 12px; padding: 10px; font-family: inherit; font-size: 1.1rem; resize: none; text-align: center; outline: none;"></textarea>
                
                <div v-else 
                     @click="isEditing = true"
                     @mousedown.stop @touchstart.stop
                     :style="{ 
                        fontSize: (widgetData.fontSize || 30) + 'px', 
                        lineHeight: '1.2',
                        fontWeight: '700',
                        textShadow: widgetData.isTransparent ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none'
                     }"
                     style="color: #ffffff; cursor: pointer; padding: 5px; width: 100%; word-wrap: break-word; overflow-y: auto;">
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
        if (this.widgetData.zielText === undefined) this.widgetData.zielText = "";
        if (this.widgetData.fontSize === undefined) this.widgetData.fontSize = 40; // Standardstartwert
    },
    methods: {
        changeFontSize(delta) {
            let current = this.widgetData.fontSize || 40;
            this.widgetData.fontSize = Math.max(10, Math.min(200, current + delta));
            this.$emit('save');
        },
        importFromHandlungsplan() {
            const allWidgets = this.$root.widgets;
            const hpWidget = allWidgets.find(w => w.type === 'handlungsplan');

            if (hpWidget && hpWidget.schritte && hpWidget.schritte.length > 0) {
                const nextStep = hpWidget.schritte.find(s => !s.done);
                this.widgetData.zielText = nextStep ? nextStep.text : hpWidget.schritte[hpWidget.schritte.length - 1].text;
                this.isEditing = false;
                this.$emit('save');
            } else {
                alert("Kein aktiver Handlungsplan gefunden!");
            }
        }
    }
};