/*
    10/12/2015  MD@IC  Initial creation (00121705)
    06/02/2016  BS@IC  Minor fix (132110)
    07/12/2016  BS@IC  Modified for compatibility with Accounting Seed update (132907)
*/
@isTest
private class CreateBillingLinesTest{

    //@isTest(SeeAllData=true) static void tester(){
    @isTest static void tester(){
        AccountingSeedUnitTestUtility.initAccountingSeed();
        
        insert new CurrentEnvironment__c(
            Name = 'currentEnvironment',
            environment__c = 'test');
        insert new SpringCM_REST_Environmental__c(
            Name = 'test',
            API_Key__c = '57ee22a0-b6a2-4f04-bde5-6975f1c9a6a3',
            Auth_URL__c = 'https://auth.springcm.com/oauth/201309/token/',
            Base_URL__c = 'https://apina11.springcm.com',
            Client_Secret__c = '78154afc56ac4b5fbbe7a2392eea4e301On4yn58kaocP7weGnSFCjRE30HF11xZaVEHMr2rFlbOwLeAwy1XlZaS7jB7g0GsmOC42pRYvk9aHDSrWGTD9axA4wKnq5LP');
        Account a = new Account(
            Name = 'test co.',
            Branch__c = AccountingSeedUnittestUtility.variables[0].Id);
        insert a;
        Contact c = new Contact(
            AccountId = a.Id,
            LastName = 'test');
        insert c;
        /* AcctSeed__Accounting_Period__c period = new AcctSeed__Accounting_Period__c(
            Name = System.now().formatGMT('yyyy-MM'),
            AcctSeed__Start_Date__c = Date.today().toStartOfMonth(),
            AcctSeed__End_Date__c = Date.today().addMonths(1).toStartOfMonth().addDays(-1),
            AcctSeed__Status__c = 'Open');
        insert period; */
        AcctSeed__GL_Account__c gl = new AcctSeed__GL_Account__c(
            AcctSeed__Type__c = 'Balance Sheet',
            AcctSeed__Sub_Type_1__c = 'Assets');
        insert gl;
        
        AcctSeed__Account_Payable__c ap = new AcctSeed__Account_Payable__c(
            //AcctSeed__Accounting_Period__c = period.Id,
            Client__c = a.Id,
            AcctSeed__Payee_Reference__c = 'none',
            AcctSeed__Contact__c = c.Id,
            AcctSeed__Status__c = 'Posted');
        insert ap;
        ap = [SELECT AcctSeed__Accounting_Period__c, Client__c, AcctSeed__Payee_Reference__c, AcctSeed__Contact__C, AcctSeed__Status__c FROM AcctSeed__Account_Payable__c][0];
        //BS replaced with AcctSeed.AccountPayablePostService.postAccountPayables() after lines are inserted later.
        //ap.AcctSeed__Status__c = 'Posted';
        //update ap;
        system.debug(ap);
        // TODO: add Product, 2x AcctSeed__Accounting_Variable__c
        Product2 p = new Product2(
            Name = 'Test Product',
            IsActive = true,
            AcctSeed__Revenue_GL_Account__c = gl.Id);
        insert p;
        Product2 passP = new Product2(
            Name = 'Test Product',
            IsActive = true,
            AcctSeed__Revenue_GL_Account__c = gl.Id,
            PassThrough_Taxes__c = true);
        insert passP;
        AcctSeed__Accounting_Variable__c var1 = new AcctSeed__Accounting_Variable__c();
        AcctSeed__Accounting_Variable__c var2 = new AcctSeed__Accounting_Variable__c();
        //insert new List<AcctSeed__Accounting_Variable__c>{var1,var2};
        AcctSeed__Account_Payable_Line__c apl = new AcctSeed__Account_Payable_Line__c(
            AcctSeed__Account_Payable__c = ap.Id,
            Client__c = a.Id,
            AcctSeed__Amount__c = 1000,
            AcctSeed__Quantity__c = 0,
            AcctSeed__Expense_GL_Account__c = gl.Id,
            AcctSeed__Billable__c = true,
            Billing_Line__c = null,
            AcctSeed__Product__c = p.Id);
        insert apl;
        AcctSeed__Account_Payable_Line__c aplPass = new AcctSeed__Account_Payable_Line__c(
            AcctSeed__Account_Payable__c = ap.Id,
            Client__c = a.Id,
            AcctSeed__Amount__c = 1000,
            AcctSeed__Quantity__c = 0,
            AcctSeed__Expense_GL_Account__c = gl.Id,
            AcctSeed__Billable__c = true,
            Billing_Line__c = null,
            AcctSeed__Product__c = passP.Id);
        insert aplPass;
        
        //Post Account Payable
        AcctSeed.PostResult[] postResult = AcctSeed.AccountPayablePostService.postAccountPayables(new AcctSeed__Account_Payable__c[]{ap});
        System.assertEquals(true, postResult[0].isSuccess);
        //System.assert(false, postResult[0].errors[0].message);
        
        AcctSeed__Billing_Format__c bf = new AcctSeed__Billing_Format__c(
            AcctSeed__Visualforce_PDF_Page__c = 'BillingActivityStatementPDF',
            AcctSeed__Default_Email_Template__c = 'Activity_Statement_Email_Template');
        insert bf;
        AcctSeed__Recurring_Billing__c rb = new AcctSeed__Recurring_Billing__c(
            AcctSeed__Billing_Frequency__c = 'Annual',
            AcctSeed__Customer__c = a.Id,
            AcctSeed__Next_Billing_Date__c = Date.today().addYears(1));
        insert rb;
        AcctSeed__Billing__c b = new AcctSeed__Billing__c(
            AcctSeed__Customer__c = a.Id,
            AcctSeed__Billing_Format__c = bf.Id,
            AcctSeed__Recurring_Billing__c = rb.Id);
        Test.startTest();
            insert b;
        Test.stopTest();

        List<AcctSeed__Billing_Line__c> billingLines = [SELECT Id FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Billing__c = :b.Id];
        System.assertEquals(2, billingLines.size(), 'Not enough billine lines');

        // test the apLine was updated
        apl = [SELECT Billing_Line__c FROM AcctSeed__Account_Payable_Line__c WHERE Id = :apl.Id];
        System.assert(apl.Billing_Line__c == billingLines[0].Id || apl.Billing_Line__c == billingLines[1].Id, 'apLine.Billing_Line was not set');
    }

}