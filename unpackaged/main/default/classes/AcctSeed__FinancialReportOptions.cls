/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global abstract class FinancialReportOptions {
    @AuraEnabled
    global String currencyISO;
    @AuraEnabled
    global Id endingAccountingPeriod;
    @AuraEnabled
    global Id glVariable1;
    @AuraEnabled
    global Id glVariable2;
    @AuraEnabled
    global Id glVariable3;
    @AuraEnabled
    global Id glVariable4;
    @AuraEnabled
    global Boolean includeSubType1;
    @AuraEnabled
    global Boolean includeSubType2;
    @AuraEnabled
    global Id ledger;
    @AuraEnabled
    global Id startingAccountingPeriod;
    @AuraEnabled
    global String subtitle;
    @AuraEnabled
    global Boolean suppressOpeningBalanceAndPeriodColumns;
    @AuraEnabled
    global Boolean suppressZeroAmountRows;
    global FinancialReportOptions() {

    }
    global abstract List<AcctSeed__Accounting_Period__c> getAllPeriodsInReportingRange();
    global abstract List<Id> getLedgerIds();
    global abstract List<String> getListOfPeriodNames();
    global void setRoundingMode(AcctSeed.FinancialReportOptions.FinancialReportRoundingMode r) {

    }
global enum FinancialReportRoundingMode {NO_ROUNDING, ROUND_TO_1000, WHOLE_AMOUNTS}
global enum FinancialReportType {BALANCE_SHEET, CASH_FLOW, CUSTOM, LEDGER_INQUIRY, PROFIT_AND_LOSS, PROFIT_AND_LOSS_VS_BUDGET, TRIAL_BALANCE}
}
