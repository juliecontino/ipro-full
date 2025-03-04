/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class ShipmentInterface {
    global ShipmentInterface() {

    }
    global static List<zkfedex.ShipmentRate> calculateRates(zkfedex__ShipmatePreference__c shipmatePreference, zkfedex__Shipment__c shipment, zkfedex__ShipmentSpecialServices__c specialServices, zkfedex__SmartPostDetails__c smartPostDetails, List<zkfedex__Package__c> packages) {
        return null;
    }
    @Future(callout=true)
    global static void createShipment(String jsonString) {

    }
    @Deprecated
    global static void createShipment(Id casId, Id recordId) {

    }
    global static void createShipmentSync(String jsonString) {

    }
    global static zkfedex.GlobalWebServiceResponse doPrintLabels(Map<Id,List<Attachment>> prefAttMap, Id userId) {
        return null;
    }
    global static zkfedex.GlobalWebServiceResponse doPrintLabels(Map<Id,List<zkfedex.FilesUtils.FileWrapper>> prefFileMap, Id userId) {
        return null;
    }
    global static Boolean fillPickupOnShipment(zkfedex__Shipment__c shipment, zkfedex__Pickup__c pickup) {
        return null;
    }
    global static zkfedex.PrinterInfo fillSelectedPrinter(Set<Id> prefIds, Id userId) {
        return null;
    }
    global static zkfedex.PickupInfo.PickupAvailabilityReply getPickupAvailability(zkfedex__ShipmatePreference__c shipmatePreference, zkfedex__Pickup__c pickupObject) {
        return null;
    }
    global static zkfedex.ScaleInfo getScaleInfo(zkfedex__ShipmatePreference__c preference) {
        return null;
    }
    global static zkfedex.PickupInfo.CreatePickupReply pickupCreate(zkfedex__ShipmatePreference__c shipmatePreference, zkfedex__Pickup__c pickupObject) {
        return null;
    }
    @Future(callout=true)
    global static void saveSelectedRateToCAS(String jsonString) {

    }
    @Deprecated
    global static void saveSelectedRateToCAS(Id casId, Id recordId) {

    }
    global static void saveSelectedRateToCASSync(String jsonString) {

    }
    global static List<zkfedex.TrackingInfo> searchTrackingInformation(Id preferenceId, Map<String,Object> params) {
        return null;
    }
    global static zkfedex.TrackingInfo trackShipment(String trackingNumber, zkfedex__ShipmatePreference__c preference, Boolean checkShipmentInOrg) {
        return null;
    }
    global static zkfedex.TrackingInfo trackShipment(String trackingNumber, Date shipDate, zkfedex__ShipmatePreference__c preference, Boolean checkShipmentInOrg) {
        return null;
    }
    @Future(callout=true)
    global static void trackShipmentFuture(String jsonString) {

    }
    @Deprecated
    global static void trackShipmentFuture(String trackingNumber, Id prefId, Date shipDate, Boolean createShipmentIfNotFound) {

    }
    global static void trackShipmentSync(String jsonString) {

    }
    global static zkfedex.ValidateAddressResult validateAddress(zkfedex__Shipment__c shipment, zkfedex__ShipmatePreference__c shipmatePreference, User user) {
        return null;
    }
    global static zkfedex.GlobalWebServiceResponse webServiceRequest(String requestName, User user, zkfedex__ShipmatePreference__c shipmatePreference) {
        return null;
    }
    global static zkfedex.GlobalWebServiceResponse webServiceRequest(String requestName, Map<String,Object> requestMap, User user, zkfedex__ShipmatePreference__c shipmatePreference) {
        return null;
    }
}
