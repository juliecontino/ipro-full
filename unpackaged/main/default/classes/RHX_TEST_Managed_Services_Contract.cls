@isTest(SeeAllData=true)
public class RHX_TEST_Managed_Services_Contract {
	static testMethod void RHX_Testmethod() {
        List<sObject> sourceList = [SELECT Id 
			FROM Managed_Services_Contract__c LIMIT 1];
        if(sourceList.size() == 0) {
            sourceList.add(
                    new Managed_Services_Contract__c()
            );
        }
    	rh2.ParentUtil.UpsertRollupTestRecords( sourceList );
    }
}