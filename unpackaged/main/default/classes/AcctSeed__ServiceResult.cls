/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class ServiceResult {
    global String data {
        get;
        set;
    }
    global List<AcctSeed.ServiceResult.Error> errors {
        get;
        set;
    }
    global Boolean isSuccess {
        get;
        set;
    }
    global List<AcctSeed.ServiceResult> results {
        get;
        set;
    }
global class Error {
    global String code {
        get;
        set;
    }
    global String detail {
        get;
        set;
    }
    global Id id {
        get;
        set;
    }
    global Error() {

    }
}
}
