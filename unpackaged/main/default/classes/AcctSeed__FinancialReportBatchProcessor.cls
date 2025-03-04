/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
@isTest
global class FinancialReportBatchProcessor implements Database.Batchable<SObject>, Database.Stateful {
    @Deprecated
    global AcctSeed.FinancialReportGenerator generator;
    @Deprecated
    global List<String> glAccountIds;
    @Deprecated
    global Integer numrows;
    @Deprecated
    global String query;
    @Deprecated
    global Id reportStubId;
    global FinancialReportBatchProcessor(String reportDefId, Integer periodNo, Integer year) {

    }
    global void execute(Database.BatchableContext batchableContext, List<SObject> scope) {

    }
    global void finish(Database.BatchableContext batchableContext) {

    }
    global Database.QueryLocator start(Database.BatchableContext batchableContext) {
        return null;
    }
    @Deprecated
    @isTest(SeeAllData=false OnInstall=false)
    global static void testBatch() {

    }
}
