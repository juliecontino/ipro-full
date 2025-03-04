/*

10/27/2015 AM@IC created trigger for AcctSeed__Billing_Line__c as per case => (00122547)
11/06/2015 AM@IC updated trigger to invoke utility class to populate fields when[Update__c changed from false to true] per case => (00123891)

*/

trigger BillingLineSalesTaxTrigger on AcctSeed__Billing_Line__c (after insert, after update) {        
    if(!BillingLineSalesTaxTriggerUtil.bulkNote){
        try{         
            if(BillingLineSalesTaxTriggerUtil.run){
                BillingLineSalesTaxTriggerUtil.run = false;
                // initialize empty collection
                List<AcctSeed__Billing_Line__c> linesToUpdate = new List<AcctSeed__Billing_Line__c>();
                Set<Id> billingIds = new Set<id>();        
                Set<Id> lineIds = new Set<Id>();
    
                    // populates Id sets   
                for(AcctSeed__Billing_Line__c billing : Trigger.new){
                    billingIds.add(billing.AcctSeed__Billing__c);                
                }
                  
                    // populates set with ids of billing lines where Update__c field was changed from false to true
                if(Trigger.isUpdate){
                    for(Integer i = 0; i < Trigger.new.size(); i++){
                        if(Trigger.old[i].Update__c == false && Trigger.new[i].Update__c == true){
                            lineIds.add(trigger.new[i].Id);
                        }
                    }
                }
                    // invoke utility class to populate fields of billing lines where Update__c field was changed from false to true
                if(lineIds.size() > 0){
                    BillingLineSalesTaxTriggerUtil.autoPopulateFields(lineIds);
                }
                
                   // invoke util class
                BillingLineSalesTaxTriggerUtil.performSalesTaxOp(billingIds);          
            }  
        }catch(Exception e){
                // catch all errors from trigger/utility class
            System.debug('SalesTaxTrigger error => ' + e.getMessage() + ', ' + e.getStackTraceString());
        }
    }
}