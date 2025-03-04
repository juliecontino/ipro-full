/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class InvocableSendLabels {
    global InvocableSendLabels() {

    }
    @InvocableMethod(label='Send Labels to Email (FedEx)' description='Send Labels to Email')
    global static void sendLabelsToEmail(List<zkfedex.InvocableSendLabels.SendLabelsParameter> inputList) {

    }
global class SendLabelsParameter {
    @InvocableVariable( required=true)
    global Id shipmentId;
    global SendLabelsParameter() {

    }
}
}
