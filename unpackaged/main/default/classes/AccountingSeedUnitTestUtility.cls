/*
    02/05/15    SB @ IC
    09/16/15    BS @ IC Static GL Accounts (119334)
*/
public class AccountingSeedUnitTestUtility {
    
    public static AcctSeed__Accounting_Settings__c settings;
    public static list<AcctSeed__Accounting_Variable__c> variables;
    public static Product2 prod;
    public static AcctSeed__GL_Account__c revenueGL;
    public static AcctSeed__GL_Account__c bankGL;
    public static AcctSeed__GL_Account__c retainedGL;
    public static AcctSeed__GL_Account__c receivablesGL;
    public static AcctSeed__GL_Account__c cashGL;
    public static AcctSeed__GL_Account__c payableGL;
    
    public static void initAccountingSeed() {
        revenueGL = new AcctSeed__GL_Account__c(
            AcctSeed__Type__c = 'Revenue',
            AcctSeed__Active__c = true,
            Name = 'Unassigned Revenue',
            GL_Number__c = '40000'
        );
        
        bankGL = new AcctSeed__GL_Account__c(
            AcctSeed__Type__c = 'Balance Sheet',
            AcctSeed__Sub_Type_1__c = 'Assets',
            AcctSeed__Active__c = true,
            AcctSeed__Bank__c = true,
            Name = 'Default Bank GL',
            GL_Number__c = '10120'
        );
        
        retainedGL = new AcctSeed__GL_Account__c(
            AcctSeed__Type__c = 'Balance Sheet',
            AcctSeed__Sub_Type_1__c = 'Assets',
            AcctSeed__Active__c = true,
            Name = 'Retained Earnings',
            GL_Number__c = '39000'
        );
        
        receivablesGL = new AcctSeed__GL_Account__c(
            AcctSeed__Type__c = 'Balance Sheet',
            AcctSeed__Sub_Type_1__c = 'Assets',
            AcctSeed__Active__c = true,
            Name = 'Unassigned Receivables',
            GL_Number__c = '11100'
        );
        
        cashGL = new AcctSeed__GL_Account__c(
            AcctSeed__Type__c = 'Balance Sheet',
            AcctSeed__Sub_Type_1__c = 'Assets',
            AcctSeed__Active__c = true,
            Name = 'Cash - Clearing Account',
            GL_Number__c = '10190'
        );
        
        payableGL = new AcctSeed__GL_Account__c(
            AcctSeed__Type__c = 'Balance Sheet',
            AcctSeed__Sub_Type_1__c = 'Assets',
            AcctSeed__Active__c = true,
            Name = 'Accounts Payable - Vendors',
            GL_Number__c = '20010'
        );
        
        insert new list<AcctSeed__GL_Account__c>{revenueGL,bankGL,retainedGL,receivablesGL,cashGL,payableGL};
        
        AcctSeed__Ledger__c ledger = new AcctSeed__Ledger__c(
            Name = 'ledger',
            AcctSeed__Type__c = 'Transactional'
        );
        insert ledger;
        
        AcctSeed__Billing_Format__c format = new AcctSeed__Billing_Format__c(
            AcctSeed__Default_Email_Template__c = 'Billing_Email_Template',
            AcctSeed__Visualforce_PDF_Page__c = 'ProjectBillingPDF'
        );
        insert format;
        
        settings = new AcctSeed__Accounting_Settings__c(
            AcctSeed__AP_Control_GL_Account__c = payableGL.Id,
            AcctSeed__AR_Control_GL_Account__c = receivablesGL.Id,
            AcctSeed__Current_Year_Earnings_GL_Account__c = retainedGL.Id,
            AcctSeed__Default_Bank_Account__c = bankGL.Id,
            AcctSeed__Retained_Earnings_GL_Account__c = retainedGL.Id,
            AcctSeed__Revenue_GL_Account__c = revenueGL.Id,
            AcctSeed__Unapplied_Cash_GL_Account__c = cashGL.Id,
            AcctSeed__Default_Ledger__c = ledger.Id,
            AcctSeed__Default_Billing_Format__c = format.Id,
            AcctSeed__Billing_Outstanding_Statement_Format__c = format.Id,
            AcctSeed__Billing_Activity_Statement_Format__c = format.Id
        );
        insert settings;
        
        variables = new list<AcctSeed__Accounting_Variable__c>{};
        
        AcctSeed__Accounting_Variable__c variable11 = new AcctSeed__Accounting_Variable__c(
            AcctSeed__Type__c = 'GL Account Variable 1'
        );
        variables.add(variable11);
        
        AcctSeed__Accounting_Variable__c variable12 = new AcctSeed__Accounting_Variable__c(
            AcctSeed__Type__c = 'GL Account Variable 1'
        );
        variables.add(variable12);
        
        AcctSeed__Accounting_Variable__c variable21 = new AcctSeed__Accounting_Variable__c(
            AcctSeed__Type__c = 'GL Account Variable 2'
        );
        variables.add(variable21);
        
        AcctSeed__Accounting_Variable__c variable22 = new AcctSeed__Accounting_Variable__c(
            AcctSeed__Type__c = 'GL Account Variable 2'
        );
        variables.add(variable22);
        
        AcctSeed__Accounting_Variable__c variable31 = new AcctSeed__Accounting_Variable__c(
            AcctSeed__Type__c = 'GL Account Variable 3'
        );
        variables.add(variable31);
        
        AcctSeed__Accounting_Variable__c variable32 = new AcctSeed__Accounting_Variable__c(
            AcctSeed__Type__c = 'GL Account Variable 3'
        );
        variables.add(variable32);
        
        insert variables;
        
        AcctSeed__Accounting_Period__c acctPeriod = new AcctSeed__Accounting_Period__c(
            Name = System.now().format('yyyy-MM'),
            AcctSeed__Start_Date__c = Date.today().addDays(-7),
            AcctSeed__End_Date__c = Date.today(),
            AcctSeed__Status__c = 'Open'
        );
        insert acctPeriod;
        
        prod = new Product2(
            IsActive = true,
            Name = 'Test Product',
            ProductCode = '12345',
            AcctSeed__Revenue_GL_Account__c = revenueGL.Id,
            AcctSeed__GL_Account_Variable_1__c = variable11.Id,
            AcctSeed__GL_Account_Variable_2__c = variable21.Id,
            AcctSeed__GL_Account_Variable_3__c = variable31.Id
        );
        insert prod;
    }
}