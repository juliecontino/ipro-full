/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class CreditsAndRefundsOptions {
    @AuraEnabled
    global Id bankAccount;
    global Id billingId;
    @AuraEnabled
    global Id cashFlowCategory;
    global Id cashReceiptId;
    global Id creditGLAccount;
    global Decimal currencyConversionRate;
    global String currencyIsoCode;
    global Id customer;
    global Id ledger;
    @AuraEnabled
    global String memo;
    @AuraEnabled
    global String paymentType;
    @AuraEnabled
    global String reference;
    @AuraEnabled
    global Decimal refundAmount;
    @AuraEnabled
    global Date refundDate;
    global Decimal sourceRecordBalance;
    global Date sourceRecordDate;
    @AuraEnabled
    global Id sourceRecordId;
    global CreditsAndRefundsOptions(Id sourceRecordId) {

    }
}
