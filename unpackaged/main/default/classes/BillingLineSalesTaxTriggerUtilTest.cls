/*

10/28/2015 AM@IC test class for BillingLineSalesTaxTrigger/BillingLineSalesTaxTriggerUtil[87%/96%] (00122547)
11/06/2015 AM@IC updated test class to test autoPopulateFields method [93%/100%] (00123891)
07/12/2016 BS@IC Modified for compatibility with Accounting Seed update (132907)

*/

@isTest
public class BillingLineSalesTaxTriggerUtilTest{
           // asserts that another billing line is created with the correct sales tax calculation when there isn't an existing sales tax product
    static testMethod void testPerformSalesTaxOp(){
    
        
        Account newAcc = createTestAccount();
        
        Product2 prod = createTestSalesProduct();

        createAccountTax(newAcc, prod);   
          
        List<AcctSeed__GL_Account__c > glAcc = [SELECT Id FROM AcctSeed__GL_Account__c LIMIT 3];
        AcctSeed__Billing__c billing = createBilling(newAcc);
        Set<Id> billId = new Set<Id>();
        billId.add(billing.Id);
        
        Test.startTest();
            BillingLineSalesTaxTriggerUtil.run = true;
            BillingLineSalesTaxTriggerUtil.bulkNote = false; 
            createBillingLine(billing, createTestProduct());
            BillingLineSalesTaxTriggerUtil.run = false;
            BillingLineSalesTaxTriggerUtil.bulkNote = true;
            BillingLineSalesTaxTriggerUtil.performSalesTaxOpBulk(billId); 
        Test.stopTest();
        
        AS_Tax__Account_Tax__c accTax = [SELECT Id, AS_Tax__Tax_Rate__c , AS_Tax__Rate__c FROM AS_Tax__Account_Tax__c LIMIT 1];
        
        List<AcctSeed__Billing_Line__c> billingLines = [SELECT Id, AcctSeed__Rate__c FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Billing__c = :billing.id];
        AcctSeed__Billing_Line__c newBillingLine = [SELECT Id, AcctSeed__Rate__c FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Billing__c = :billing.id AND AcctSeed__Product__c = :prod.Id];
        
        Decimal expected = 20.00 * (5.000/100);
        
        System.assertEquals(2, billingLines.size(), 'Did not return the correct number of billing lines.');
        System.assertEquals(expected, newBillingLine.AcctSeed__Rate__c, 'Sales Tax Product rate not calculated correctly');
    }
        // asserts that when there is an existing sales tax product it is edited accordingly
    static testMethod void testPerformSalesTaxOpExistingSalesProduct(){
        Account newAcc = createTestAccount();

        Product2 testProd = createTestProduct();
        Product2 testSalesProd = createTestSalesProduct();

        createAccountTax(newAcc, testSalesProd);     
        
        AcctSeed__Billing__c billing = createBilling(newAcc);
        BillingLineSalesTaxTriggerUtil.run = false; 
        createBillingLine(billing, testSalesProd);
        BillingLineSalesTaxTriggerUtil.run = false; 
        createBillingLine(billing, testProd);
        
        AcctSeed__Billing_Line__c billingLineToUpdate = [SELECT Id, AcctSeed__Rate__c FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Product__c = :testProd.Id];
        
        Test.startTest();
            BillingLineSalesTaxTriggerUtil.run = true;
            BillingLineSalesTaxTriggerUtil.bulkNote = false; 
            billingLineToUpdate.AcctSeed__Rate__c = 30.00;
            update billingLineToUpdate;
        Test.stopTest();
        
        AS_Tax__Account_Tax__c accTax = [SELECT Id, AS_Tax__Tax_Rate__c , AS_Tax__Rate__c FROM AS_Tax__Account_Tax__c LIMIT 1];
        
        List<AcctSeed__Billing_Line__c> billingLines = [SELECT Id, AcctSeed__Rate__c FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Billing__c = :billing.id AND AcctSeed__Product__c != null];
        AcctSeed__Billing_Line__c newBillingLine = [SELECT Id, AcctSeed__Rate__c FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Billing__c = :billing.id AND AcctSeed__Product__c = :testSalesProd.Id];
        
        Decimal expected = 30.00 * (5.000/100);
        
        System.assertEquals(2, billingLines.size(), 'Did not return the correct number of billing lines.');
        System.assertEquals(expected, newBillingLine.AcctSeed__Rate__c, 'Sales Tax Product rate not calculated correctly');
    }
        // asserts that no operations are done when the related billing is posted
    static testMethod void testPostedBilling(){
        Account newAcc = createTestAccount();

        Product2 testProd = createTestProduct();
        Product2 testSalesProd = createTestSalesProduct();

        createAccountTax(newAcc, testSalesProd);     
        
        AcctSeed__Billing__c billing = createPostedBilling(newAcc, testProd);
        //BS Moved into createPostedBilling
        //BillingLineSalesTaxTriggerUtil.run = false; 
        //createBillingLine(billing, testProd);
        String message;        
        AcctSeed__Billing_Line__c billingLineToUpdate = [SELECT Id, AcctSeed__Rate__c FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Product__c = :testProd.Id];
        
        Test.startTest();
            BillingLineSalesTaxTriggerUtil.run = true; 
            billingLineToUpdate.AcctSeed__Rate__c = 40.00;
            try{
                update billingLineToUpdate;
            }catch(Exception e){
                message = e.getMessage();
            }
        Test.stopTest();
        
        List<AcctSeed__Billing_Line__c> billingLines = [SELECT Id, AcctSeed__Rate__c FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Billing__c = :billing.id AND AcctSeed__Product__c != null];
        System.assertNotEquals(null, message, 'Exception should be thrown when Billing Status is Posted');
        System.assertEquals(1, billingLines.size(), 'Did not return the correct number of billing lines.');
        System.assertNotEquals(40.00, billingLines[0].AcctSeed__Rate__c, 'The line items rate should not be altered when the related Billing is posted');
    }
        // asserts that the values were updated properly(AcctSeed__GL_Account_Variable_1__c, AcctSeed__GL_Account_Variable_2__c)
    static testMethod void testAutoPopulateFields(){
        Account newAcc = createTestAccountForAuto();
        
        List<AcctSeed__Gl_Account__c> revGLs = new List<AcctSeed__Gl_Account__c>();
        revGLs.add(new AcctSeed__Gl_Account__c(GL_Number__c = '12420', AcctSeed__Sub_Type_1__c = 'Assets'));
        revGLs.add(new AcctSeed__Gl_Account__c(GL_Number__c = '12890', AcctSeed__Sub_Type_1__c = 'Assets'));
        insert revGLs;

        createAccountTax(newAcc, createTestSalesProduct());     
        
        AcctSeed__Billing__c billing = createBilling(newAcc);
        
        createBillingLine(billing, createTestProduct());
        
        AcctSeed__Billing_Line__c bLineToUpdate = [SELECT Id, Update__c, AcctSeed__Revenue_GL_Account__c 
                                                    FROM AcctSeed__Billing_Line__c where AcctSeed__Billing__c = :billing.Id
                                                    AND AcctSeed__Product__r.AcctSeed__Accounting_type__c != 'Tax Rate'];
        Test.startTest();
            BillingLineSalesTaxTriggerUtil.run = true;
            BillingLineSalesTaxTriggerUtil.bulkNote = false;
            bLineToUpdate.Update__c = true;
            update bLineToUpdate;
        Test.stopTest();
        
        AcctSeed__Billing_Line__c bLineToCheck = [SELECT Id, Update__c, AcctSeed__GL_Account_Variable_1__c, AcctSeed__GL_Account_Variable_2__c,
                                                   AcctSeed__Expense_GL_Account__c, AcctSeed__Revenue_GL_Account__c
                                                   FROM AcctSeed__Billing_Line__c where AcctSeed__Billing__c = :billing.Id 
                                                   AND AcctSeed__Product__r.AcctSeed__Accounting_type__c != 'Tax Rate'];
        
        System.assertNotEquals(null, bLineToCheck.AcctSeed__GL_Account_Variable_1__c, 'The field (AcctSeed__GL_Account_Variable_1__c) was not updated');
        System.assertNotEquals(null, bLineToCheck.AcctSeed__GL_Account_Variable_2__c, 'The field (AcctSeed__GL_Account_Variable_2__c) was not updated');
        System.assertEquals(bLineToUpdate.AcctSeed__Revenue_GL_Account__c, bLineToCheck.AcctSeed__Revenue_GL_Account__c, 'This field should not be updated when the requirements are not met.');
        System.assertEquals(null, bLineToCheck.AcctSeed__Expense_GL_Account__c, 'This field should not be updated when the requirements are not met.');
        System.assertEquals(false, bLineToCheck.Update__c, 'This field should be reset to false after the trigger is completed');
    }
        
