/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class BatchUpdateParents implements Database.Batchable<SObject>, Database.Stateful {
    global Map<String,List<SObject>> childrenByObject;
    global Datetime dt;
    global Map<String,String> queryByObject;
    global List<String> relFields;
    global Map<String,Map<String,Map<String,Set<Id>>>> resultSet;
    global Map<String,List<String>> settingsByQuery;
    global BatchUpdateParents(List<String> q) {

    }
    global BatchUpdateParents(Map<String,List<SObject>> triggerSource) {

    }
    global BatchUpdateParents(Map<String,List<String>> sByQ) {

    }
    global BatchUpdateParents(Map<String,String> q) {

    }
    global void execute(Database.BatchableContext BC, List<SObject> scope) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global System.Iterable start(Database.BatchableContext BC) {
        return null;
    }
}
