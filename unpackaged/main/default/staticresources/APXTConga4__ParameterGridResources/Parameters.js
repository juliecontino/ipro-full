Ext.define("cpl.store.Parameters",
    {
        extend:     "Ext.data.Store",
        model:      "cpl.model.Parameter",
        groupField: "CategoryName",        
        
        // Note: a `proxy` object is required to load the store. Must be provided by the consumer. See Grid.js for example.
    });