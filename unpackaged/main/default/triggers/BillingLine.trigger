/*
Created to populate Amount for Partial Month.
Test Class: AccountingTriggersTest.

01/27/16 BS@IC Created (00126633)
*/

trigger BillingLine on AcctSeed__Billing_Line__c (before insert, before update) {
    try {
        Set<ID> billingIds = new Set<Id>();
        for(AcctSeed__Billing_Line__c line : Trigger.new)
            billingIds.add(line.AcctSeed__Billing__c);
        
        Map<Id, AcctSeed__Billing__c> billingById = new Map<Id, AcctSeed__Billing__c>([
            SELECT Partial_Recurring_Bill__c, Partial_Recurring_Billing_Start_Date__c, Partial_Recurring_Billing_End_Date__c
            FROM AcctSeed__Billing__c
            WHERE Id IN :billingIds AND Partial_Recurring_Bill__c = true AND Partial_Recurring_Billing_Start_Date__c != null AND Partial_Recurring_Billing_End_Date__c != null
        ]);

        for(AcctSeed__Billing_Line__c line : Trigger.new)
            if(billingById.containsKey(line.AcctSeed__Billing__c) && line.AcctSeed__Rate__c != null)
                line.AcctSeed__Hours_Units__c = line.AcctSeed__Rate__c * (Math.min(30, billingById.get(line.AcctSeed__Billing__c).Partial_Recurring_Billing_Start_Date__c.daysBetween(billingById.get(line.AcctSeed__Billing__c).Partial_Recurring_Billing_End_Date__c)) / 30.0);
    }
    catch(Exception e) {
        System.debug('BillingLine threw: ' + e.getMessage() + ' @ ' + e.getStackTraceString());
    }
}