        // asserts that all necessary fields are updated properly
    static testMethod void testAutoPopulateFieldsExt(){
        Account newAcc = createTestAccountForAuto();
        
        List<AcctSeed__Gl_Account__c> revGLs = new List<AcctSeed__Gl_Account__c>();
        revGLs.add(new AcctSeed__Gl_Account__c(GL_Number__c = '12420', AcctSeed__Sub_Type_1__c = 'Assets'));
        revGLs.add(new AcctSeed__Gl_Account__c(GL_Number__c = '12890', AcctSeed__Sub_Type_1__c = 'Assets'));
        insert revGLs;

        createAccountTax(newAcc, createTestSalesProduct());     
        
        AcctSeed__Billing__c billing = createBillingForAuto(newAcc);
        
        createBillingLine(billing, createTestProductForAuto());
        
        AcctSeed__Billing_Line__c bLineToUpdate = [SELECT Id, Update__c FROM AcctSeed__Billing_Line__c where AcctSeed__Billing__c = :billing.Id
                                                    AND AcctSeed__Product__r.AcctSeed__Accounting_type__c != 'Tax Rate'];
        Test.startTest();
            BillingLineSalesTaxTriggerUtil.run = true;
            BillingLineSalesTaxTriggerUtil.bulkNote = false;
            bLineToUpdate.Update__c = true;
            update bLineToUpdate;
        Test.stopTest();
        
        AcctSeed__Billing_Line__c bLineToCheck = [SELECT Id, Update__c, AcctSeed__GL_Account_Variable_1__c, AcctSeed__GL_Account_Variable_2__c,
                                                   AcctSeed__Expense_GL_Account__c, AcctSeed__Revenue_GL_Account__c
                                                   FROM AcctSeed__Billing_Line__c where AcctSeed__Billing__c = :billing.Id 
                                                   AND AcctSeed__Product__r.AcctSeed__Accounting_type__c != 'Tax Rate'];
        
        
        System.assertNotEquals(bLineToUpdate.AcctSeed__GL_Account_Variable_1__c, bLineToCheck.AcctSeed__GL_Account_Variable_1__c, 'This field was not updated');
        System.assertNotEquals(null, bLineToCheck.AcctSeed__GL_Account_Variable_2__c, 'This field should have been updated.');
        System.assertNotEquals(null, bLineToCheck.AcctSeed__Expense_GL_Account__c, 'This field should have been updated, and should not have a value of null.');
        System.assertNotEquals(null, bLineToCheck.AcctSeed__Revenue_GL_Account__c, 'This field should have been updated, and should not have a value of null.');
        System.assertNotEquals(bLineToUpdate.AcctSeed__Revenue_GL_Account__c, bLineToCheck.AcctSeed__Revenue_GL_Account__c, 'This field was not updated properly.');
        System.assertEquals(false, bLineToCheck.Update__c, 'This field was not reset to false on completion of the trigger.');
    }
        // asserts that no fields should be populated as conditions are not met (AcctSeed__Billing_Line__c.AcctSeed__Product__r.AcctSeed__Inventory_Type__c = 'Purchased' and AcctSeed__Billing__r.Billing_Type__c = 'Managed Service Asset')
    static testMethod void testNotAutoPopulate(){
        Account newAcc = createTestAccountForAuto();
        
        List<AcctSeed__Gl_Account__c> revGLs = new List<AcctSeed__Gl_Account__c>();
        revGLs.add(new AcctSeed__Gl_Account__c(GL_Number__c = '12420', AcctSeed__Sub_Type_1__c = 'Assets'));
        revGLs.add(new AcctSeed__Gl_Account__c(GL_Number__c = '12890', AcctSeed__Sub_Type_1__c = 'Assets'));
        insert revGLs;

        createAccountTax(newAcc, createTestSalesProduct());     
        
        AcctSeed__Billing__c billing = createBillingForAuto(newAcc);
        
        createBillingLine(billing, createTestProductForAuto());
        
        AcctSeed__Billing_Line__c bLineToUpdate = [SELECT Id, Update__c, RB_Invoice_Line_Description__c, 
                                                    AcctSeed__Gl_Account_Variable_1__c, AcctSeed__Gl_Account_Variable_2__c,
                                                    AcctSeed__Expense_GL_Account__c, AcctSeed__Revenue_GL_Account__c
                                                    FROM AcctSeed__Billing_Line__c where AcctSeed__Billing__c = :billing.Id
                                                    AND AcctSeed__Product__r.AcctSeed__Accounting_type__c != 'Tax Rate'];
                                        
        Test.startTest();
            BillingLineSalesTaxTriggerUtil.run = true;
            bLineToUpdate.RB_Invoice_Line_Description__c = 'Hello World';
            update bLineToUpdate;
        Test.stopTest();
        
        AcctSeed__Billing_Line__c bLineToCheck = [SELECT Id, Update__c, AcctSeed__GL_Account_Variable_1__c, AcctSeed__GL_Account_Variable_2__c,
                                                   AcctSeed__Expense_GL_Account__c, AcctSeed__Revenue_GL_Account__c
                                                   FROM AcctSeed__Billing_Line__c where AcctSeed__Billing__c = :billing.Id 
                                                   AND AcctSeed__Product__r.AcctSeed__Accounting_type__c != 'Tax Rate'];
        
        System.assertEquals(bLineToUpdate.AcctSeed__Gl_Account_Variable_1__c, bLineToCheck.AcctSeed__GL_Account_Variable_1__c, 'This field should not have been updated in this instance');
        System.assertEquals(bLineToUpdate.AcctSeed__GL_Account_Variable_2__c, bLineToCheck.AcctSeed__GL_Account_Variable_2__c, 'This field should not have been updated in this instance');
        System.assertEquals(bLineToUpdate.AcctSeed__Expense_GL_Account__c, bLineToCheck.AcctSeed__Expense_GL_Account__c, 'This field should not have been updated in this instance');
        System.assertEquals(bLineToUpdate.AcctSeed__Revenue_GL_Account__c, bLineToCheck.AcctSeed__Revenue_GL_Account__c, 'This field should not have been updated in this instance');
        System.assertEquals(false, bLineToCheck.Update__c, 'This field should have been reset to false on completion of the trigger.');
    }
    
