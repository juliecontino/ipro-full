/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class InvocableSend {
    global InvocableSend() {

    }
    @InvocableMethod(label='E2CP Send Response' description='Send a response')
    global static void send(List<E2CP.InvocableSend.SendRequest> sendRequests) {

    }
global class InvocableException extends Exception {
}
global class SendRequest {
    @InvocableVariable(label='Response Body' description='Response content. Leave blank when specifying Canned Response Id.' required=false)
    global String body;
    @InvocableVariable(label='Canned Response Id' description='Id of the Canned Response to use for the Response Body. Leave blank when specifying Response Body.' required=false)
    global Id cannedResponseId;
    @InvocableVariable(label='Case Id' description='Id of the Case to send the response on.' required=true)
    global Id caseId;
    @InvocableVariable(label='Public Response' description='Set to "{!$GlobalConstant.True}" if response should be public; "{!$GlobalConstant.False}" if private.' required=true)
    global Boolean isPublic;
    @InvocableVariable(label='Email Template Id' description='Id of the email template to use when sending the response.' required=false)
    global Id templateId;
    global SendRequest() {

    }
}
}
