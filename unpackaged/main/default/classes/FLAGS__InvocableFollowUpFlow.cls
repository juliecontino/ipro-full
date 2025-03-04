/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class InvocableFollowUpFlow {
    global InvocableFollowUpFlow() {

    }
    @InvocableMethod(label='Folow up Flow Invocable' description='Used to set Case flag and clear the Follow-Up field.')
    global static void followUpFlowInvocable(List<FLAGS.InvocableFollowUpFlow.FollowUpFlowParameters> paramsList) {

    }
global class FollowUpFlowParameters {
    @InvocableVariable(label='Case Record Id' description='CaseId used in the Follow-Up Flow Invocable Method.' required=true)
    global Id caseId;
    global FollowUpFlowParameters() {

    }
    global FollowUpFlowParameters(Id inputId) {

    }
}
}
