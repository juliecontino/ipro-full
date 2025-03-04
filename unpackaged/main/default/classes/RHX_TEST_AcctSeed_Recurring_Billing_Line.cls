@isTest(SeeAllData=true)
public class RHX_TEST_AcctSeed_Recurring_Billing_Line {
	static testMethod void RHX_Testmethod() {
        List<sObject> sourceList = [SELECT Id 
			FROM AcctSeed__Recurring_Billing_Line__c LIMIT 1];
        if(sourceList.size() == 0) {
            sourceList.add(
                    new AcctSeed__Recurring_Billing_Line__c()
            );
        }
    	rh2.ParentUtil.UpsertRollupTestRecords( sourceList );
    }
}