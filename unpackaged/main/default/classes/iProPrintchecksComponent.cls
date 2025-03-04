public with sharing class iProPrintchecksComponent {
    public List<AcctSeed__Cash_Disbursement__c> cashDisbursements {get; private set;}
    public Id cashDisbursementBatchId;
    public Id cashDisbursementId;
    
    public Id getCashDisbursementBatchId() {
        return cashDisbursementBatchId;
    }
    
    public void setCashDisbursementBatchId(Id cashDisbursementBatchId) {
        this.cashDisbursementBatchId = cashDisbursementBatchId; 
          init();
    }

    public Id getCashDisbursementId() {
        return cashDisbursementId;
    }
    
    public void setCashDisbursementId(Id cashDisbursementId) {
        this.cashDisbursementId = cashDisbursementId;   
          init();
    }
        
    private void init() {
        cashDisbursements = new List<AcctSeed__Cash_Disbursement__c>();
        if (cashDisbursementBatchId != null) {
            cashDisbursements = [Select Id,Name,AcctSeed__Payee__c,AcctSeed__Payee_Street__c,AcctSeed__Payee_City_State_Zip__c,
            AcctSeed__Payee_Country__c,AcctSeed__Check_Number__c,AcctSeed__Type__c,AcctSeed__Reference__c,AcctSeed__Amount__c,AcctSeed__Amount_In_Words__c,AcctSeed__Disbursement_Date__c,
            AcctSeed__Bank_Account__c,
                (Select Id,Name,AcctSeed__Account_Payable__c,AcctSeed__Account_Payable_Date__c,
                  AcctSeed__Payable_Amount__c,AcctSeed__Payee_Reference__c,
                  AcctSeed__Net_Amount__c,AcctSeed__Discount_Amount__c,
                  AcctSeed__Account_payable__r.AcctSeed__Type__c,
                  AcctSeed__Account_Payable__r.Name,AcctSeed__Account_Payable__r.AcctSeed__Vendor__c,
                  AcctSeed__Account_Payable__r.AcctSeed__Date__c,            
                  AcctSeed__Account_Payable__r.AcctSeed__Discount_Amount__c,
                  AcctSeed__Account_Payable__r.AcctSeed__Net_Amount__c,
                  AcctSeed__Paid_Amount__c
                    From AcctSeed__Account_Payable_Cash_Disbursements__r 
                    Order By Name)
                    From AcctSeed__Cash_Disbursement__c
                    Where AcctSeed__Cash_Disbursement_Batch__c = :cashDisbursementBatchId order by AcctSeed__Check_Number__c limit 500];
                                
        }
        else if (cashDisbursementId != null) {
            cashDisbursements = [Select Id,Name,AcctSeed__Payee__c,AcctSeed__Payee_Street__c,AcctSeed__Payee_City_State_Zip__c,
            AcctSeed__Payee_Country__c,AcctSeed__Check_Number__c,AcctSeed__Reference__c,AcctSeed__Type__c,AcctSeed__Amount__c,AcctSeed__Amount_In_Words__c,AcctSeed__Disbursement_Date__c,
            AcctSeed__Bank_Account__c,
                (Select Id,Name,AcctSeed__Account_Payable__c,AcctSeed__Account_Payable_Date__c,
                  AcctSeed__Payable_Amount__c,AcctSeed__Payee_Reference__c,
                  AcctSeed__Net_Amount__c,AcctSeed__Discount_Amount__c,
                  AcctSeed__Account_payable__r.AcctSeed__Type__c,
                  AcctSeed__Account_Payable__r.Name,AcctSeed__Account_Payable__r.AcctSeed__Vendor__c,
                  AcctSeed__Account_Payable__r.AcctSeed__Date__c,            
                  AcctSeed__Account_Payable__r.AcctSeed__Discount_Amount__c,
                  AcctSeed__Account_Payable__r.AcctSeed__Net_Amount__c,
                  AcctSeed__Paid_Amount__c
                    From AcctSeed__Account_Payable_Cash_Disbursements__r 
                    Order By Name)
                    From AcctSeed__Cash_Disbursement__c
                    Where Id = :cashDisbursementId]; 
                    
        }
    }                 
}