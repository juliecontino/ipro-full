/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class BillingStatementPDFControllerExt {
    global AcctSeed__Billing__c billBalance {
        get;
    }
    global AcctSeed__Billing__c billPeriod {
        get;
    }
    global Boolean showFootnote {
        get;
    }
    global AcctSeed__Billing_Format__c statementFormat {
        get;
    }
    global BillingStatementPDFControllerExt(ApexPages.StandardController controller) {

    }
    global List<AcctSeed.BillingStatementPDFControllerExt.BillingStatementWrapper> getBillingStatementWrapper() {
        return null;
    }
    global String getCurrencyFormat() {
        return null;
    }
    global Boolean getIsCurrencyFormat() {
        return null;
    }
global class BillingStatementWrapper implements System.Comparable {
    global String activityType {
        get;
    }
    global AcctSeed__Billing__c balanceProxyObj {
        get;
    }
    global AcctSeed__Billing_Credit_Memo__c bcm {
        get;
    }
    global AcctSeed__Billing_Cash_Receipt__c bcr {
        get;
    }
    global AcctSeed__Billing__c bill {
        get;
    }
    global Boolean isAlternatePayor {
        get;
    }
    global AcctSeed__Cash_Receipt__c receipt {
        get;
    }
    global String reference {
        get;
    }
    global String statementSource {
        get;
    }
    global BillingStatementWrapper() {

    }
    global Integer compareTo(Object compareTo) {
        return null;
    }
}
}
