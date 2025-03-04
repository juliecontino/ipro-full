/*
    10/05/15    SB @ IC    00119955
    07/12/16    BS @ IC    Modified for compatibility with Accounting Seed update (132907)
*/
@isTest
public class CreateCreditMemosTest {
    
    @isTest
    public static void testController() {
        AccountingSeedUnitTestUtility.initAccountingSeed();
        
        Account acct = new Account(Name = 'Test Account',Branch__c = AccountingSeedUnittestUtility.variables[0].Id);
        insert acct;
        
        AcctSeed__Billing__c billing = new AcctSeed__Billing__c(AcctSeed__Customer__c = acct.Id);
        insert billing;
        
        AcctSeed__Billing_Line__c line1 = new AcctSeed__Billing_Line__c(
            AcctSeed__Billing__c = billing.Id,
            AcctSeed__Rate__c = 10,
            AcctSeed__Hours_Units__c = 40,
            AcctSeed__GL_Account_Variable_1__c = AccountingSeedUnitTestUtility.variables[0].Id,
            AcctSeed__GL_Account_Variable_2__c = AccountingSeedUnitTestUtility.variables[2].Id,
            AcctSeed__GL_Account_Variable_3__c = AccountingSeedUnitTestUtility.variables[4].Id
        );
        AcctSeed__Billing_Line__c line2 = new AcctSeed__Billing_Line__c(
            AcctSeed__Billing__c = billing.Id,
            AcctSeed__Rate__c = 10,
            AcctSeed__Hours_Units__c = 40,
            AcctSeed__GL_Account_Variable_1__c = AccountingSeedUnitTestUtility.variables[0].Id,
            AcctSeed__GL_Account_Variable_2__c = AccountingSeedUnitTestUtility.variables[2].Id,
            AcctSeed__GL_Account_Variable_3__c = AccountingSeedUnitTestUtility.variables[4].Id
        );
        insert new list<AcctSeed__Billing_Line__c>{line1,line2};
        
        CreateCreditMemosController control = new CreateCreditMemosController(new ApexPages.StandardController(billing));
        control.billingLines[0].selected = true;
        control.billingLines[0].creditQuantity = 50;
        System.assertEquals(null,control.saveCreditMemos());
        
        control.billingLines[0].creditQuantity = 40;
        control.billingLines[1].selected = true;
        control.billingLines[1].overrideAmount = true;
        control.billingLines[1].creditQuantity = 1;
        control.billingLines[1].creditAmount = 200;
        
        Id memoId = control.saveCreditMemos().getUrl().substringAfterLast('/');
        
        //BS@IC Can no longer post billings directly
        /* AcctSeed__Billing__c memo = [SELECT AcctSeed__Status__c FROM AcctSeed__Billing__c WHERE Id = :memoId];
        memo.AcctSeed__Status__c = 'Posted';
        update memo; */
        AcctSeed.PostResult[] postResult = AcctSeed.BillingPostService.postBillings(new AcctSeed__Billing__c[]{new AcctSeed__Billing__c(Id = memoId)});
        System.assertEquals(true, postResult[0].isSuccess);
        
        System.assertEquals(1, [SELECT Id FROM AcctSeed__Billing_Credit_Memo__c WHERE AcctSeed__Billing_Invoice__c = :billing.Id AND AcctSeed__Billing_Credit_Memo__c = :memoId].size());
    }
}