/*
    06/16/2016  MD@IC  Created (00132537)
*/
@isTest
private class UploadAssetsTest{
    
    @isTest static void tester(){
        Account acct = setup();

        Test.setCurrentPage(new PageReference('/apex/UploadAssets?aid=' + acct.Id));
        UploadAssetsCtrl ctrl = new UploadAssetsCtrl();
        System.assertEquals(0, ApexPages.getMessages().size(), 'There should not be page messages at this time.');

        ctrl.file = Blob.valueOf(createCSV());
        ctrl.upload();
        ctrl.cancel();

        List<Asset> assets = [SELECT Id FROM Asset];
        System.assertEquals(3, assets.size(), 'Wrong number of assets created. ' + ApexPages.getMessages());
    }

    @isTest static void testErrors(){
        Account acct = setup();

        Test.setCurrentPage(new PageReference('/apex/UploadAssets?aid=' + acct.Id));
        UploadAssetsCtrl ctrl = new UploadAssetsCtrl();
        System.assert(ApexPages.getMessages().isEmpty(), 'There should be page messages at this time.');
        Integer msgCount = 0;

        // null file
        ctrl.file = null;
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Null file did not throw an error.');
        msgCount = ApexPages.getMessages().size();

        // not enough rows
        ctrl.file = Blob.valueOf('test\n');
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Not enoguh rows did not throw an error.');
        msgCount = ApexPages.getMessages().size();

        // wrong file extension
        ctrl.file = Blob.valueOf('test\n');
        ctrl.fileName = 'test.xls';
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Wrong file extension did not throw an error.');
        msgCount = ApexPages.getMessages().size();

        // missing columns
        ctrl.file = Blob.valueOf('test\ntest\ntest\n');
        ctrl.fileName = 'test.csv';
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Missing columns did not throw an error.');
        msgCount = ApexPages.getMessages().size();

        // no account
        Test.setCurrentPage(new PageReference('/apex/UploadAssets?aid='));
        ctrl = new UploadAssetsCtrl();
        System.assert(msgCount < ApexPages.getMessages().size(), 'No account did not throw an error.');
        msgCount = ApexPages.getMessages().size();
    }

    // ============================== HELPER METHODS ==============================

    private static Account setup(){
        AccountingSeedUnittestUtility.initAccountingSeed();
        Account acct = new Account(
            Name = 'test',
            Branch__c = AccountingSeedUnittestUtility.variables[0].Id);
        insert acct;
        List<Product2> products = new List<Product2>();
        products.add(new Product2(
            Name = 'Stnd S/W Assur MiVoice Bus Base Usersx16',
            ProductCode = '54005195',
            External_Product_Code__c = '54005195'));
        products.add(new Product2(
            Name = 'MiVBus Enterprise SW for 3300 (no users)',
            ProductCode = '54005968',
            External_Product_Code__c = '54005968'));
        products.add(new Product2(
            Name = 'MiVoice Business License - Digital Link',
            ProductCode = '54000303',
            External_Product_Code__c = '54000303'));
        insert products;
        return acct;
    }

    private static String createCSV(){
        String csv = '"Mitel Application Record(s): 59631622"\n' + 
        '\n' + 
        '"Order Date","Purchase Order","Sales Ref","Product","Description","State","Quantity"\n' + 
        '"2015-02-20","10474","2120731","54005195","Stnd S/W Assur MiVoice Bus Base Usersx16","Activated","1"\n' + 
        '"2015-12-07","00133 Helix C-2014408","2218741","54005968","MiVBus Enterprise SW for 3300 (no users)","Activated","1"\n' + 
        '"2015-12-07","00133 Helix C-2014408","2218741","54000303","MiVoice Business License - Digital Link","Activated","1"\n';
        return csv;
    }
    
}