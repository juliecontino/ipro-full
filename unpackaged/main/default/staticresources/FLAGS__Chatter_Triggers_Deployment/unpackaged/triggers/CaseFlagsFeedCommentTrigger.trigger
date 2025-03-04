/**
 * Case Flags Trigger for the FeedComment Object.
 */
trigger CaseFlagsFeedCommentTrigger on FeedComment (after insert) {
    FLAGS.FeedCommentTriggerHelper.handleTrigger();
}