        // Constructor methods 
    static Account createTestAccount(){
        AccountingSeedUnittestUtility.initAccountingSeed();
        
        Account acc = new Account(Name = 'TestAccount 1',Branch__c = AccountingSeedUnittestUtility.variables[0].Id);
        insert acc;
        return acc;
    }    
        
    static Account createTestAccountForAuto(){
        AccountingSeedUnitTestUtility.initAccountingSeed();
        List<AcctSeed__GL_Account__c > glAcc = [SELECT Id FROM AcctSeed__GL_Account__c LIMIT 3];
        
        AcctSeed__Accounting_Variable__c thisAccV = new AcctSeed__Accounting_Variable__c(AcctSeed__type__c = 'GL Account Variable 1', AcctSeed__Active__c = true);
        insert thisAccV;
        
        AcctSeed__Accounting_Variable__c thisAccV1 = new AcctSeed__Accounting_Variable__c(AcctSeed__type__c = 'GL Account Variable 2', AcctSeed__Active__c = true);
        insert thisAccV1;

        
        Account acc = new Account(Name = 'Test Account', Branch__c = thisAccV.Id, Account_Executive__c = thisAccV1.Id);
        
        insert acc;
        return acc;
    }
    
    static Product2 createTestProduct(){
        List<AcctSeed__GL_Account__c > glAcc = [SELECT Id FROM AcctSeed__GL_Account__c LIMIT 3];
        
        Product2 prod = new Product2(Name = 'Test Product', AcctSeed__Accounting_type__c = 'Taxable Product', AcctSeed__Tax_Rate__c = 5.0000);
        
        insert prod;
        return prod;
    }
    
