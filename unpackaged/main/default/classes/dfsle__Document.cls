/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global virtual class Document implements System.Comparable {
    global String extension {
        get;
    }
    global Id id {
        get;
    }
    global Datetime lastModified {
        get;
    }
    global String name {
        get;
    }
    global dfsle.Document.PdfOptions pdfOptions {
        get;
    }
    global dfsle.Document replacement {
        get;
    }
    global Integer sequence {
        get;
    }
    global static String SIGNER_ACKNOWLEDGEMENT_ACCEPT;
    global static String SIGNER_ACKNOWLEDGEMENT_NONE;
    global static String SIGNER_ACKNOWLEDGEMENT_READ_ACCEPT;
    global static String SIGNER_ACKNOWLEDGEMENT_VIEW;
    global static String SIGNER_ACKNOWLEDGEMENT_VIEW_ACCEPT;
    global Integer size {
        get;
    }
    global String sourceId {
        get;
    }
    global dfsle.Document.SupplementalOptions supplementalOptions {
        get;
    }
    global String type {
        get;
    }
    global static String TYPE_DOCUMENT;
    global static String TYPE_FILE;
    global static String TYPE_TEMPLATE;
    global static String WRITE_BACK_ENVELOPE_PDF;
    global static String WRITE_BACK_ENVELOPE_STATUS_PDF;
    global static String WRITE_BACK_NAME;
    global static String WRITE_BACK_NAME_ENVELOPE_STATUS;
    global static String WRITE_BACK_NAME_ENVELOPE_STATUS_PDF;
    global static String WRITE_BACK_NAME_ENVELOPE_STATUS_PDF_REPLACE_EXTENSION;
    global static String WRITE_BACK_NAME_PDF;
    global static String WRITE_BACK_NAME_PDF_REPLACE_EXTENSION;
    global Document(Id id, String type, Integer sequence, String name, String extension, Integer size, Datetime lastModified, String sourceId) {

    }
    global static dfsle.Document fromFile(ContentVersion file) {
        return null;
    }
    global static dfsle.Document fromTemplate(dfsle.UUID docuSignId, String name) {
        return null;
    }
    global virtual dfsle.Document withPdfOptions(dfsle.Document.PdfOptions pdfOptions) {
        return null;
    }
    global virtual dfsle.Document withReplacement(dfsle.Document replacement) {
        return null;
    }
    global virtual dfsle.Document withSupplementalOptions(dfsle.Document.SupplementalOptions supplementalOptions) {
        return null;
    }
global class Folder {
    global Id id {
        get;
    }
    global String name {
        get;
    }
    global Folder(Id id, String name) {

    }
}
global class Folders {
    global List<dfsle.Document> documents {
        get;
    }
    global List<dfsle.Document.Folder> folders {
        get;
    }
    global Folders(List<dfsle.Document.Folder> folders, List<dfsle.Document> documents) {

    }
}
global class PdfOptions {
    global Integer recipientSequence {
        get;
    }
    global Boolean transformFields {
        get;
    }
    global PdfOptions(Boolean transformFields, Integer recipientSequence) {

    }
}
global class SupplementalOptions {
    global Boolean includeInDownload {
        get;
    }
    global String signerAcknowledgement {
        get;
    }
    global SupplementalOptions(String signerAcknowledgement, Boolean includeInDownload) {

    }
}
global class WriteBack {
    global Boolean combineDocuments {
        get;
    }
    global Boolean includeCertificateOfCompletion {
        get;
    }
    global Id linkedEntityId {
        get;
    }
    global String nameFormat {
        get;
    }
    global WriteBack(Id linkedEntityId, String nameFormat, Boolean combineDocuments, Boolean includeCertificateOfCompletion) {

    }
}
}
