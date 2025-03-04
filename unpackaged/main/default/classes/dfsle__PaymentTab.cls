/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class PaymentTab extends dfsle.FormulaTab {
    global dfsle.PaymentTab.Payment payment {
        get;
    }
    global PaymentTab() {

    }
    global dfsle.PaymentTab withPayment(dfsle.PaymentTab.Payment payment) {
        return null;
    }
global class LineItem {
    global String amountReference {
        get;
    }
    global String description {
        get;
    }
    global String itemCode {
        get;
    }
    global String name {
        get;
    }
    global LineItem(String name, String description, String itemCode, String amountReference) {

    }
}
global class Payment {
    global Boolean authorize {
        get;
    }
    global String currencyCode {
        get;
    }
    global String customerId {
        get;
    }
    global String customMetadata {
        get;
    }
    global Boolean customMetadataRequired {
        get;
    }
    global dfsle.UUID docuSignGatewayId {
        get;
    }
    global List<dfsle.PaymentTab.LineItem> lineItems {
        get;
    }
    global List<String> methods {
        get;
    }
    global Boolean save {
        get;
    }
    global String sourceId {
        get;
    }
    global Payment(dfsle.UUID docuSignGatewayId, String customerId, String sourceId, List<String> methods, String currencyCode, List<dfsle.PaymentTab.LineItem> lineItems, Boolean authorize, Boolean save, String customMetadata, Boolean customMetadataRequired) {

    }
}
}
