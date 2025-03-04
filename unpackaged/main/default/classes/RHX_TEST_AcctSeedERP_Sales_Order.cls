@isTest(SeeAllData=true)
public class RHX_TEST_AcctSeedERP_Sales_Order {
	static testMethod void RHX_Testmethod() {
        List<sObject> sourceList = [SELECT Id 
			FROM AcctSeedERP__Sales_Order__c LIMIT 1];
        if(sourceList.size() == 0) {
            sourceList.add(
                    new AcctSeedERP__Sales_Order__c()
            );
        }
    	rh2.ParentUtil.UpsertRollupTestRecords( sourceList );
    }
}