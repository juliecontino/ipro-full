/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class PostResult {
    global List<AcctSeed.PostResult.PostErrorResult> errors {
        get;
    }
    global String id {
        get;
    }
    global Boolean isSuccess {
        get;
    }
    global String name {
        get;
    }
    global PostResult(Boolean isSuccess, String id, List<AcctSeed.PostResult.PostErrorResult> errors) {

    }
    global PostResult(Boolean isSuccess, String id, String name, List<AcctSeed.PostResult.PostErrorResult> errors) {

    }
global class PostErrorResult {
    global SObject errorSource {
        get;
    }
    global String message {
        get;
    }
    global AcctSeed.PostResult.StatusCode statusCode {
        get;
    }
    global PostErrorResult(AcctSeed.PostResult.StatusCode statusCode, String message) {

    }
    global PostErrorResult(SObject errorSource, AcctSeed.PostResult.StatusCode statusCode, String message) {

    }
}
global enum StatusCode {ALREADY_POSTED, ALREADY_UNPOSTED, AP_CREDIT_MEMOS_EXIST, AP_DISBURSEMENTS_EXIST, APPLIED_TO_PAYABLE, APPLIED_TO_PAYABLE_CREDIT_MEMO, AVATAX_CALLOUT_ERROR, AVATAX_SERVICE_ERROR, BALANCE_OVERAPPLIED, BILLING_CASH_RECEIPTS_EXIST, BILLING_CREDIT_MEMOS_EXIST, CASH_FLOW_NON_CONFORMITY, CLEARED_BANK_DEPOSIT, CLEARED_BANK_RECONCILIATION, CLOSED_ACCOUNTING_PERIOD, CREDITS_DEBITS_NOT_EQUAL, DEBIT_GL_ACCOUNT_IS_NULL_OR_SET_TO_AP_CONTROL_ACCOUNT, INCORRECT_APD_AMOUNT, INCORRECT_MOVEMENT_TYPE, INVALID_RECORD_ID, LEDGER_NO_TAX_SETTINGS, LEDGER_TYPE_NOT_ALLOWED, LINE_COUNT_LIMIT_EXCEEDED, NO_CASH_FLOW_CATEGORY, NO_CONTROL_AP_ACCOUNT_DEFINED, NO_CONTROL_AR_ACCOUNT_DEFINED, NO_CONTROL_AR_OR_UNAPPLIED_CASH_ACCOUNT_DEFINED, NO_CREDIT_GL_ACCOUNT_ON_MOVEMENT, NO_DEBIT_GL_ACCOUNT, NO_DEBIT_GL_ACCOUNT_ON_MOVEMENT, NO_DISCOUNT_PAYMENT_ACCOUNT, NO_LABOR_CONTROL_ACCOUNT_DEFINED, NO_LINES, NO_QUALIFYING_RECORDS, NO_TASK_EXPENSE_GL_ACCOUNT_DEFINED, NO_UNAPPLIED_CASH_CONTROL_ACCOUNT_DEFINED, NO_UNIT_COST_ON_MOVEMENT, NO_VOUCHERS_PAYABLE_GL_ACCOUNT, NO_WORK_IN_PROCESS_GL_ACCOUNT, ONLY_ACTUAL_TIME_CARD_ALLOW, PAYMENT_STATUS_VOID, STATUS_NOT_APPROVED, SYSTEM_EXCEPTION, TAX_INCORRECT_CURRENCY, TAX_NO_PRODUCT_LINES, TAX_NO_TAXABLE_PRODUCT, TAX_NO_TAXES_ON_ACCOUNT, TAX_RECORD_COUNT_LIMIT_EXCEEDED}
}
