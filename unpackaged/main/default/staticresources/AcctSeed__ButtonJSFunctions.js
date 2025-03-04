var PACKAGE_NAME = "AcctSeed__";
var ERP_PACKAGE_NAME = "AcctSeedERP__";

$(document).ready(function() {
    if ($.browser.mozilla) {

        $('.btn').each(function(elem) {
            this.disabled = false;
        });  
    }
});

    
function setButtonsDisabled(disabledLabel) {
    $('.btn').each(function(elem) {
        this.className = 'btnDisabled';
        this.disabled = true;
        this.value = disabledLabel;
    })
}


