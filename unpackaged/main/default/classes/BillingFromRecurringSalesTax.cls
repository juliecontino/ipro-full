public class BillingFromRecurringSalesTax Implements Queueable{
    Map<Id, AcctSeed__Billing__c> billingMap;
    
    public BillingFromRecurringSalesTax(Map<Id, AcctSeed__Billing__c> billingMap){
        this.billingMap = billingMap;
    }
    
    public void execute(QueueableContext context){
        BillingLineSalesTaxTriggerUtil.performSalesTaxOpBulk(billingMap.keySet());
    }
}