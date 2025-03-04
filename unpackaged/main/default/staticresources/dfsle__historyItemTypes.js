/**
 * History item type constant strings.
 * @namespace historyItemTypes
 */
window.historyItemTypes = (function () {
  var DocumentImportFromSalesforce = 'DocumentImportFromSalesforce';
  var DocumentExportedToSalesforce = 'DocumentExportedToSalesforce';
  var DocumentAdded = 'DocumentAdded';
  var TitleChanged = 'TitleChanged';
  var ExternalReviewInitiated = 'ExternalReviewInitiated';
  var ExternalReviewCompletedDocumentAndComments = 'ExternalReviewCompletedDocumentAndComments';
  var ExternalReviewCompletedCheckoutCancelled = 'ExternalReviewCompletedCheckoutCancelled';
  var ExternalReviewCompletedDocumentCheckin = 'ExternalReviewCompletedDocumentCheckin';
  var ExternalReviewCancelled = 'ExternalReviewCancelled';
  var ExternalReviewCompletedInternally = 'ExternalReviewCompletedInternally';
  var ExternalReviewErrored = 'ExternalReviewErrored';
  var ApprovalCheckout = 'ApprovalCheckout';
  var WorkflowApproved = 'WorkflowApproved';
  var WorkflowRejected = 'WorkflowRejected';
  var CompletedHumanActivity = 'CompletedHumanActivity';
  var ApprovalCanceledByUser = 'ApprovalCanceledByUser';
  var DocumentCheckIn = 'DocumentCheckIn';
  var ExternalReviewExpirationNew = 'ExternalReviewExpirationNew';

  //new Negotiate Api HistoryItem types

  var ApprovalCancelled = 'ApprovalCancelled';
  var ApprovalApproved = 'ApprovalApproved';
  var ApprovalRejected = 'ApprovalRejected';
  var DocumentRenamed = 'DocumentRenamed';
  var DocumentUploaded = 'DocumentUploaded';
  var DocumentImported = 'DocumentImported';
  var DocumentUploadedNewVersion = 'DocumentUploadedNewVersion';
  var ExternalReviewCompletedOnBehalfOf = 'ExternalReviewCompletedOnBehalfOf';
  var ExternalReviewExpired = 'ExternalReviewExpired';
  var ExternalReviewReviewed = 'ExternalReviewReviewed';
  var SentForApproval = 'SentForApproval';
  var SentForExternalReview = 'SentForExternalReview';

  return Object.freeze({
    DocumentImportFromSalesforce: DocumentImportFromSalesforce,
    DocumentExportedToSalesforce: DocumentExportedToSalesforce,
    DocumentAdded: DocumentAdded,
    TitleChanged: TitleChanged,
    ExternalReviewInitiated: ExternalReviewInitiated,
    ExternalReviewCompletedDocumentAndComments: ExternalReviewCompletedDocumentAndComments,
    ExternalReviewCompletedCheckoutCancelled: ExternalReviewCompletedCheckoutCancelled,
    ExternalReviewCompletedDocumentCheckin: ExternalReviewCompletedDocumentCheckin,
    ExternalReviewCancelled: ExternalReviewCancelled,
    ExternalReviewCompletedInternally: ExternalReviewCompletedInternally,
    ExternalReviewErrored: ExternalReviewErrored,
    ApprovalCheckout: ApprovalCheckout,
    WorkflowApproved: WorkflowApproved,
    WorkflowRejected: WorkflowRejected,
    CompletedHumanActivity: CompletedHumanActivity,
    ApprovalCanceledByUser: ApprovalCanceledByUser,
    DocumentCheckIn: DocumentCheckIn,
    ExternalReviewExpirationNew: ExternalReviewExpirationNew,
    ApprovalCancelled: ApprovalCancelled,
    ApprovalApproved: ApprovalApproved,
    ApprovalRejected: ApprovalRejected,
    DocumentRenamed: DocumentRenamed,
    DocumentUploaded: DocumentUploaded,
    DocumentImported: DocumentImported,
    DocumentUploadedNewVersion: DocumentUploadedNewVersion,
    ExternalReviewCompletedOnBehalfOf: ExternalReviewCompletedOnBehalfOf,
    ExternalReviewExpired: ExternalReviewExpired,
    ExternalReviewReviewed: ExternalReviewReviewed,
    SentForApproval: SentForApproval,
    SentForExternalReview: SentForExternalReview
  });
}());
