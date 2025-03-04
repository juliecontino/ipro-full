/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class FinancialReporterInvocableOptions {
    @InvocableVariable(label='Budget Ledger' description='Budget Ledger' required=false)
    global Id budgetLedger;
    @InvocableVariable(label='Currency ISO Code' description='Currency ISO Code' required=false)
    global String currencyISO;
    @InvocableVariable(label='Ending Accounting Period Id' description='Ending Accounting Period Id' required=false)
    global Id endingAccountingPeriod;
    @InvocableVariable(label='Custom Report Id' description='Custom Report Id' required=false)
    global Id financialReportDefinitionId;
    @InvocableVariable(label='GL Variable 1' description='GL Variable 1' required=false)
    global Id glVariable1;
    @InvocableVariable(label='GL Variable 2' description='GL Variable 2' required=false)
    global Id glVariable2;
    @InvocableVariable(label='GL Variable 3' description='GL Variable 3' required=false)
    global Id glVariable3;
    @InvocableVariable(label='GL Variable 4' description='GL Variable 4' required=false)
    global Id glVariable4;
    @InvocableVariable(label='Include Sub Type 1' description='Include Sub Type 1' required=false)
    global Boolean includeSubType1;
    @InvocableVariable(label='Include Sub Type 2' description='Include Sub Type 2' required=false)
    global Boolean includeSubType2;
    @InvocableVariable(label='Ledger Id' description='Ledger Id' required=false)
    global Id ledger;
    @InvocableVariable(label='Report Type: PROFIT_AND_LOSS, PROFIT_AND_LOSS_VS_BUDGET, BALANCE_SHEET, TRIAL_BALANCE, CASH_FLOW, CUSTOM' description='One of the following: PROFIT_AND_LOSS, PROFIT_AND_LOSS_VS_BUDGET, BALANCE_SHEET, TRIAL_BALANCE, CASH_FLOW, CUSTOM' required=true)
    global String reportType;
    @InvocableVariable(label='Rounding Mode:  NO_ROUNDING, WHOLE_AMOUNTS, ROUND_TO_1000' description='Rounding Mode' required=false)
    global String roundingMode;
    @InvocableVariable(label='Show All Periods' description='Show All Periods' required=false)
    global Boolean showAllPeriods;
    @InvocableVariable(label='Starting Accounting Period Id' description='Starting Accounting Period Id' required=false)
    global Id startingAccountingPeriod;
    @InvocableVariable(label='Subtitle' description='Subtitle' required=false)
    global String subtitle;
    @InvocableVariable(label='Suppress Opening Balance' description='Suppress Opening Balance' required=false)
    global Boolean suppressOpeningBalanceAndPeriodColumns;
    @InvocableVariable(label='Suppress Zero Amount Rows' description='Suppress Zero Amount Rows' required=false)
    global Boolean suppressZeroAmountRows;
    global FinancialReporterInvocableOptions() {

    }
}
