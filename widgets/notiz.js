const NotizWidget = {
    props: ['widgetData'],
    template: `
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%;">
            
            <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 8px; align-items: center;">
                
                <button @mousedown.prevent="format('bold')" title="Fett" style="padding: 4px 10px; min-width: unset;"><b>B</b></button>
                <button @mousedown.prevent="format('italic')" title="Kursiv" style="padding: 4px 10px; min-width: unset;"><i>I</i></button>
                <button @mousedown.prevent="format('underline')" title="Unterstrichen" style="padding: 4px 10px; min-width: unset;"><u>U</u></button>
                
                <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.2); margin: 0 4px;"></div> <button @mousedown.prevent="format('insertUnorderedList')" title="Aufzählung" style="padding: 4px 10px; min-width: unset;">• Liste</button>
                
                <select @change="format('fontSize', $event.target.value)" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; outline: none; cursor: pointer; padding: 4px;">
                    <option value="3" style="color: black;">Normal</option>
                    <option value="5" style="color: black;">Groß</option>
                    <option value="6" style="color: black;">Größer</option>
                    <option value="7" style="color: black;">Riesig</option>
                </select>
                
                <input type="color" @input="format('foreColor', $event.target.value)" title="Textfarbe" style="cursor: pointer; height: 26px; width: 26px; padding: 0; border: none; background: transparent; border-radius: 4px;">
                
                <div style="flex-grow: 1;"></div>
                
                <button @mousedown.prevent="format('removeFormat')" title="Formatierung löschen" style="padding: 4px 10px; min-width: unset; background: rgba(239, 68, 68, 0.2); color: #fca5a5;">🧹</button>
            </div>

            <div ref="editor" 
                 contenteditable="true" 
                 @input="onInput"
                 @blur="onInput"
                 style="flex-grow: 1; outline: none; overflow-y: auto; padding: 5px; background: transparent; color: inherit; font-family: inherit; font-size: 1rem; line-height: 1.5; word-wrap: break-word;">
            </div>
        </div>
    `,
    mounted() {
        // Beim Start den gespeicherten Text (inkl. HTML-Formatierungen) in den Editor laden
        if (!this.widgetData.data || this.widgetData.data === 'Hier tippen...') {
            this.$refs.editor.innerHTML = 'Hier deine Notiz...';
        } else {
            this.$refs.editor.innerHTML = this.widgetData.data;
        }
    },
    methods: {
        format(command, value = null) {
            // Führt den Formatierungs-Befehl auf dem aktuell markierten Text aus
            document.execCommand(command, false, value);
            this.$refs.editor.focus(); // Setzt den Cursor wieder zurück in den Text
            this.onInput(); // Speichert sofort ab
        },
        onInput() {
            // Liest das neue HTML inklusive der <b/>, <i/> etc. Tags aus
            const html = this.$refs.editor.innerHTML;
            if (this.widgetData.data !== html) {
                this.widgetData.data = html;
                this.$emit('save'); // Sagt der app.js: "Bitte im Browser speichern!"
            }
        }
    }
};