/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class AmortizationOptions {
    @InvocableVariable(label='Amortization Method' description='Amortization Method to use as defined in the Label field on the Binding Custom Metadata Type' required=true)
    global String amortizationMethod;
    @InvocableVariable(label='Amount' description='Amount to Amortize.  Typically set to the Total__c value on Billing or Payable or Amount__c on Billing and Payable lines, but it can be set to any amount you wish to amortize' required=false)
    global Decimal amount;
    @InvocableVariable(label='Credit GL Account Id' description='Upon posting a credit entry will be made to this GL account.' required=false)
    global Id creditGlAccount;
    @InvocableVariable(label='Debit GL Account Id' description='Upon posting a debit entry will be made to this GL account.' required=false)
    global Id debitGlAccount;
    @InvocableVariable(label='Description' description='Used to capture any external source document identifier or description.' required=false)
    global String description;
    @InvocableVariable(label='End Date' description='End Date' required=false)
    global Date endDate;
    @InvocableVariable(label='GL Account Variable 1 Id' description='General Ledger segment used for reporting of a business unit such as division or department.' required=false)
    global Id glVariable1;
    @InvocableVariable(label='GL Account Variable 2 Id' description='General Ledger segment used for reporting of a business unit such as division or department.' required=false)
    global Id glVariable2;
    @InvocableVariable(label='GL Account Variable 3 Id' description='General Ledger segment used for reporting of a business unit such as division or department.' required=false)
    global Id glVariable3;
    @InvocableVariable(label='GL Account Variable 4 Id' description='General Ledger segment used for reporting of a business unit such as division or department.' required=false)
    global Id glVariable4;
    @InvocableVariable(label='Number Of Periods' description='Number Of Periods' required=false)
    global Integer numberOfPeriods;
    @InvocableVariable(label='Related Product Id' description='Related Product' required=false)
    global Id product;
    @InvocableVariable(label='Project Id' description='Typically used to track customer engagements or events' required=false)
    global Id project;
    @InvocableVariable(label='Project Task Id' description='Used to track a detailed component of Project' required=false)
    global Id projectTask;
    @InvocableVariable(label='Record to Amortize Id' description='The Id for the record to create amortization entries' required=true)
    global Id sourceDocument;
    @InvocableVariable(label='Start Date' description='Start Date' required=true)
    global Date startDate;
    global AmortizationOptions() {

    }
}
