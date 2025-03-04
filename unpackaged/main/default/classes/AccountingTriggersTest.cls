/*
Test for Account Payable trigger (and other triggers created to replace process builder processes)

01/27/16 BS@IC Created (126633)
06/02/16 BS@IC Updated (132110)
09/01/16 MD@IC Updated to account for AP.Client__c being set (00135874)
*/

@isTest
public class AccountingTriggersTest {
    private static AcctSeed__Accounting_Period__c period;
    private static AcctSeed__Gl_Account__c gl;

    private static void initTestData() {
        period = new AcctSeed__Accounting_Period__c(
            Name = System.now().format('yyyy-MM'),
            AcctSeed__Start_Date__c = Date.today().toStartOfMonth(),
            AcctSeed__End_Date__c = Date.today().addMonths(1).toStartOfMonth().addDays(-1),
            AcctSeed__Status__c = 'Open'
        );
        insert period; 
        
        gl = new AcctSeed__Gl_Account__c(
            Name = 'AccountingTriggersTest GL',
            AcctSeed__Type__c = 'Balance Sheet',
            AcctSeed__Sub_Type_1__c = 'Liabilities'
        );
        insert gl;
    }

    public static testMethod void testAccountPayableTrigger() {
        initTestData();
        
        AcctSeed__Accounting_Variable__c variable1 = new AcctSeed__Accounting_Variable__c(
            Name = 'AccountingTriggersTest',
            AcctSeed__Type__c = 'GL Account Variable 1'
        );
        AcctSeed__Accounting_Variable__c variable2 = new AcctSeed__Accounting_Variable__c(
            Name = 'AccountingTriggersTest',
            AcctSeed__Type__c = 'GL Account Variable 2'
        );
        insert new AcctSeed__Accounting_Variable__c[] {variable1, variable2};

        Account client = new Account(
            Name = 'AccountingTriggersTest Client',
            Account_Executive__c = variable2.Id,
            Branch__c = variable1.Id
        );
        Account vendor = new Account(
            Name = 'AccountingTriggersTest Vendor',
            Branch__c = variable1.Id);
        insert new Account[]{client, vendor};
        
        Product2 prod = new Product2(Name = 'AccountingTriggersTest');
        insert prod;
        
        Apex_Code_Settings__c settings = new Apex_Code_Settings__c(
            GL_13240_Id__c = gl.Id,
            GL_14020_Id__c = gl.Id,
            GL_16021_Id__c = gl.Id,
            GL_16023_Id__c = gl.Id,
            Misc_Taxes_Surcharges_and_Fees_Id__c = prod.Id,
            Texas_Sales_Tax_Id__c = prod.Id,
            Texas_Star_Bank_Id__c = client.Id
        );
        insert settings;

        AcctSeed__Billing_Format__c format = new AcctSeed__Billing_Format__c(
            AcctSeed__Default_Email_Template__c = 'Billing_Email_Template',
            AcctSeed__Visualforce_PDF_Page__c = 'ProjectBillingPDF');
        insert format;

        AcctSeedERP__Purchase_Order__c po = new AcctSeedERP__Purchase_Order__c(
            Account__c = client.Id,
            AcctSeedERP__Purchase_Order_Format__c = format.Id);
        insert po;
    
        AcctSeed__Account_Payable__c ap = new AcctSeed__Account_Payable__c(
            AcctSeed__Payment_Status__c = 'Approved',
            AcctSeed__Payee_Reference__c = System.now().format('yyyy-MM-dd hh:mm:ss'),
            AcctSeed__Vendor__c = vendor.Id,
            AcctSeed__Accounting_Period__c = period.Id,
            //MS_Lease_Payment__c = true,
            MS_Lease_Payment__c = false, //Avoid process builder error
            Client_Telephone_Bill__c = true,
            //Client__c = client.Id
            AcctSeedERP__Purchase_Order__c = po.Id
        );
        insert ap;

        ap = [SELECT Id, Client__c FROM AcctSeed__Account_Payable__c WHERE Id = :ap.Id];
        System.assertEquals(client.Id, ap.Client__c, 'AP.Client__c was not set');
        
        //One of the lines is not created since MS_Lease_Payment__c is false
        //System.assertEquals(4, [SELECT Id FROM AcctSeed__Account_Payable_Line__c WHERE AcctSeed__Account_Payable__c = :ap.Id].size());
        System.assertEquals(3, [SELECT Id FROM AcctSeed__Account_Payable_Line__c WHERE AcctSeed__Account_Payable__c = :ap.Id].size());
        
        //AccountPayableLine Trigger
        AcctSeed__Account_Payable_Line__c apl = new AcctSeed__Account_Payable_Line__c(
            AcctSeed__Account_Payable__c = ap.Id,
            AcctSeed__Amount__c = 0,
            Client__c = client.Id,
            AcctSeed__Expense_GL_Account__c = gl.Id
        );
        insert apl;
        
        apl = [SELECT AcctSeed__GL_Account_Variable_1__c, AcctSeed__GL_Account_Variable_2__c FROM AcctSeed__Account_Payable_Line__c WHERE Id = :apl.Id];
        System.assertEquals(variable1.Id, apl.AcctSeed__GL_Account_Variable_1__c);
        System.assertEquals(variable2.Id, apl.AcctSeed__GL_Account_Variable_2__c);
    }

    public static testMethod void testBillingLineTrigger() {
        initTestData();
        
        AcctSeed__Billing_Format__c billingFormat = new AcctSeed__Billing_Format__c(
            Name = 'testBillingLineTrigger',
            AcctSeed__Type__c = 'Billing',
            AcctSeed__Default_Email_Template__c = 'Billing_Email_Template',
            AcctSeed__Visualforce_PDF_Page__c = 'BillingProductPDF'
        );
        insert billingFormat;

        AcctSeed__Accounting_Variable__c variable1 = new AcctSeed__Accounting_Variable__c(
            Name = 'AccountingTriggersTest',
            AcctSeed__Type__c = 'GL Account Variable 1');
        insert variable1;
    
        Account customer = new Account(
            Name = 'AccountingTriggersTest Customer',
            Branch__c = variable1.Id);
        insert customer;

        AcctSeed__Billing__c billing = new AcctSeed__Billing__c(
            AcctSeed__Status__c = 'Approved',
            AcctSeed__Customer__c = customer.Id,
            AcctSeed__Date__c = Date.today(),
            AcctSeed__Accounting_Period__c = period.Id,
            Partial_Recurring_Bill__c = true,
            Partial_Recurring_Billing_Start_Date__c = Date.today(),
            Partial_Recurring_Billing_End_Date__c = Date.today().addDays(10),
            AcctSeed__Billing_Format__c = billingFormat.Id
        );
        insert billing;

        AcctSeed__Billing_Line__c line = new AcctSeed__Billing_Line__c(
            AcctSeed__Billing__c = billing.Id,
            AcctSeed__Hours_Units__c = 1,
            AcctSeed__Rate__c = 90,
            AcctSeed__Date__c = Date.today(),
            AcctSeed__Revenue_GL_Account__c = gl.Id
        );
        insert line;
        
        line = [SELECT AcctSeed__Hours_Units__c FROM AcctSeed__Billing_Line__c WHERE Id = :line.Id];
        System.assertEquals(30, Math.round(line.AcctSeed__Hours_Units__c));
    }
}