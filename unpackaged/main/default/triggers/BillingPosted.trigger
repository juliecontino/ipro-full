/*
    10/10/15    SB @ IC    00119955 Create billing credit memos.
*/
trigger BillingPosted on AcctSeed__Billing__c (after update) {
    
    list<AcctSeed__Billing_Credit_Memo__c> billingCreditMemos = new list<AcctSeed__Billing_Credit_Memo__c>{};
    
    for (AcctSeed__Billing__c billing : Trigger.new) {
        AcctSeed__Billing__c oldBilling = Trigger.oldMap.get(billing.Id);
        if (billing.AcctSeed__Status__c != 'Posted') continue;
        
        // Create billing credit memo records when billing is posted or billing to apply credit memo is set
        if (billing.Apply_Credit_Memo_to_Billing__c != null && (oldBilling.Apply_Credit_Memo_to_Billing__c == null || oldBilling.AcctSeed__Status__c != 'Posted')) {
            billingCreditMemos.add(new AcctSeed__Billing_Credit_Memo__c(
                AcctSeed__Billing_Credit_Memo__c = billing.Id,
                AcctSeed__Billing_Invoice__c = billing.Apply_Credit_Memo_to_Billing__c,
                AcctSeed__Amount__c = billing.AcctSeed__Total__c,
                AcctSeed__Accounting_Period__c = billing.AcctSeed__Accounting_Period__c
            ));
        }
    }
    if (!billingCreditMemos.isEmpty()) insert billingCreditMemos;
}