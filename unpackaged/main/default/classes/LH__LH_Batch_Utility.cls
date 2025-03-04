/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class LH_Batch_Utility implements Database.Batchable<SObject> {
    global List<SObject> AllRecords;
    global Integer currentPos;
    global List<SObject> currentScope;
    global Integer endPos;
    global String settingId;
    global LH_Batch_Utility(List<SObject> objList, Integer i) {

    }
    global LH_Batch_Utility(List<SObject> objList, Integer i, String setting) {

    }
    global void execute(Database.BatchableContext info, List<SObject> scope) {

    }
    global void finish(Database.BatchableContext info) {

    }
    global List<SObject> start(Database.BatchableContext info) {
        return null;
    }
}
