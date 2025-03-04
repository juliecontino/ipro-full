/*
    07/07/2016  MD@IC  Created (00132544)
*/
@isTest
private class LookupAccountNumberTest{

    @isTest static void tester(){
        //System.assert(false, 'Switch field ids for pre-populate fields');

        AccountingSeedUnitTestUtility.initAccountingSeed();
        Account a = new Account(
            Name = 'Test Inc.',
            Branch__c = AccountingSeedUnittestUtility.variables[0].Id);
        insert a;
        Contact c = new Contact(
            AccountId = a.Id,
            LastName = 'Smith');
        insert c;
        AcctSeed__Account_Payable__c ap = new AcctSeed__Account_Payable__c(
            AcctSeed__Contact__c = c.Id,
            AcctSeed__Payee_Reference__c = '0');
        insert ap;

        Access_Circuits__c ac = new Access_Circuits__c(
            Primary_Carrier_Account_Number__c = '012345',
            Account__c = a.Id);
        insert ac;

        Test.setCurrentPage(new PageReference('/apex/LookupAccountNumber?apid=' + ap.Id + '&retURL=' + ap.Id));
        LookupAccountNumberCtrl ctrl = new LookupAccountNumberCtrl(null);
        System.assert(ctrl.accountPayable != null, 'Ctrl could not find the acct payable');

        List<String> accountNumbers = LookupAccountNumberCtrl.searchAccountNumbers('0');
        System.assertNotEquals(0, accountNumbers.size(), 'No account numbers found');
        System.assertEquals(ac.Primary_Carrier_Account_Number__c, accountNumbers[0], 'Wrong account number returned');

        ctrl.accountNumber = accountNumbers[0];
        ctrl.queryAccessCircuits();
        System.assertEquals(1, ctrl.accessCircuits.size(), 'Wrong number of access circuits returned');

        ctrl.selectedAccessCircuit = ctrl.accessCircuits[0].Id;
        ctrl.selectAccessCircuit();
        ap = [SELECT Id, Client__c FROM AcctSeed__Account_Payable__c WHERE Id = :ap.Id];
        System.assertEquals(ctrl.accessCircuits[0].Account__c, ap.Client__c, 'AP Client not set correctly: ' + ApexPages.getMessages());

        // coverage
        ctrl.newPageOverride = true;
        ctrl.selectAccessCircuit();
        ctrl.skip();
    }

}