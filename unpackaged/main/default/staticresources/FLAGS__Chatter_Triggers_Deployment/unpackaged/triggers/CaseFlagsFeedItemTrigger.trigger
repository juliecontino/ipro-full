/**
 * Case Flags Trigger for the FeedItem Object.
 */
trigger CaseFlagsFeedItemTrigger on FeedItem (after insert) {
    FLAGS.FeedItemTriggerHelper.handleTrigger();
}