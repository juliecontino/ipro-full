/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class CLMWorkflowRequest {
    @TestVisible
    global static String status;
    global CLMWorkflowRequest() {

    }
    @InvocableMethod(label='Start DocuSign CLM Workflow' description='Auto Send Agreement with DocuSign CLM Workflow')
    global static void sendAgreementwithDocuSignCLMWorkflow(List<dfsle.CLMWorkflowRequest.InvocableMethodRequest> requests) {

    }
global class InvocableMethodRequest {
    @InvocableVariable(label='Record Id' required=true)
    global Id recordId;
    @InvocableVariable(label='Workflow Name' required=true)
    global String workflowName;
    global InvocableMethodRequest() {

    }
}
}
