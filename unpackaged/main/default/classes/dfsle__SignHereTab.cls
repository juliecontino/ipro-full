/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class SignHereTab extends dfsle.SignatureTab {
    global Boolean isSeal {
        get;
    }
    global dfsle.SignHereTab.Stamp stamp {
        get;
    }
    global SignHereTab() {

    }
    global dfsle.SignHereTab withIsSeal(Boolean isSeal) {
        return null;
    }
    global dfsle.SignHereTab withStamp(dfsle.SignHereTab.Stamp stamp) {
        return null;
    }
global class DateStamp {
    global Integer height {
        get;
    }
    global Integer width {
        get;
    }
    global Integer x {
        get;
    }
    global Integer y {
        get;
    }
    global DateStamp(Integer x, Integer y, Integer width, Integer height) {

    }
}
global class Stamp {
    global String customField {
        get;
    }
    global dfsle.SignHereTab.DateStamp dateStamp {
        get;
    }
    global String externalId {
        get;
    }
    global String format {
        get;
    }
    global dfsle.SignHereTab.StampImage image {
        get;
    }
    global String phoneticName {
        get;
    }
    global String signatureName {
        get;
    }
    global String type {
        get;
    }
    global Stamp(String type, String externalId, String format, String signatureName, String phoneticName, dfsle.SignHereTab.StampImage image, dfsle.SignHereTab.DateStamp dateStamp, String customField) {

    }
}
global class StampImage {
    global String base64 {
        get;
    }
    global Boolean isResizable {
        get;
    }
    global Integer size {
        get;
    }
    global String type {
        get;
    }
    global String uri {
        get;
    }
    global StampImage(String type, String uri, String base64, Integer size, Boolean isResizable) {

    }
}
}
