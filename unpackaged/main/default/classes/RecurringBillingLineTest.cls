/*
    Unit test for RecurringBillingLineTrigger and RecurringBillingLineHandler.
*/
@isTest
public class RecurringBillingLineTest {
    
    @isTest
    public static void testOpportunityLookup() {
        AccountingSeedUnitTestUtility.initAccountingSeed();
        
        Account acct = new Account(Name = 'Test',Branch__c = AccountingSeedUnitTestUtility.variables[0].Id);
        insert acct;
        
        Lease_Rates__c rate = new Lease_Rates__c(
            Name = '60',
            Rate_Markup__c = 1.05000,
            TSB_Rate__c = 0.02102,
            GA_Rate_1__c = 1,
            GA_Rate_1_Dollar_Threshold__c = 1,
            GA_Rate_1_Payment_Threshold__c = 1,
            GA_Rate_2__c = 1,
            GA_Rate_2_Dollar_Threshold__c = 1,
            GA_Rate_2_Payment_Threshold__c = 1,
            GA_Rate_3__c = 1,
            GA_Rate_3_Dollar_Threshold__c = 1,
            GA_Rate_3_Payment_Threshold__c = 1
        );
        insert rate;
        
        Opportunity opp = new Opportunity(
            AccountId = acct.Id,
            Name = 'Test',
            CloseDate = Date.today(),
            StageName = 'Prospecting',
            AnyWare_Term_2016__c = rate.Id,
            OPS_Category__c = 'Installation',
            TSP_Disc_Percent__c = 0
        );
        insert opp;
        
        AcctSeed__Recurring_Billing__c billing = new AcctSeed__Recurring_Billing__c(
            Name = 'Test',
            AcctSeed__Customer__c = acct.Id,
            AcctSeed__Opportunity__c = opp.Id,
            AcctSeed__Billing_Frequency__c = 'Monthly',
            AcctSeed__Next_Billing_Date__c = Date.today()
        );
        insert billing;
        
        AcctSeed__Recurring_Billing_Line__c line = new AcctSeed__Recurring_Billing_Line__c(
            AcctSeed__Recurring_Billing__c = billing.Id,
            AcctSeed__Quantity__c = 1,
            AcctSeed__Rate__c = 1,
            AcctSeed__Revenue_GL_Account__c = AccountingSeedUnitTestUtility.revenueGL.Id,
            Manually_Edit_RB_Line_Description__c = true
        );
        insert line;
        
        line = [SELECT Opportunity__c FROM AcctSeed__Recurring_Billing_Line__c WHERE Id = :line.Id];
        System.assertEquals(opp.Id,line.Opportunity__c);
    }
}