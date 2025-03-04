/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class TriggersInsertForLead_Batch implements Database.AllowsCallouts, Database.Batchable<SObject>, Database.Stateful {
    global List<SObject> gllstScopeRecords;
    global String glstrQuery;
    global String objType;
    global String responseBody;
    global TriggersInsertForLead_Batch(String query, String type) {

    }
    global void execute(Database.BatchableContext BC, List<SObject> scope) {

    }
    global void finish(Database.BatchableContext bcMain) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
}
