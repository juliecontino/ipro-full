/**
 * Unit Tests for Case Flags Chatter Triggers. Used to get code coveraged required for deployment.
 */
@isTest
private class CaseFlagsChatterTriggersTest {
    @isTest
    static void testTriggers() {
        Id userId = UserInfo.getUserId();

        FeedItem fi = new FeedItem(
            ParentId = userId,
            CreatedbyId = userId,
            Type = 'ContentPost',
            Body = 'Test Comment'
        );
        insert fi;

        FeedComment fc = new FeedComment(
            CreatedById = UserInfo.getUserId(),
            CommentBody = 'Test Comment',
            FeedItemId = fi.Id
        );
        insert fc;

        System.assertEquals(1, [SELECT COUNT() FROM FeedItem WHERE ParentId = :userId], 'Failed to created FeedItem.');
        System.assertEquals(1, [SELECT COUNT() FROM FeedComment WHERE FeedItemId = :fi.Id], 'Failed to created FeedComment.');
    }
}
