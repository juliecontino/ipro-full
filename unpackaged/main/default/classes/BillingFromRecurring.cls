public class BillingFromRecurring Implements Queueable{
    Map<Id, AcctSeed__Billing__c> billingMap;
    
    public BillingFromRecurring(Map<Id, AcctSeed__Billing__c> billingMap){
        this.billingMap = billingMap;
    }
    
    public void execute(QUeueableContext context){
        CreateBillingLinesUtil.createLines(billingMap);
        
        if(!Test.isRunningTest()){
            System.enqueueJob(new BillingFromRecurringSalesTax(billingMap));
        }
    }
}