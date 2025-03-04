/*
    06/20/2016  MD@IC  Created (00132538)
*/
@isTest
private class UploadSalesOrderLinesTest{
    
    @isTest static void tester(){
        AcctSeedERP__Sales_Order__c salesOrder = setup();

        Test.setCurrentPage(new PageReference('/apex/UploadSalesOrderLines?soid=' + salesOrder.Id));
        UploadSalesOrderLinesCtrl ctrl = new UploadSalesOrderLinesCtrl();
        System.assertEquals(0, ApexPages.getMessages().size(), 'There should not be page messages at this time.');

        ctrl.file = Blob.valueOf(createCSV());
        ctrl.upload();
        ctrl.cancel();

        List<AcctSeedERP__Sales_Order_Line__c> assets = [SELECT Id FROM AcctSeedERP__Sales_Order_Line__c WHERE AcctSeedERP__Sales_Order__c = :salesOrder.Id];
        System.assertEquals(3, assets.size(), 'Wrong number of Sales Order Lines created. ' + ApexPages.getMessages());
    }

    @isTest static void testErrors(){
        AcctSeedERP__Sales_Order__c salesOrder = setup();

        Test.setCurrentPage(new PageReference('/apex/UploadSalesOrderLines?soid=' + salesOrder.Id));
        UploadSalesOrderLinesCtrl ctrl = new UploadSalesOrderLinesCtrl();
        Integer msgCount = ApexPages.getMessages().size();
        System.assertEquals(0, msgCount, 'There should not be page messages at this time. ' + ApexPages.getMessages());

        // null file
        ctrl.file = null;
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Null file did not throw an error. ' + ApexPages.getMessages());
        msgCount = ApexPages.getMessages().size();

        // not enough rows
        ctrl.file = Blob.valueOf('test\n');
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Not enoguh rows did not throw an error. ' + ApexPages.getMessages());
        msgCount = ApexPages.getMessages().size();

        // wrong file extension
        ctrl.file = Blob.valueOf('test\n');
        ctrl.fileName = 'test.xls';
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Wrong file extension did not throw an error. ' + ApexPages.getMessages());
        msgCount = ApexPages.getMessages().size();

        // missing columns
        ctrl.file = Blob.valueOf('test\ntest\ntest\n');
        ctrl.fileName = 'test.csv';
        ctrl.upload();
        System.assert(msgCount < ApexPages.getMessages().size(), 'Missing columns did not throw an error. ' + ApexPages.getMessages());
        msgCount = ApexPages.getMessages().size();

        // no account
        Test.setCurrentPage(new PageReference('/apex/UploadSalesOrderLines?soid='));
        ctrl = new UploadSalesOrderLinesCtrl();
        System.assert(msgCount < ApexPages.getMessages().size(), 'No account did not throw an error. ' + ApexPages.getMessages());
        msgCount = ApexPages.getMessages().size();
    }

    private static AcctSeedERP__Sales_Order__c setup(){
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
        AcctSeedERP__Sales_Order__c salesOrder = new AcctSeedERP__Sales_Order__c(
            AcctSeedERP__Customer__c = acct.Id);
        insert salesOrder;
        return salesOrder;
    }

    private static String createCSV(){
        String csv = 'External Product Code,Order Quantity,Unit Price,AMC Transaction ID\n' + 
        '54005195,1,0.35,\n' + 
        '54005968,1,50,\n' + 
        '54000303,12,175.75,YGN9YZ6GCZS7BLZS\n';
        return csv;
    }
    
}