//Ext.application({
//    name: 'cpl',
//    appFolder: 'https://composer.congamerge.com/ComposerParameterList/MyApp',
//    stores: ['cpl.store.Parameters'],
//    models: ['cpl.model.Parameter'],
//    views: ['cpl.view.ParameterAdder.DetailPanel', 'cpl.view.ParameterAdder.Grid', 'cpl.view.ParameterAdder.Main'],

//    launch: function () {
//        var mainView = Ext.create("cpl.view.ParameterAdder.Main");
//        var destinationDiv = Ext.get('thePage:theForm:theExtTablePageBlock:theExtTablePageBlockSection:theExtOutputPanel');
//        mainView.render(destinationDiv);
//    }

//});

// This is called by the visual force page in a script block. 
// Previously it was an anon func that ran automatically, but had to be
// adjusted to allow passing the composerHost as a parameter from a SF context. 
function initParameterGridApp(composerHost) {
    Ext.Loader.setConfig({
        enabled: true
    });

    Ext.require('cpl.view.Main');

    Ext.onReady(function () {
        /*var urlLink = document.location.href.split('?')[1];
        var urlString = urlLink.toString();
        var linkvar = Ext.Object.fromQueryString(urlLink);

        if (urlString.indexOf("parameterName") > -1)
        {
            console.log("parameterName --> " + linkvar.parameterName);
            var linkvar = Ext.Object.fromQueryString(urlLink);
            //"{Name}" = linkvar;
        }*/

        var mainView = Ext.create("cpl.view.Main", { composerHost: composerHost });
        //var destinationDiv = Ext.get('thePage:theForm:theExtTablePageBlock:theExtTablePageBlockSection:theExtOutputPanel');
        var destinationDiv = Ext.get('thePage:theForm:thePageBlock:EXTTable');
        mainView.render(destinationDiv);

        //Checking to see if this is an Edit of an existing Parameter record--the parameterName query string variable will be in the URL
        var urlLink = document.location.href.split('?')[1];
        var urlString = urlLink.toString();

        if (urlString.indexOf("parameterName") > -1) {
            var linkvar = Ext.Object.fromQueryString(urlLink);
            console.log("parameterName in Grid.js --> " + linkvar.parameterName);

            var detailPanelComp = Ext.ComponentMgr.get("detailPanelId");
            console.log("detailPanelComp: " + detailPanelComp);

            var pName = linkvar.parameterName;
            var parameterURL = "https://www.congasphere.com/Content/parameters/" + pName + ".htm"

            var DPFullParameterURL = '<br /><iframe src=' + parameterURL + ' scrolling="yes" width="100%" height="675" frameborder="0" ></iframe>';
            console.log(DPFullParameterURL);

            //putting the parameter into the search bar (doesn't really search, but it is nice for the user)
            Ext.get("gridtextfield-1016-inputEl").dom.value = Ext.get("thePage:theForm:thePageBlock:inputFields:nameandvaluesection:nameStringItem:nameStringBox").dom.value;

            //Set the frame to the parameter that was in the URL 
            detailPanelComp.update(DPFullParameterURL);
            
            //Setting the parameter grid open to the parameter that was in the URL
            /*var pGrid = Ext.ComponentMgr.get("GridId");
            console.log("pGrid: " + pGrid);
            var pGroup = pGrid.getView().getFeature('DatasetGrouping');
            pGroup.expandAll();*/
        }        
    });
}
