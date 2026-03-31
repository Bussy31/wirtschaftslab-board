const NotizWidget = {
    props: ['widgetData'],
    template: `
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%;">
            
            <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px; align-items: center;">
                
                <button @mousedown.prevent="format('bold')" title="Fett" style="padding: 4px 10px; min-width: unset;">F</button>
                <button @mousedown.prevent="format('italic')" title="Kursiv" style="padding: 4px 10px; min-width: unset;"><i>K</i></button>
                <button @mousedown.prevent="format('underline')" title="Unterstrichen" style="padding: 4px 10px; min-width: unset;"><u>U</u></button>
                
                <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.2); margin: 0 2px;"></div>
                
                <button @mousedown.prevent="format('insertUnorderedList')" title="Aufzählung" style="padding: 4px 10px; min-width: unset;">• Liste</button>
                
                <select @change="format('fontSize', $event.target.value)" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 4px; outline: none; cursor: pointer;">
                    <option value="3" style="background: #1e293b; color: white;">Normal</option>
                    <option value="4" style="background: #1e293b; color: white;">Groß</option>
                    <option value="5" style="background: #1e293b; color: white;">Sehr Groß</option>
                </select>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">
                    <span style="font-size: 0.9rem; font-weight: bold; color: white;">A</span>
                    <input type="color" value="#ffffff" @change="format('foreColor', $event.target.value)" title="Textfarbe" style="width: 25px; height: 25px; padding: 0; border: none; background: none; cursor: pointer;">
                </div>
                
                <div style="display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">
                    <span style="font-size: 0.9rem; background: yellow; color: black; padding: 0 2px; border-radius: 2px;">A</span>
                    <input type="color" value="#ffff00" @change="format('hiliteColor', $event.target.value)" title="Hintergrundfarbe (Textmarker)" style="width: 25px; height: 25px; padding: 0; border: none; background: none; cursor: pointer;">
                </div>

                <div style="flex-grow: 1;"></div>
                <button @mousedown.prevent="clearAll" title="Alles löschen" style="padding: 4px 10px; min-width: unset; background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); color: #fca5a5;">🗑️</button>
            </div>

            <div ref="editor" 
                 contenteditable="true" 
                 @mousedown.stop 
                 @touchstart.stop
                 @input="onInput"
                 @mouseup="saveSelection"
                 @keyup="saveSelection"
                 @blur="saveSelection"
                 style="flex-grow: 1; outline: none; overflow-y: auto; padding: 5px; background: transparent; color: white; font-family: inherit; font-size: 1rem; line-height: 1.5; word-wrap: break-word; cursor: text;"
                 class="custom-scrollbar">
            </div>
        </div>
    `,
    data() {
        return {
            savedRange: null // Speichert den markierten Text
        }
    },
    mounted() {
        if (!this.widgetData.data || this.widgetData.data === 'Hier tippen...') {
            this.$refs.editor.innerHTML = '';
        } else {
            this.$refs.editor.innerHTML = this.widgetData.data;
        }
    },
    methods: {
        // Merkt sich, welcher Text gerade markiert ist
        saveSelection() {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                this.savedRange = sel.getRangeAt(0);
            }
        },
        // Stellt die Markierung wieder her (wichtig nach dem Klick in die Farbauswahl)
        restoreSelection() {
            if (this.savedRange) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(this.savedRange);
            }
        },
        format(command, value = null) {
            if (command === 'hiliteColor' && !document.queryCommandSupported('hiliteColor')) {
                command = 'backColor';
            }
            // Zuerst Markierung wiederherstellen, dann formatieren
            this.restoreSelection();
            document.execCommand(command, false, value);
            this.$refs.editor.focus();
            this.onInput();
        },
        onInput() {
            const html = this.$refs.editor.innerHTML;
            if (this.widgetData.data !== html) {
                this.widgetData.data = html;
                this.$emit('save');
            }
        },
        clearAll() {
            if (confirm("Möchtest du wirklich den gesamten Text dieser Notiz löschen?")) {
                this.$refs.editor.innerHTML = '';
                this.onInput();
            }
        }
    }
};