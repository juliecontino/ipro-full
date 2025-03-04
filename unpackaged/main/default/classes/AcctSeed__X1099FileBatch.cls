/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class X1099FileBatch implements Database.Batchable<SObject>, Database.Stateful {
    global String selectedYearName {
        get;
        set;
    }
    global Decimal thresholdAmount {
        get;
        set;
    }
    global X1099FileBatch(String selectedYearName, Decimal thresholdAmount) {

    }
    global void execute(Database.BatchableContext BC, List<SObject> scope) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
global class RecipientWrapper implements System.Comparable {
    global Decimal recAmount {
        get;
        set;
    }
    global String recCity {
        get;
        set;
    }
    global String recDefault1099box {
        get;
        set;
    }
    global String recIdNumber {
        get;
        set;
    }
    global SObject recipient {
        get;
        set;
    }
    global String recName {
        get;
        set;
    }
    global String recState {
        get;
        set;
    }
    global String recStreet {
        get;
        set;
    }
    global String recZip {
        get;
        set;
    }
    global RecipientWrapper(Account account) {

    }
    global RecipientWrapper(Contact contact) {

    }
    global Integer compareTo(Object objToCompare) {
        return null;
    }
}
}
