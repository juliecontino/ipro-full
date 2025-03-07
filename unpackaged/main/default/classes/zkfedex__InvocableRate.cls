/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class InvocableRate {
    global static Boolean STOP_INVOCABLE;
    global InvocableRate() {

    }
    @InvocableMethod(label='Get Rate (FedEx)' description='Get Rate.')
    global static void getRate(List<zkfedex.InvocableRate.RateParameter> inputList) {

    }
global class RateParameter {
    @InvocableVariable( required=true)
    global Id customAddressId;
    @InvocableVariable( required=true)
    global Id recordId;
    global RateParameter() {

    }
}
}
