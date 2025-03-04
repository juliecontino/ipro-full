/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class MergeSearchesBatch implements Database.AllowsCallouts, Database.Batchable<SObject>, Database.Stateful {
    global String orgId;
    global String queryString;
    global MergeSearchesBatch(Id orgId) {

    }
    global void execute(Database.BatchableContext BC, List<DSCORGPKG__DiscoverOrg_Search__c> searchList) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global String makeGetRequestWithoutAPI(String reqUrl1, String bodyStr) {
        return null;
    }
    global void mergeRecentSearches(List<DSCORGPKG__DiscoverOrg_Search__c> searchList) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
}
