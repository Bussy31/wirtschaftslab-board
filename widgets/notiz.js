const NotizWidget = {
    props: ['widgetData'],
    template: `
        <textarea 
            v-model="widgetData.data" 
            @input="$emit('save')"
            placeholder=""
            style="background: transparent; color: white; border: none; width: 100%; min-height: 100px; resize: none; outline: none; font-family: inherit; font-size: 1rem;">
        </textarea>
    `
};