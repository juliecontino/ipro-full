/*
Test for merge billing extension

02/29/16 BS@IC Created (00127964)
06/02/16 BS@IC Minor fix (132110)
*/

@isTest
public with sharing class MergeBillingTest {
    public static testMethod void test() {
        AccountingSeedUnittestUtility.initAccountingSeed();
        Account acct = new Account(Name = 'MergeBillingTest',Branch__c = AccountingSeedUnittestUtility.variables[0].Id);
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert acct;
        }

        AcctSeed__GL_Account__c gl = new AcctSeed__GL_Account__c(
            Name = 'MergeBillingTest',
            AcctSeed__Active__c = true,
            AcctSeed__Type__c = 'Revenue'
        );
        insert gl;

        Product2 prod = new Product2(Name = 'MergeBillingTest', IsActive = true, AcctSeed__Revenue_GL_Account__c = gl.Id);
        insert prod;

        PriceBookEntry entry = new PriceBookEntry(
            Product2Id = prod.Id,
            UnitPrice = 42,
            Pricebook2Id = Test.getStandardPricebookId(),
            IsActive = true
        );
        insert entry;

        Lease_Rates__c term = new Lease_Rates__c(Name = 'MergeBillingTest', GA_Rate_1__c = 1, GA_Rate_1_Dollar_Threshold__c = 1, GA_Rate_1_Payment_Threshold__c = 1, GA_Rate_2__c = 1, GA_Rate_2_Dollar_Threshold__c = 1, GA_Rate_2_Payment_Threshold__c = 1, GA_Rate_3__c = 1, GA_Rate_3_Dollar_Threshold__c = 1, GA_Rate_3_Payment_Threshold__c = 1, Rate_Markup__c = 1, TSB_Rate__c = 1);
        insert term;

        Opportunity opp = new Opportunity(Name = 'MergeBillingTest', StageName = 'Prospecting', CloseDate = Date.today(), AccountId = acct.Id, AnyWare_Term_2016__c = term.Id,OPS_Category__c = 'Installation');
        insert opp;
        opp = [SELECT AccountId, Contract_Number__c, Account.Branch__c, Account.Account_Executive__c FROM Opportunity WHERE Id = :opp.Id];

        OpportunityLineItem oli = new OpportunityLineItem(
            OpportunityId = opp.Id,
            Quantity = 42,
            UnitPrice = 10,
            PriceBookEntryId = entry.Id
        );
        insert oli;

        AcctSeed__Recurring_Billing__c billing = new AcctSeed__Recurring_Billing__c(
            Name = 'MergeBillingTest',
            AcctSeed__Customer__c = acct.Id,
            AcctSeed__Billing_Frequency__c = 'Monthly',
            AcctSeed__Next_Billing_Date__c = Date.today().addDays(1),
            AcctSeed__Status__c = 'Active'
        );
        insert billing;

        MergeBillingExtension ext = new MergeBillingExtension(new ApexPages.StandardController(opp));
        System.assertEquals(1, ext.recurringBillings.size());
        ext.mergeOppWithSelectedRecurringBilling();
        ext.recurringBillings[0].selected = true;
        ext.mergeOppWithSelectedRecurringBilling();

        AcctSeed__Recurring_Billing_Line__c[] lines = [SELECT AcctSeed__Quantity__c, AcctSeed__Rate__c, AcctSeed__Product__c FROM AcctSeed__Recurring_Billing_Line__c WHERE AcctSeed__Recurring_Billing__c = :billing.Id];
        System.assertEquals(1, lines.size());
        System.assertEquals(42, lines[0].AcctSeed__Quantity__c);
        System.assertEquals(10, lines[0].AcctSeed__Rate__c);
        System.assertEquals(prod.Id, lines[0].AcctSeed__Product__c);

        ext = new MergeBillingExtension(new ApexPages.StandardController(opp));
        System.assertEquals(1, ext.recurringBillings[0].lines.size());
    }
}