    static Product2 createTestProductForAuto(){
        List<AcctSeed__GL_Account__c > glAcc = [SELECT Id FROM AcctSeed__GL_Account__c LIMIT 3];
        
        Product2 prod = new Product2(Name = 'Test Product', AcctSeed__Accounting_type__c = 'Taxable Product', AcctSeed__Tax_Rate__c = 5.0000,
                                        AcctSeed__Inventory_Type__c = 'Purchased',
                                        AcctSeed__Inventory_GL_Account__c = glAcc[2].Id, AcctSeed__Unit_Cost__c = 20.00,
                                        AcctSeed__Revenue_GL_Account__c = glAcc[0].Id, AcctSeed__Expense_GL_Account__c = glAcc[1].Id);
        
        insert prod;
        return prod;
    }
    
    static Product2 createTestSalesProduct(){
    
        List<AcctSeed__GL_Account__c > glAcc = [SELECT Id FROM AcctSeed__GL_Account__c LIMIT 3];
    
        Product2 prod = new Product2(Name = 'Test Tax Product', AcctSeed__Accounting_type__c = 'Tax Rate', 
                                        AcctSeed__Tax_Rate__c = 5.0000, AcctSeed__Revenue_GL_Account__c = glAcc[0].Id, 
                                        AcctSeed__Expense_GL_Account__c = glAcc[1].Id);

        insert prod;        
        return prod;
    }
    
