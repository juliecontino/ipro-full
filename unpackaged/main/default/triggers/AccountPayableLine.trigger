/*
Created to copy client variables.
Test Class: AccountingTriggersTest.

01/27/16 BS@IC Created (00126633)
*/

trigger AccountPayableLine on AcctSeed__Account_Payable_Line__c (before insert, before update) {
    try {
        Set<Id> clientIds = new Set<Id>();
        Set<Id> payableIds = new Set<Id>();
    
        for(AcctSeed__Account_Payable_Line__c apl : Trigger.new) {
            clientIds.add(apl.Client__c);
            payableIds.add(apl.AcctSeed__Account_Payable__c);
        }
        
        Map<Id, Account> accountById = new Map<Id, Account>([SELECT Branch__c, Account_Executive__c FROM Account WHERE Id IN :clientIds]);
        Map<Id, AcctSeed__Account_Payable__c> payableById = new Map<Id, AcctSeed__Account_Payable__c>([SELECT AcctSeed__Status__c FROM AcctSeed__Account_Payable__c WHERE Id IN :payableIds]);

        for(AcctSeed__Account_Payable_Line__c apl : Trigger.new) {
            if(apl.Client__c != null && accountById.get(apl.Client__c).Branch__c != null && accountById.get(apl.Client__c).Account_Executive__c != null && (apl.AcctSeed__Account_Payable__c == null || payableById.get(apl.AcctSeed__Account_Payable__c).AcctSeed__Status__c != 'Posted')) {
                apl.AcctSeed__GL_Account_Variable_1__c = accountById.get(apl.Client__c).Branch__c;
                apl.AcctSeed__GL_Account_Variable_2__c = accountById.get(apl.Client__c).Account_Executive__c;
            }
        }
    }
    catch(Exception e) {
        System.debug('AccountPayableLine Threw: ' + e.getMessage() + ' @ ' + e.getStackTraceString());
    }
}