/*
    Utility class for RecurringBillingLineTrigger
    
    03/15/17    SB @ IC    00145429 Populates opportunity lookup from recurring billing
*/
public class RecurringBillingLineHandler {
    
    public static void updateOpportunityLookup(list<AcctSeed__Recurring_Billing_Line__c> lines) {
        map<Id,Id> billingOppMap = new map<Id,Id>{};
        for (AcctSeed__Recurring_Billing_Line__c line : lines) {
            billingOppMap.put(line.AcctSeed__Recurring_Billing__c,null);
        }
        
        for (AcctSeed__Recurring_Billing__c billing : [SELECT AcctSeed__Opportunity__c FROM AcctSeed__Recurring_Billing__c WHERE Id IN :billingOppMap.keySet()]) {
            billingOppMap.put(billing.Id,billing.AcctSeed__Opportunity__c);
        }
        
        for (AcctSeed__Recurring_Billing_Line__c line : lines) {
            line.Opportunity__c = billingOppMap.get(line.AcctSeed__Recurring_Billing__c);
        }
    }
}