    static void createAccountTax(Account acc, product2 prod){
        AS_Tax__Account_Tax__c accTax = new AS_Tax__Account_Tax__c(AS_Tax__Account__c = acc.Id, AS_Tax__Tax_Rate__c = prod.Id, AS_Tax__Tax_Type__c = 'Sales');
        insert accTax;
    }
    
    static AcctSeed__Billing__c createBilling(Account acc){
        AcctSeed__Billing__c bill = new AcctSeed__Billing__c(AcctSeed__Customer__c = acc.Id, AcctSeed__Status__c = 'In Process');
        insert bill;
        return bill;
    }
    
    static AcctSeed__Billing__c createBillingForAuto(Account acc){
        AcctSeed__Billing__c bill = new AcctSeed__Billing__c(Billing_Type__c = 'Managed Service Asset', AcctSeed__Customer__c = acc.Id, AcctSeed__Status__c = 'In Process');
        insert bill;
        return bill;
    }
    
    static AcctSeed__Billing__c createPostedBilling(Account acc, Product2 prod){
        AcctSeed__Billing__c bill = new AcctSeed__Billing__c(AcctSeed__Customer__c = acc.Id, AcctSeed__Status__c = 'Approved');
        insert bill;
        
        BillingLineSalesTaxTriggerUtil.run = false; 
        createBillingLine(bill, prod);
        
        //BS@IC Can no longer post billings directly
        /* AcctSeed__Billing__c posted = [SELECT Id, AcctSeed__Customer__c, AcctSeed__Status__c FROM AcctSeed__Billing__c];
        posted.AcctSeed__Status__c = 'Posted';
        update posted; */
        
        AcctSeed.PostResult[] postResult = AcctSeed.BillingPostService.postBillings(new AcctSeed__Billing__c[]{bill});
        System.assertEquals(true, postResult[0].isSuccess);
        //System.assert(false, postResult[0].errors[0].message);
        AcctSeed__Billing__c posted = [SELECT Id, AcctSeed__Customer__c, AcctSeed__Status__c FROM AcctSeed__Billing__c];

        return posted;
    }
    
    static void createBillingLine(AcctSeed__Billing__c bill, Product2 prod){
        List<AcctSeed__GL_Account__c > glAcc = [SELECT Id FROM AcctSeed__GL_Account__c LIMIT 3];
    
        AcctSeed__Billing_Line__c billingLine = new AcctSeed__Billing_line__c(AcctSeed__Revenue_GL_Account__c = glAcc[0].Id, AcctSeed__Billing__c = bill.Id, AcctSeed__Product__c = prod.Id, AcctSeed__Hours_Units__c = 1, AcctSeed__Rate__c = 20.00);
        insert billingLine; 
    }
}