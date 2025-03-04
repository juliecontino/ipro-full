/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class ValidateAddressResult {
    global List<zkfedex.ValidateAddressResult.AddressValidationDetail> addressValidationDetails;
    global String message {
        get;
        set;
    }
    global Boolean success {
        get;
        set;
    }
    global ValidateAddressResult() {

    }
global class AddressValidationChangeEntry {
    global String change {
        get;
        set;
    }
    global String name {
        get;
        set;
    }
    global String value {
        get;
        set;
    }
    global AddressValidationChangeEntry() {

    }
}
global class AddressValidationDetail {
    global Map<String,Boolean> attributes {
        get;
        set;
    }
    global List<zkfedex.ValidateAddressResult.AddressValidationChangeEntry> changeEntries {
        get;
        set;
    }
    global List<String> changes {
        get;
        set;
    }
    global String Classification {
        get;
        set;
    }
    global zkfedex.ValidateAddressResult.EffectiveAddress effectiveAddress {
        get;
        set;
    }
    global Boolean isDeliveryPointValid {
        get;
        set;
    }
    global Boolean isDeliveryPointValidationKnown {
        get;
        set;
    }
    global Boolean isResidential {
        get;
        set;
    }
    global Boolean isResidentialStatusKnown {
        get;
        set;
    }
    global zkfedex.ValidateAddressResult.ParsedPostalCode parsedPostalCode {
        get;
        set;
    }
    global zkfedex.ValidateAddressResult.ParsedStreetLine parsedStreetLine {
        get;
        set;
    }
    global Integer score {
        get;
        set;
    }
    global String State {
        get;
        set;
    }
    global AddressValidationDetail() {

    }
}
global class EffectiveAddress {
    global String City {
        get;
        set;
    }
    global String CountryCode {
        get;
        set;
    }
    global String CountryName {
        get;
        set;
    }
    global String PostalCode {
        get;
        set;
    }
    global Boolean Residential {
        get;
        set;
    }
    global String StateOrProvinceCode {
        get;
        set;
    }
    global List<String> StreetLines {
        get;
        set;
    }
    global String UrbanizationCode {
        get;
        set;
    }
    global EffectiveAddress() {

    }
}
global class ParsedPostalCode {
    global String AddOn {
        get;
        set;
    }
    global String Base {
        get;
        set;
    }
    global String DeliveryPoint {
        get;
        set;
    }
    global ParsedPostalCode() {

    }
}
global class ParsedStreetLine {
    global String Building {
        get;
        set;
    }
    global String HouseNumber {
        get;
        set;
    }
    global String LeadingDirectional {
        get;
        set;
    }
    global String Organization {
        get;
        set;
    }
    global String POBox {
        get;
        set;
    }
    global String PreStreetType {
        get;
        set;
    }
    global String RuralRoute {
        get;
        set;
    }
    global String StreetName {
        get;
        set;
    }
    global String StreetSuffix {
        get;
        set;
    }
    global String TrailingDirectional {
        get;
        set;
    }
    global String UnitLabel {
        get;
        set;
    }
    global String UnitNumber {
        get;
        set;
    }
    global ParsedStreetLine() {

    }
}
}
