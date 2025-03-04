Ext.define("cpl.view.Main",
    {
        extend: "Ext.panel.Panel",
        requires: ["cpl.view.Grid", "cpl.view.DetailPanel"],
        layout: "hbox",
        frame: false,
        itemId: 'MyPanel',
        style: "padding: 4px; margin: 4px;",
        //maxHeight: 620,

        config: {
            composerHost: ''
        },
        
        initComponent: function () {
            this.items =[
                {
                    xtype: "grouped-grid",
                    composerHost: this.getComposerHost(),
                },
                {
                    xtype: "detail-panel"
                }
            ];
                
            this.callParent(arguments);
        }
    });