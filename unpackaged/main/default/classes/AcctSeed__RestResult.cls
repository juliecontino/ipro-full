/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class RestResult {
    global List<AcctSeed.RestResult.RestErrorResult> errors {
        get;
    }
    global String id {
        get;
    }
    global Boolean isSuccess {
        get;
    }
    global RestResult(Boolean isSuccess, String id, List<AcctSeed.RestResult.RestErrorResult> errors) {

    }
global class RestErrorResult {
    global String message {
        get;
    }
    global String statusCode {
        get;
    }
    global RestErrorResult(String statusCode, String message) {

    }
}
}
