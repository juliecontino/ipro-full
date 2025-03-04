/*
    Purpose: When a Billing is Created and is related to a recurring billing record, pass through Account Payable Lines should be captured as billing lines.

    10/12/2015  MD@IC  Initial creation (00121705)
*/
trigger CreateBillingLines on AcctSeed__Billing__c(after insert){
    try{
        // determine which ones to send
        BillingLineSalesTaxTriggerUtil.run = false;
        BillingLineSalesTaxTriggerUtil.bulkNote = true;
        Map<Id, AcctSeed__Billing__c> billings = new Map<Id, AcctSeed__Billing__c>();
        for(AcctSeed__Billing__c b : Trigger.New)
            if(String.isNotBlank(b.AcctSeed__Recurring_Billing__c))
                billings.put(b.Id, b);
        //if(!billings.isEmpty()) CreateBillingLinesUtil.createLines(billings);
        if(!billings.isEmpty()) System.enqueueJob(new BillingFromRecurring(billings));
    }
    catch(Exception e){
        System.debug('Exception thrown in CreateBillingLines: ' + e.getMessage());
    }/*finally{
        BillingLineSalesTaxTriggerUtil.run = false;
        BillingLineSalesTaxTriggerUtil.bulkNote = true;
        if(!Test.isRunningTest())
            BillingLineSalesTaxTriggerUtil.performSalesTaxOpBulk(Trigger.newMap.keySet());
    }*/
}