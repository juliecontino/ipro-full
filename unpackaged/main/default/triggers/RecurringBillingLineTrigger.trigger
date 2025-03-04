/*
    03/15/17    SB @ IC    00145429 Populates opportunity lookup from recurring billing
*/
trigger RecurringBillingLineTrigger on AcctSeed__Recurring_Billing_Line__c (before insert) {
    try {
        if (Trigger.isInsert) {
            if (Trigger.isBefore) {
                list<AcctSeed__Recurring_Billing_Line__c> lines = new list<AcctSeed__Recurring_Billing_Line__c>{};
                for (AcctSeed__Recurring_Billing_Line__c line : Trigger.new) {
                    if (line.Opportunity__c == null) lines.add(line);
                }
                
                if (!lines.isEmpty())
                    RecurringBillingLineHandler.updateOpportunityLookup(lines);
            }
        }
    } catch (Exception e) {
        System.debug(e);
    }
}